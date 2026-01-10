<script setup lang="ts">
import type { Subscription } from 'rxjs';

import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';

import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Card,
  message,
  Popconfirm,
  Skeleton,
  Spin,
  TabPane,
  Tabs,
  Tooltip,
} from 'ant-design-vue';

import { subscribeDeviceStateMonitor } from '#/api/iot/device/device-monitor';
import {
  getDeviceDetail,
  register as registerDevice,
  unregister as unregisterDevice,
} from '#/api/iot/device/instance';
import { getProtocolDetail } from '#/api/iot/protocol';

import AttrMapping from './components/AttrMapping/index.vue';
import DataMapping from './components/DataMapping/index.vue';
import DeviceLogs from './components/DeviceLogs/index.vue';
import Functions from './components/Functions/index.vue';
import History from './components/History/index.vue';
import Info from './components/Info/index.vue';
import Monitor from './components/Monitor/index.vue';
import Passthrough from './components/Passthrough/index.vue';
import SubDevice from './components/SubDevice/index.vue';
import ThingModel from './components/ThingModel/index.vue';

interface TabConfig {
  component: any;
  key: string;
  show?: (device: IotDeviceInstanceApi.DeviceDetail) => boolean;
  title: string;
}

// Icons
const RefreshIcon = createIconifyIcon('lucide:refresh-cw');
const PowerIcon = createIconifyIcon('lucide:power');
const BoxIcon = createIconifyIcon('lucide:box');
const BackIcon = createIconifyIcon('lucide:chevron-left');

const route = useRoute();
const router = useRouter();
const deviceId = route.query.id as string;

const loading = ref(false);
const initialLoading = ref(true);
const device = ref<IotDeviceInstanceApi.DeviceDetail | null>(null);
const activeTab = ref('info');

// isActive: true if state value is NOT unActive.
const isActive = computed(
  () => device.value?.deviceState?.value !== 'unActive',
);

// 状态样式逻辑
const statusStyle = computed(() => {
  if (!device.value) return {};

  const stateValue = device.value.deviceState?.value;

  // 如果状态是 unActive，则视为“禁用”
  if (stateValue === 'unActive') {
    return {
      bg: 'bg-red-50 dark:bg-red-500/10',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      dot: 'bg-red-500',
      label: $t('device.instance.disable'),
    };
  }

  // 其他状态
  switch (stateValue) {
    case 'offline': {
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-500 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-700',
        dot: 'bg-gray-400',
        label: $t('device.state.offline'),
      };
    }
    case 'online': {
      return {
        bg: 'bg-green-50 dark:bg-green-500/10',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
        dot: 'bg-green-500',
        label: $t('device.state.online'),
      };
    }
    default: {
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500',
        label: device.value.deviceState?.text || $t('device.state.other'),
      };
    }
  }
});

const tabConfigs: TabConfig[] = [
  { component: Info, key: 'info', title: $t('device.instance.tab.info') },
  {
    component: Monitor,
    key: 'monitor',
    title: $t('device.instance.tab.monitor'),
  },
  {
    component: ThingModel,
    key: 'thingModel',
    title: $t('device.instance.tab.thingModel'),
  },
  {
    component: History,
    key: 'history',
    title: $t('device.instance.tab.history'),
  },
  {
    component: DeviceLogs,
    key: 'logs',
    title: $t('device.instance.tab.logs'),
  },
  {
    component: AttrMapping,
    key: 'attrMapping',
    title: $t('device.instance.tab.attrMapping'),
  },
  {
    component: Functions,
    key: 'functions',
    title: $t('device.instance.tab.functions'),
  },
  {
    component: DataMapping,
    key: 'dataMapping',
    title: $t('device.instance.tab.dataMapping'),
  },
  {
    component: SubDevice,
    key: 'subDevice',
    show: (d) => d.deviceType.value === 'GATEWAY',
    title: $t('device.instance.tab.subDevice'),
  },
  {
    component: Passthrough,
    key: 'passthrough',
    title: $t('device.instance.tab.passthrough'),
  },
];

const visibleTabs = computed(() => {
  if (!device.value) return [];
  return tabConfigs.filter((tab) => !tab.show || tab.show(device.value!));
});

let sub: null | Subscription = null;

async function fetchInfo() {
  if (!deviceId) return;
  if (device.value) {
    loading.value = true;
  } else {
    initialLoading.value = true;
  }

  try {
    const data = await getDeviceDetail(deviceId);
    if (data.protocolId) {
      data.protocolDetail = await getProtocolDetail(data.protocolId);
    }
    device.value = data;

    if (sub) {
      sub.unsubscribe();
      sub = null;
    }
    // 订阅状态
    sub = subscribeDeviceStateMonitor(data.id, data.productId, (data) => {
      const stateMsg = data.payload.value;
      if (stateMsg.deviceId === device.value?.id) {
        device.value.deviceState = {
          text: $t(`device.instance.stateMessage.${stateMsg.type}`),
          value: stateMsg.type,
        };
        message.success($t(`device.instance.stateMessage.${stateMsg.type}`));
      }
    });
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
    initialLoading.value = false;
  }
}

async function handleToggleStatus() {
  if (!device.value) return;
  try {
    if (isActive.value) {
      await unregisterDevice(device.value.id);
      message.success($t('common.disableSuccess'));
    } else {
      await registerDevice(device.value.id);
      message.success($t('common.enableSuccess'));
    }
    await fetchInfo();
  } catch (error) {
    console.error(error);
  }
}

