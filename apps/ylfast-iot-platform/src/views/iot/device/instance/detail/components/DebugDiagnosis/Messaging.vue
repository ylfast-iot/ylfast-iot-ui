<script setup lang="tsx">
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';
import type { ConfigPropertyMetadata } from '#/types/config-metadata';

import { computed, onUnmounted, ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { useVirtualList } from '@vueuse/core';
import {
  Button,
  Collapse,
  CollapsePanel,
  Empty,
  Input,
  List,
  message,
  Tabs,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { subscribeDeviceDebug } from '#/api/iot/device/device-monitor';
import {
  invokeDeviceFunction,
  readDeviceProperties,
  writeDeviceProperties,
} from '#/api/iot/device/instance';
import { getFormItemComponent } from '#/components/yl-data-type-strategies/value-input';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
}>();

const ListItem = List.Item;
const TabPane = Tabs.TabPane;

// Icons
const TerminalIcon = createIconifyIcon('lucide:terminal');
const SendIcon = createIconifyIcon('lucide:send');
const SearchIcon = createIconifyIcon('lucide:search');
const ClearIcon = createIconifyIcon('lucide:trash-2');
const UpIcon = createIconifyIcon('lucide:arrow-big-up-dash');
const DownIcon = createIconifyIcon('lucide:arrow-big-down-dash');

// State
const logs = ref<any[]>([]);
const activeDrawerTab = ref('property');
const selectedTslItem = ref<any>(null);
const selectedActionType = ref<string>('');
const commandValue = ref<any>(null);
const loading = ref(false);

// Virtual List
const {
  list: vLogs,
  containerProps,
  wrapperProps,
} = useVirtualList(logs, { itemHeight: 80 });

// TSL Parsing
const tsl = computed(() => {
  try {
    return JSON.parse(props.device.productTsl || '{}');
  } catch {
    return {};
  }
});

const properties = computed(() => tsl.value.properties || []);
const functions = computed(() => tsl.value.functions || []);

// Helper: Upstream Check
function isUpstream(op: string) {
  return [
    'decode',
    'event',
    'offline',
    'online',
    'reply',
    'report-property',
  ].includes(op);
}

// Subscribe to debug messages
const sub = subscribeDeviceDebug(props.device.id, (msg) => {
  console.error('Debug Message Received:', msg);
  const payload = {
    ...msg.payload,
    key: `${msg.payload.traceId}-${Date.now()}`, // Unique key for virtual list
  };
  logs.value.unshift(payload);
  if (logs.value.length > 500) {
    logs.value.pop();
  }
});

onUnmounted(() => {
  sub.unsubscribe();
});

function handleClearLogs() {
  logs.value = [];
}

// Helper: Convert TSL DataType to ConfigPropertyMetadata
function convertDataTypeToMetadata(item: any): ConfigPropertyMetadata {
  return {
    property: item.id,
    name: item.name,
    type: item.dataType || item.valueType,
  } as ConfigPropertyMetadata;
}

const currentMetadata = computed(() => {
  if (!selectedTslItem.value)
    return {
      property: 'unknown',
      type: { type: 'STRING' },
    } as ConfigPropertyMetadata;
  // For functions, use inputs if dealing with invoke params
  if (selectedActionType.value === 'function') {
    return {
      property: 'params',
      name: 'Parameters',
      type: { type: 'STRING' }, // Fallback to raw JSON string for complex function inputs for now
    } as ConfigPropertyMetadata;
  }
  return convertDataTypeToMetadata(selectedTslItem.value);
});

// Dynamic Input Component
const strategyComponent = computed(() => {
  if (selectedActionType.value === 'function') return Input.TextArea;
  return getFormItemComponent(currentMetadata.value.type.type);
});

function handleSelect(item: any, type: string) {
  selectedTslItem.value = item;
  selectedActionType.value = type;
  commandValue.value = null;
}

function getAccessMode(item: any) {
  return item.accessMode || 'rw';
}

async function handleInvoke() {
  if (!selectedTslItem.value) return;

  loading.value = true;
  const deviceId = props.device.id;
  const id = selectedTslItem.value.id;

  try {
    switch (selectedActionType.value) {
      case 'function': {
        let params = commandValue.value;
        if (typeof params === 'string') {
          try {
            params = JSON.parse(params);
          } catch {}
        }
        // Simple format
        const formattedParams = Object.entries(params || {}).map(
          ([name, value]) => ({ name, value }),
        );
        await invokeDeviceFunction({
          deviceId,
          functionId: id,
          messageType: 'INVOKE_FUNCTION',
          params: formattedParams,
        });
        message.success($t('device.debug.messaging.invoke_sent'));

        break;
      }
      case 'property-read': {
        await readDeviceProperties({
          deviceId,
          messageType: 'READ_PROPERTY',
          properties: [id],
        });
        message.success($t('device.debug.messaging.query_sent'));

        break;
      }
      case 'property-write': {
        await writeDeviceProperties({
          deviceId,
          messageType: 'WRITE_PROPERTY',
          properties: { [id]: commandValue.value },
        });
        message.success($t('device.debug.messaging.set_sent'));

        break;
      }
      // No default
    }
  } catch (error: any) {
    message.error(error.message);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="relative flex h-full gap-4 overflow-hidden p-1">
    <!-- Chat Area (Single Stream) -->
    <div
      class="flex flex-1 flex-col overflow-hidden rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between border-b bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/50"
      >
        <div class="flex items-center gap-2">
          <div
            class="flex items-center gap-1.5 rounded border border-orange-100 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-500 dark:border-orange-900 dark:bg-orange-950/30"
          >
            <UpIcon class="size-3.5" />
            {{ $t('device.debug.messaging.upstream') }}
          </div>
          <div
            class="flex items-center gap-1.5 rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-500 dark:border-blue-900 dark:bg-blue-950/30"
          >
            <DownIcon class="size-3.5" />
            {{ $t('device.debug.messaging.downstream') }}
          </div>
        </div>
        <div class="flex items-center gap-3">
          <Tag class="mr-0">{{ logs.length }}</Tag>
          <Tooltip :title="$t('device.instance.monitor.clearLog')">
            <Button
              size="small"
              type="text"
              danger
              @click="handleClearLogs"
              class="!flex items-center justify-center"
            >
              <ClearIcon class="size-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <!-- Log List -->
      <div
        v-bind="containerProps"
        class="custom-scrollbar h-full flex-1 overflow-y-auto bg-gray-50/30 p-4 dark:bg-black/20"
      >
        <div v-bind="wrapperProps">
          <div
            v-for="item in vLogs"
            :key="item.data.key"
            class="mb-4 flex w-full"
            :class="
              isUpstream(item.data.operation) ? 'justify-start' : 'justify-end'
            "
          >
            <!-- Chat Bubble -->
            <div
              class="flex w-1/2 flex-col gap-1"
              :class="
                isUpstream(item.data.operation) ? 'items-start' : 'items-end'
              "
            >
              <!-- Meta Info -->
              <div
                class="flex items-center gap-2 px-1 font-mono text-[10px] text-gray-400"
              >
                <span v-if="!isUpstream(item.data.operation)">{{
                  new Date(item.data.startTime).toLocaleTimeString()
                }}</span>
                <!-- Translated Operation Type -->
                <span>{{
                  $t(`device.debug.messaging.type.${item.data.operation}`) ||
                  item.data.operation
                }}</span>
                <span v-if="isUpstream(item.data.operation)">{{
                  new Date(item.data.startTime).toLocaleTimeString()
                }}</span>
              </div>

              <!-- Card Content -->
              <div
                class="w-full overflow-hidden rounded-lg border shadow-sm transition-all duration-200"
                :class="[
                  isUpstream(item.data.operation)
                    ? 'rounded-tl-none border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                    : 'rounded-tr-none border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10',
                ]"
              >
                <Collapse ghost>
                  <CollapsePanel :key="item.data.key" class="!border-0 !p-0">
                    <template #header>
                      <div
                        class="flex w-full items-center gap-2 overflow-hidden py-1"
                      >
                        <!-- Refined Tag: Upstream=Orange(Warning)/Green(Success), Downstream=Blue(Primary) -->
                        <Tag
                          :color="
                            item.data.error
                              ? 'error'
                              : isUpstream(item.data.operation)
                                ? 'orange'
                                : 'processing'
                          "
                          class="!mr-0 shrink-0 origin-left scale-90 border-0 font-bold"
                        >
                          {{
                            item.data.error
                              ? $t('device.debug.status_error')
                              : isUpstream(item.data.operation)
                                ? $t('device.debug.messaging.direction.up')
                                : $t('device.debug.messaging.direction.down')
                          }}
                        </Tag>
                        <span
                          class="flex-1 truncate font-mono text-xs text-gray-500"
                          :title="item.data.traceId"
                        >
                          {{ item.data.traceId }}
                        </span>
                        <span
                          v-if="item.data.error"
                          class="px-2 text-xs font-bold text-red-500"
                        >
                          {{ $t('device.debug.exec_failed') }}
                        </span>
                      </div>
                    </template>
                    <div
                      class="m-2 mt-0 overflow-x-auto rounded border border-black/5 bg-gray-50 p-2 pt-0 font-mono text-xs dark:border-white/5 dark:bg-black/20"
                    >
                      <pre class="whitespace-pre-wrap break-all">{{
                        JSON.stringify(item.data.detail, null, 2)
                      }}</pre>
                    </div>
                  </CollapsePanel>
                </Collapse>
              </div>
            </div>
          </div>
          <Empty
            v-if="logs.length === 0"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
            :description="$t('device.debug.messaging.placeholder')"
            class="mt-20 opacity-50"
          />
        </div>
      </div>
    </div>

    <!-- Debug Panel (Persistent Right Column) -->
    <div
      class="flex w-[380px] shrink-0 flex-col overflow-hidden rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div
        class="border-b bg-gray-50 p-3 text-sm font-bold dark:border-gray-800 dark:bg-gray-800/50"
      >
        {{ $t('device.debug.messaging.send_instruction') }}
      </div>

      <div class="flex min-h-0 flex-1 flex-col">
        <!-- TSL Selection List -->
        <div
          class="flex h-[45%] min-h-[200px] flex-col border-b dark:border-gray-800"
        >
          <Tabs
            v-model:active-key="activeDrawerTab"
            class="px-2"
            size="small"
            :tab-bar-style="{ marginBottom: '0px' }"
          >
            <TabPane key="property" :tab="$t('device.instance.tab.property')">
              <div class="flex h-full flex-col bg-gray-50/30 dark:bg-black/20">
                <div class="p-2 pb-0">
                  <Input
                    :placeholder="$t('common.search')"
                    class="mb-2"
                    size="small"
                    allow-clear
                  >
                    <template #prefix>
                      <SearchIcon class="size-3 text-gray-300" />
                    </template>
                  </Input>
                </div>
                <div
                  class="custom-scrollbar h-[200px] flex-1 overflow-y-auto px-2 pb-2"
                >
                  <List :data-source="properties" size="small" :split="false">
                    <template #renderItem="{ item }">
                      <ListItem
                        class="group !mb-1 cursor-pointer rounded border border-transparent !p-1.5 transition-all hover:border-gray-200 hover:bg-white dark:hover:border-gray-700 dark:hover:bg-gray-800"
                        :class="
                          selectedTslItem?.id === item.id
                            ? '!border-primary/20 !bg-primary/5'
                            : ''
                        "
                      >
                        <div class="flex w-full items-center justify-between">
                          <div class="flex flex-col overflow-hidden">
                            <span
                              class="truncate text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              {{ item.name }}
                            </span>
                            <span
                              class="truncate font-mono text-[10px] text-gray-400"
                            >
                              {{ item.id }}
                            </span>
                          </div>
                          <div
                            class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                            :class="
                              selectedTslItem?.id === item.id
                                ? '!opacity-100'
                                : ''
                            "
                            @click.stop
                          >
                            <Tooltip :title="$t('device.debug.messaging.read')">
                              <Button
                                v-if="getAccessMode(item).includes('r')"
                                size="small"
                                type="text"
                                class="flex !h-6 items-center justify-center !px-1"
                                @click="handleSelect(item, 'property-read')"
                                :class="
                                  selectedTslItem?.id === item.id &&
                                  selectedActionType === 'property-read'
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-500 hover:text-primary'
                                "
                              >
                                R
                              </Button>
                            </Tooltip>
                            <Tooltip
                              :title="$t('device.debug.messaging.write')"
                            >
                              <Button
                                v-if="getAccessMode(item).includes('w')"
                                size="small"
                                type="text"
                                class="flex !h-6 items-center justify-center !px-1"
                                @click="handleSelect(item, 'property-write')"
                                :class="
                                  selectedTslItem?.id === item.id &&
                                  selectedActionType === 'property-write'
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-500 hover:text-primary'
                                "
                              >
                                W
                              </Button>
                            </Tooltip>
                          </div>
                        </div>
                      </ListItem>
                    </template>
                  </List>
                </div>
              </div>
            </TabPane>
            <TabPane key="function" :tab="$t('device.instance.tab.functions')">
              <div class="custom-scrollbar h-[240px] overflow-y-auto p-2">
                <List :data-source="functions" size="small" :split="false">
                  <template #renderItem="{ item }">
                    <ListItem
                      class="!mb-1 cursor-pointer rounded border border-transparent !p-2 transition-all hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-800"
                      :class="
                        selectedTslItem?.id === item.id
                          ? '!border-primary/20 !bg-primary/5'
                          : ''
                      "
                      @click="handleSelect(item, 'function')"
                    >
                      <div class="flex items-center gap-2">
                        <TerminalIcon class="size-4 text-purple-500" />
                        <div class="flex flex-col">
                          <span
                            class="text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            {{ item.name }}
                          </span>
                          <span class="font-mono text-[10px] text-gray-400">{{
                            item.id
                          }}</span>
                        </div>
                      </div>
                    </ListItem>
                  </template>
                </List>
              </div>
            </TabPane>
          </Tabs>
        </div>

        <!-- Strategy Input Area -->
        <div
          class="flex min-h-0 flex-1 flex-col overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900/50"
        >
          <div
            v-if="selectedTslItem"
            class="flex h-full flex-col gap-4 animate-in fade-in slide-in-from-bottom-2"
          >
            <!-- Header Info -->
            <div
              class="flex items-center gap-2 border-b pb-2 dark:border-gray-800"
            >
              <div class="flex flex-col">
                <span class="text-sm font-bold">{{
                  selectedTslItem.name
                }}</span>
                <span class="font-mono text-[10px] text-gray-400">{{
                  selectedTslItem.id
                }}</span>
              </div>
              <div class="ml-auto flex gap-1">
                <Tag class="mr-0">
                  {{ selectedTslItem.dataType?.type || 'Function' }}
                </Tag>
                <Tag color="processing" class="mr-0" v-if="selectedActionType">
                  {{
                    selectedActionType === 'property-read'
                      ? 'READ'
                      : selectedActionType === 'property-write'
                        ? 'WRITE'
                        : 'CALL'
                  }}
                </Tag>
              </div>
            </div>

            <!-- Input Zone -->
            <div class="flex min-h-0 flex-1 flex-col gap-2">
              <div
                v-if="selectedActionType === 'property-read'"
                class="flex flex-1 items-center justify-center rounded-md border border-dashed bg-gray-100/50 text-sm text-gray-500 dark:bg-gray-800/30"
              >
                <div class="px-4 text-center">
                  <div class="mb-2">⚠️</div>
                  {{ $t('device.debug.messaging.read_instruction') }}
                </div>
              </div>

              <div v-else class="flex h-full flex-col gap-2">
                <span class="text-xs font-medium uppercase text-gray-500">
                  {{
                    selectedActionType === 'function'
                      ? $t('device.debug.messaging.params_input')
                      : $t('device.debug.messaging.write_value')
                  }}
                </span>
                <div
                  class="flex-1 overflow-y-auto rounded-md border bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <component
                    :is="strategyComponent"
                    v-if="strategyComponent"
                    :prop="currentMetadata"
                    v-model:value="commandValue"
                    class="w-full !text-sm"
                    :rows="4"
                  />
                  <div v-else class="text-xs text-red-500">
                    No Strategy Component Found
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Button -->
            <Button
              block
              type="primary"
              :loading="loading"
              @click="handleInvoke"
              class="mt-auto shadow-md shadow-primary/20"
            >
              <template #icon><SendIcon class="size-4" /></template>
              {{ $t('device.debug.messaging.invoke') }}
            </Button>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="flex flex-1 select-none flex-col items-center justify-center text-gray-400"
          >
            <TerminalIcon class="mb-4 size-16 opacity-10" />
            <span class="max-w-[200px] text-center text-xs leading-relaxed">
              {{ $t('device.debug.messaging.commandTip') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.ant-collapse-header) {
  align-items: center !important;
  padding: 8px !important;
}

:deep(.ant-collapse-content-box) {
  padding: 0 !important;
}

:deep(.ant-tabs-nav) {
  margin-bottom: 0 !important;
}

/* Ensure proper height for virtual list container */
.custom-scrollbar {
  min-height: 200px;
}
</style>
