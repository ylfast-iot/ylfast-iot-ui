<script setup lang="ts">
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';
import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { DeviceMetadata } from '#/types/metadata';

import { computed, onUnmounted, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Card,
  Empty,
  Input,
  message,
  Modal,
  Spin,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { getLastDeviceMessageMeasurementValue } from '#/api/iot/device/data';
import { subscribeDeviceMessageMonitor } from '#/api/iot/device/device-monitor';
import {
  readDeviceProperties,
  writeDeviceProperties,
} from '#/api/iot/device/instance';
import { getFormItemComponent } from '#/components/yl-data-type-strategies/value-input';
import { useUnit } from '#/hooks';

import PropertyHistoryModal from './PropertyHistoryModal.vue';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
  groupId: string;
  metadata: DeviceMetadata;
}>();

// const emit = defineEmits(['refresh']);

const RefreshIcon = createIconifyIcon('lucide:refresh-cw');
const ClockIcon = createIconifyIcon('lucide:clock');
const ActivityIcon = createIconifyIcon('lucide:activity');
const SearchIcon = createIconifyIcon('lucide:search');
const EditIcon = createIconifyIcon('lucide:file-pen-line');
const TrendIcon = createIconifyIcon('lucide:line-chart');

const searchText = ref('');
const loading = ref(false);
const propertyValues = ref<Record<string, { time: number; value: any }>>({});
const readLoading = ref<Record<string, boolean>>({});

// Write Modal State
const writeModalVisible = ref(false);
const writeLoading = ref(false);
const currentWriteProperty = ref<any>(null);
const writeValue = ref<any>(null);

// History Modal State
const historyModalVisible = ref(false);
const currentHistoryProperty = ref<any>(null);

const currentProperties = computed(() => {
  let list = props.metadata.properties || [];

  // Filter by Group
  if (props.groupId !== 'all') {
    list = list.filter((p) => p.expands?.groupId === props.groupId);
  }

  // Filter by Search
  if (searchText.value) {
    const lower = searchText.value.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.id.toLowerCase().includes(lower),
    );
  }
  return list;
});

function formatValue(p: any, val: any) {
  if (val === undefined || val === null) return '--';
  const type = p.valueType?.type;

  if (type === 'BOOLEAN') {
    const vt = p.valueType;
    const isTrue = val === true || val === 'true' || val === vt.trueValue;
    return isTrue ? vt.trueText || '是' : vt.falseText || '否';
  }
  if (type === 'ENUM') {
    const vt = p.valueType;
    const item = vt.elements?.find((e: any) => e.value === val);
    return item?.text || val;
  }
  if (type === 'DATE') {
    return dayjs(val).format('YYYY-MM-DD HH:mm:ss');
  }
  if (type === 'OBJECT' || type === 'ARRAY') {
    return typeof val === 'object' ? JSON.stringify(val) : val;
  }
  return val;
}

// Permission Helpers
function canRead(p: any) {
  return p.source?.accessType?.includes('READ');
}

function canWrite(p: any) {
  return p.source?.accessType?.includes('WRITE');
}

// Convert to ConfigPropertyMetadata for ObjectInput
function getObjectProp(p: any): ConfigPropertyMetadata {
  return {
    property: p.id,
    name: p.name,
    type: p.valueType,
  } as ConfigPropertyMetadata;
}

// Actions
async function handleReadProperty(propertyId: string) {
  if (!props.device?.id) return;
  readLoading.value[propertyId] = true;
  try {
    const res = await readDeviceProperties({
      deviceId: props.device.id,
      messageType: 'READ_PROPERTY',
      properties: [propertyId],
    });
    // @ts-ignore
    if (res.properties && res.properties[propertyId] !== undefined) {
      // @ts-ignore
      propertyValues.value[propertyId] = {
        // @ts-ignore
        value: res.properties[propertyId],
        time: res.timestamp || Date.now(),
      };
      message.success($t('common.success'));
    }
  } catch (error) {
    console.error(error);
  } finally {
    readLoading.value[propertyId] = false;
  }
}

function openWriteModal(p: any) {
  currentWriteProperty.value = p;
  // Initialize with current value if available, or default
  writeValue.value = propertyValues.value[p.id]?.value;
  writeModalVisible.value = true;
}

function openHistoryModal(p: any) {
  currentHistoryProperty.value = p;
  historyModalVisible.value = true;
}