function handleBack() {
  router.back();
}

onMounted(fetchInfo);
onUnmounted(() => {
  if (sub) {
    sub.unsubscribe();
    sub = null;
  }
});
</script>

<template>
  <Page
    auto-content-height
    shadow
    content-class="flex flex-col overflow-hidden"
  >
    <!-- Initial Loading Skeleton -->
    <template v-if="initialLoading">
      <div class="p-4">
        <Card class="mb-4">
          <Skeleton active avatar :paragraph="{ rows: 1 }" />
        </Card>
        <Card><Skeleton active /></Card>
      </div>
    </template>

    <template v-else-if="device">
      <Spin :spinning="loading" wrapper-class-name="h-full">
        <div class="flex h-full flex-col gap-2.5 dark:bg-[#151515]">
          <!-- Header -->
          <div
            class="z-10 shrink-0 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-[#151515]"
          >
            <div class="flex items-center justify-between">
              <!-- Left: Back & Info -->
              <div class="flex items-center gap-3">
                <!-- Custom Back Button -->
                <div
                  class="group flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  @click="handleBack"
                >
                  <BackIcon
                    class="size-5 transition-transform group-hover:-translate-x-0.5"
                  />
                </div>

                <div class="h-8 w-[1px] bg-gray-200 dark:bg-gray-700"></div>

                <!-- Avatar -->
                <div
                  class="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
                >
                  <img
                    v-if="device.deviceCoverUrl"
                    :src="device.deviceCoverUrl"
                    class="h-full w-full object-cover"
                  />
                  <BoxIcon v-else class="m-auto mt-1.5 size-7 text-gray-300" />
                </div>

                <!-- Info Text -->
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <h1
                      class="m-0 text-base font-bold text-gray-800 dark:text-gray-100"
                    >
                      {{ device.deviceName }}
                    </h1>
                    <!-- Status Tag -->
                    <div
                      class="flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold transition-colors"
                      :class="[
                        statusStyle.bg,
                        statusStyle.text,
                        statusStyle.border,
                      ]"
                    >
                      <span class="relative flex h-1.5 w-1.5">
                        <span
                          v-if="device.deviceState?.value === 'online'"
                          class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                          :class="statusStyle.dot"
                        ></span>
                        <span
                          class="relative inline-flex h-1.5 w-1.5 rounded-full"
                          :class="statusStyle.dot"
                        ></span>
                      </span>
                      {{ statusStyle.label }}
                    </div>
                  </div>
                  <div class="flex items-center gap-2 text-xs text-gray-400">
                    <span class="font-mono">{{ device.id }}</span>
                    <span class="text-gray-300">|</span>
                    <a
                      class="text-gray-500 hover:text-primary dark:text-gray-400"
                    >
                      {{ device.productName }}
                    </a>
                  </div>
                </div>
              </div>

              <!-- Right: Custom Actions -->
              <div class="flex items-center gap-1">
                <!-- Refresh Action -->
                <Tooltip :title="$t('common.refresh')">
                  <div
                    class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400"
                    @click="fetchInfo"
                  >
                    <RefreshIcon class="size-4" />
                  </div>
                </Tooltip>

                <!-- Enable/Disable Action -->
                <Tooltip
                  v-if="isActive"
                  :title="$t('device.instance.action.disable')"
                >
                  <Popconfirm
                    :title="$t('device.instance.action.confirmDisable')"
                    @confirm="handleToggleStatus"
                  >
                    <div
                      class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-red-500 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/20"
                    >
                      <PowerIcon class="size-4" />
                    </div>
                  </Popconfirm>
                </Tooltip>

                <Tooltip v-else :title="$t('device.instance.action.enable')">
                  <Popconfirm
                    :title="$t('device.instance.action.confirmEnable')"
                    @confirm="handleToggleStatus"
                  >
                    <div
                      class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-green-500 transition-all hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-500/20"
                    >
                      <PowerIcon class="size-4" />
                    </div>
                  </Popconfirm>
                </Tooltip>
              </div>
            </div>
          </div>

          <!-- Content (Fixed Height Area) -->
          <div
            class="flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#151515]"
          >
            <Tabs
              v-model:active-key="activeTab"
              class="device-detail-tabs h-full"
            >
              <TabPane
                v-for="tab in visibleTabs"
                :key="tab.key"
                :tab="tab.title"
                class="h-full"
              >
                <div class="h-full overflow-y-auto">
                  <component :is="tab.component" v-model:device="device" />
                </div>
              </TabPane>
            </Tabs>
          </div>
        </div>
      </Spin>
    </template>
  </Page>
</template>

<style lang="less" scoped>
:deep(.ant-spin-nested-loading),
:deep(.ant-spin-container) {
  height: 100%;
}

.device-detail-tabs {
  display: flex;
  flex-direction: column;

  :deep(.ant-tabs-nav) {
    margin-bottom: 0;
    padding: 0 16px;
    background: #fff;
    flex-shrink: 0;
    border-bottom: 1px solid #f0f0f0;
    .dark & {
      background: #151515;
      border-bottom: 1px solid #303030;
    }
  }

  :deep(.ant-tabs-content-holder) {
    flex: 1;
    min-height: 0;
  }

  :deep(.ant-tabs-content) {
    height: 100%;
  }

  :deep(.ant-tabs-tabpane) {
    height: 100%;
  }
}
</style>
