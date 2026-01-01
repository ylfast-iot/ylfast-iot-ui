<script setup lang="ts">
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';

import { computed, onMounted, onUnmounted, ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  Empty,
  Input,
  message,
  Spin,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { readDeviceProperties } from '#/api/iot/device/instance';
import { getWebSocket } from '#/utils/websoket';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
}>();

const RefreshIcon = createIconifyIcon('lucide:refresh-cw');
const ClockIcon = createIconifyIcon('lucide:clock');

const properties = computed(() => {
  if (!props.device?.tsl) return [];
  try {
    const tsl =
      typeof props.device.tsl === 'string'
        ? JSON.parse(props.device.tsl)
        : props.device.tsl;
    return tsl.properties || [];
  } catch {
    return [];
  }
});

const searchText = ref('');
const filteredProperties = computed(() => {
  return properties.value.filter(
    (p: any) =>
      p.name.includes(searchText.value) || p.id.includes(searchText.value),
  );
});

const values = ref<Record<string, { time: number; value: any }>>({});
const loading = ref(false);
const refreshLoading = ref<Record<string, boolean>>({});
let sub: any = null;

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
    const item = vt.enums?.find((e: any) => e.value === val);
    return item?.label || item?.text || val;
  }

  if (type === 'DATE') {
    const format = p.valueType?.date?.format || 'YYYY-MM-DD HH:mm:ss';
    return dayjs(val).format(
      format === 'timestamp' ? 'YYYY-MM-DD HH:mm:ss' : format,
    );
  }

  if (type === 'OBJECT' || type === 'ARRAY') {
    return typeof val === 'object' ? JSON.stringify(val) : val;
  }

  return val;
}

async function fetchAll() {
  if (!props.device?.id || properties.value.length === 0) return;
  loading.value = true;
  try {
    const ids = properties.value.map((p: any) => p.id);
    const res = await readDeviceProperties({
      deviceId: props.device.id,
      messageType: 'READ_PROPERTY',
      properties: ids,
    });
    // @ts-ignore
    if (res.properties) {
      // @ts-ignore
      Object.entries(res.properties).forEach(([k, v]) => {
        values.value[k] = { value: v, time: res.timestamp || Date.now() };
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

async function handleRead(propertyId: string) {
  if (!props.device?.id) return;
  refreshLoading.value[propertyId] = true;
  try {
    const res = await readDeviceProperties({
      deviceId: props.device.id,
      messageType: 'READ_PROPERTY',
      properties: [propertyId],
    });
    // @ts-ignore
    if (res.properties && res.properties[propertyId] !== undefined) {
      // @ts-ignore
      values.value[propertyId] = {
        // @ts-ignore
        value: res.properties[propertyId],
        time: res.timestamp || Date.now(),
      };
      message.success('读取成功');
    }
  } catch (error) {
    console.error(error);
  } finally {
    refreshLoading.value[propertyId] = false;
  }
}

function subscribe() {
  if (!props.device?.id) return;
  // 订阅设备的属性上报和读取回复
  const topic = `/device/${props.device.id}/**`;
  sub = getWebSocket(`device-monitor-${props.device.id}`, topic, {}).subscribe(
    (msg: any) => {
      const payload = msg.payload;
      if (!payload) return;

      if (
        payload.messageType === 'REPORT_PROPERTY' ||
        payload.messageType === 'READ_PROPERTY_REPLY'
      ) {
        const propsData = payload.properties;
        if (propsData) {
          Object.entries(propsData).forEach(([k, v]) => {
            values.value[k] = {
              value: v,
              time: payload.timestamp || Date.now(),
            };
          });
        }
      }
    },
  );
}

onMounted(() => {
  fetchAll();
  subscribe();
});

onUnmounted(() => {
  sub?.unsubscribe();
});
</script>

<template>
  <div class="flex h-full flex-col bg-gray-50/50 p-4 dark:bg-transparent">
    <!-- Toolbar -->
    <div class="mb-4 flex items-center justify-between gap-4">
      <Input.Search
        v-model:value="searchText"
        allow-clear
        placeholder="搜索属性名称或ID"
        style="width: 320px"
      />
      <div class="flex items-center gap-2">
        <Button :loading="loading" type="primary" @click="fetchAll">
          全部刷新
        </Button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto">
      <Spin :spinning="loading">
        <div
          v-if="filteredProperties.length > 0"
          class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <Card
            v-for="p in filteredProperties"
            :key="p.id"
            class="property-card overflow-hidden transition-all hover:shadow-md"
            size="small"
          >
            <template #title>
              <div class="flex items-center justify-between overflow-hidden">
                <Tooltip :title="p.name">
                  <span
                    class="truncate font-bold text-gray-700 dark:text-gray-200"
                  >
                    {{ p.name }}
                  </span>
                </Tooltip>
                <span class="ml-2 shrink-0 font-mono text-[10px] text-gray-400">
                  {{ p.id }}
                </span>
              </div>
            </template>

            <template #extra>
              <Tooltip
                v-if="p.source?.accessType?.includes('READ')"
                title="读取最新值"
              >
                <div
                  class="cursor-pointer text-primary transition-colors hover:text-primary-hover"
                  :class="{ 'animate-spin': refreshLoading[p.id] }"
                  @click="handleRead(p.id)"
                >
                  <RefreshIcon class="size-3.5" />
                </div>
              </Tooltip>
            </template>

            <div class="flex flex-col items-center justify-center py-6">
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-bold text-primary">
                  {{ formatValue(p, values[p.id]?.value) }}
                </span>
                <span
                  v-if="p.valueType?.unit"
                  class="text-xs font-normal text-gray-400"
                >
                  {{ p.valueType.unit }}
                </span>
              </div>
              <div class="mt-3 flex flex-col items-center gap-1">
                <div
                  class="flex items-center gap-1.5 text-[10px] text-gray-400"
                >
                  <ClockIcon class="size-3" />
                  <span>
                    {{
                      values[p.id]?.time
                        ? dayjs(values[p.id]?.time).format('HH:mm:ss')
                        : '从未更新'
                    }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Footer Action (Optional, e.g. for writeable properties) -->
            <div
              v-if="p.source?.accessType?.includes('WRITE')"
              class="border-t border-gray-100 bg-gray-50/30 p-2 text-center dark:border-gray-800 dark:bg-gray-900/30"
            >
              <Button size="small" type="link" class="h-auto p-0 !text-[11px]">
                下发指令
              </Button>
            </div>
          </Card>
        </div>
        <Empty v-else description="暂无匹配属性" />
      </Spin>
    </div>
  </div>
</template>

<style scoped>
.property-card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.dark .property-card {
  background: #1d1d1d;
  border-color: #303030;
}

:deep(.ant-card-head) {
  min-height: 38px;
  padding: 0 12px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.dark :deep(.ant-card-head) {
  background: #262626;
  border-bottom-color: #303030;
}

:deep(.ant-card-head-title) {
  padding: 8px 0;
}
</style>