function validateInput(prop: any, val: any) {
  if (!prop) return false;
  const { valueType } = prop;

  if (valueType?.type === 'OBJECT') {
    // Validate Object Required Fields
    const fields = valueType.properties || [];
    for (const field of fields) {
      if (field.expands?.required) {
        const fVal = val?.[field.id];
        if (fVal === undefined || fVal === null || fVal === '') {
          message.warning(
            `${field.name || field.id} ${$t('thingModel.common.required')}`,
          );
          return false;
        }
      }
    }
  } else {
    // Validate Single Value (not null/undefined)
    if (val === undefined || val === null) {
      message.warning(
        `${prop.name || prop.id} ${$t('thingModel.common.required')}`,
      );
      return false;
    }
  }
  return true;
}

async function handleWriteSubmit() {
  if (!props.device?.id || !currentWriteProperty.value) return;

  // Validation
  if (!validateInput(currentWriteProperty.value, writeValue.value)) {
    return;
  }

  const propId = currentWriteProperty.value.id;
  writeLoading.value = true;
  try {
    await writeDeviceProperties({
      deviceId: props.device.id,
      messageType: 'WRITE_PROPERTY',
      properties: {
        [propId]: writeValue.value,
      },
    });
    message.success($t('common.success'));
    writeModalVisible.value = false;
    // Optionally read back to confirm, but WS should handle it
  } catch (error) {
    console.error(error);
  } finally {
    writeLoading.value = false;
  }
}

// --- Subscription Logic ---
let sub: any = null;

async function fetchInitialData() {
  if (!props.device?.id || currentProperties.value.length === 0) return;

  loading.value = true;
  try {
    const ids = currentProperties.value.map((p) => p.id);
    const res = await getLastDeviceMessageMeasurementValue(
      props.device.id,
      props.device.productId, // Use productId if needed by API
      ids,
    );

    if (res && Array.isArray(res)) {
      res.forEach((item) => {
        const data = item.data as any;
        if (data) {
          propertyValues.value[data.property] = {
            value: data.formatValue ?? data.value,
            time: data.timestamp || Date.now(),
          };
        }
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function startSubscribe() {
  if (sub) {
    sub.unsubscribe();
    sub = null;
  }

  if (!props.device?.id || currentProperties.value.length === 0) return;

  const ids = currentProperties.value.map((p) => p.id);
  sub = subscribeDeviceMessageMonitor(
    props.device.id,
    props.device.productId,
    ids,
    (msg) => {
      const payload = msg.payload;
      const data = payload.value;
      if (data && data.property) {
        propertyValues.value[data.property] = {
          value: data.value,
          time: data.timestamp || Date.now(),
        };
      }
    },
  );
}

const { getSymbol } = useUnit();

function refresh() {
  fetchInitialData();
  startSubscribe();
}

watch(
  [() => props.groupId, () => props.device.id],
  () => {
    refresh();
  },
  { immediate: true },
);

onUnmounted(() => {
  if (sub) {
    sub.unsubscribe();
    sub = null;
  }
});
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <div
      class="flex flex-col gap-3 border-b border-border/50 bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <div class="flex items-center gap-2">
        <ActivityIcon class="size-5 text-primary" />
        <span class="font-bold">{{
          $t('device.instance.monitor.realTimeProperty')
        }}</span>
      </div>
      <div class="flex w-full items-center justify-end gap-3 sm:w-auto">
        <Input
          v-model:value="searchText"
          :placeholder="$t('device.instance.monitor.searchProperty')"
          class="flex-1 rounded-md sm:w-64 sm:flex-initial"
          allow-clear
        >
          <template #prefix>
            <SearchIcon class="size-4 text-muted-foreground" />
          </template>
        </Input>
        <Tooltip :title="$t('common.action.refresh')">
          <div
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary active:scale-95"
            @click="refresh"
          >
            <RefreshIcon :class="{ 'animate-spin': loading }" class="size-4" />
          </div>
        </Tooltip>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <Spin :spinning="loading">
        <div
          v-if="currentProperties.length > 0"
          class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <Card
            v-for="p in currentProperties"
            :key="p.id"
            class="group overflow-hidden rounded-lg border-border/60 transition-all hover:border-primary/30 hover:shadow-md"
            size="small"
            :body-style="{ padding: '0' }"
          >
            <div class="flex h-full flex-col">
              <!-- Card Header -->
              <div
                class="flex items-center justify-between border-b border-border/30 bg-muted/10 px-4 py-3"
              >
                <div class="flex flex-col overflow-hidden pr-2">
                  <Tooltip :title="p.name">
                    <span class="truncate font-medium">{{ p.name }}</span>
                  </Tooltip>
                  <span
                    class="truncate font-mono text-[10px] text-muted-foreground"
                  >
                    {{ p.id }}
                  </span>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <Tooltip :title="$t('device.instance.monitor.historyTrend')">
                    <div
                      class="cursor-pointer text-muted-foreground transition-colors hover:text-primary"
                      @click="openHistoryModal(p)"
                    >
                      <TrendIcon class="size-4" />
                    </div>
                  </Tooltip>
                  <Tooltip
                    v-if="canRead(p)"
                    :title="$t('device.instance.monitor.readProperty')"
                  >
                    <div
                      class="cursor-pointer text-muted-foreground transition-colors hover:text-primary"
                      :class="{ 'animate-spin': readLoading[p.id] }"
                      @click="handleReadProperty(p.id)"
                    >
                      <RefreshIcon class="size-4" />
                    </div>
                  </Tooltip>
                  <Tooltip
                    v-if="canWrite(p)"
                    :title="$t('device.instance.monitor.writeProperty')"
                  >
                    <div
                      class="cursor-pointer text-muted-foreground transition-colors hover:text-primary"
                      @click="openWriteModal(p)"
                    >
                      <EditIcon class="size-4" />
                    </div>
                  </Tooltip>
                </div>
              </div>

              <!-- Card Body -->
              <div class="flex flex-1 flex-col justify-center px-5 py-5">
                <div class="flex w-full items-baseline gap-1.5">
                  <Tooltip
                    :title="formatValue(p, propertyValues[p.id]?.value)"
                    placement="topLeft"
                  >
                    <span
                      class="truncate text-3xl font-bold tracking-tight text-primary"
                    >
                      {{ formatValue(p, propertyValues[p.id]?.value) }}
                    </span>
                  </Tooltip>
                  <span
                    v-if="(p.valueType as any)?.unit"
                    class="shrink-0 text-lg font-medium text-muted-foreground/80"
                  >
                    {{ getSymbol((p.valueType as any).unit) }}
                  </span>
                </div>

                <div
                  class="mt-5 flex flex-col gap-1 border-t border-dashed border-border/60 pt-3"
                >
                  <span
                    class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60"
                  >
                    {{ $t('device.instance.monitor.updateTime') }}
                  </span>
                  <div class="flex items-center gap-1.5 text-muted-foreground">
                    <ClockIcon class="size-3.5" />
                    <span class="font-mono text-sm">
                      {{
                        propertyValues[p.id]?.time
                          ? dayjs(propertyValues[p.id]?.time).format(
                              'YYYY-MM-DD HH:mm:ss',
                            )
                          : $t('device.instance.monitor.neverUpdated')
                      }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        <Empty
          v-else
          :description="$t('device.instance.monitor.noProperty')"
          class="mt-20"
        />
      </Spin>
    </div>

    <!-- Write Property Modal -->
    <Modal
      v-model:open="writeModalVisible"
      :title="`${$t('device.instance.monitor.writeProperty')}: ${currentWriteProperty?.name}`"
      :confirm-loading="writeLoading"
      @ok="handleWriteSubmit"
    >
      <div v-if="currentWriteProperty" class="py-4">
        <div class="mb-2 text-sm text-muted-foreground">
          {{ $t('device.instance.monitor.inputValue') }}
          <span class="font-mono font-bold text-foreground">
            {{ currentWriteProperty.name }} ({{ currentWriteProperty.id }})
          </span>
          :
        </div>
        <component
          :is="getFormItemComponent(currentWriteProperty.valueType.type)"
          v-if="
            currentWriteProperty &&
            getFormItemComponent(currentWriteProperty.valueType.type)
          "
          v-model:value="writeValue"
          :prop="getObjectProp(currentWriteProperty)"
        />
      </div>
    </Modal>

    <!-- History Modal -->
    <PropertyHistoryModal
      v-if="historyModalVisible"
      v-model:open="historyModalVisible"
      :device="device"
      :property="currentHistoryProperty"
    />
  </div>
</template>
