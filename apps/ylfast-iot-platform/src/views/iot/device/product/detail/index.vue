<script setup lang="ts">
import type { IotDeviceProductApi } from '#/api/iot/device/product';

import { computed, onMounted, ref } from 'vue';
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
} from 'ant-design-vue';

import {
  getProductDetail,
  registerProduct,
  unregisterProduct,
} from '#/api/iot/device/product';

import Info from './components/Info.vue';
import ThingModel from './components/ThingModel.vue';

interface TabConfig {
  component: any;
  key: string;
  show?: (product: IotDeviceProductApi.ProductDetail) => boolean;
  title: string;
}

// Icons
const RefreshIcon = createIconifyIcon('lucide:refresh-cw');
const PowerIcon = createIconifyIcon('lucide:power');
const PackageIcon = createIconifyIcon('lucide:package');
const BackIcon = createIconifyIcon('lucide:chevron-left');

const route = useRoute();
const router = useRouter();
const productId = route.query.id as string;

const loading = ref(false);
const initialLoading = ref(true);
const product = ref<IotDeviceProductApi.ProductDetail | null>(null);
const activeTab = ref('info');

// 状态样式逻辑
const statusStyle = computed(() => {
  if (!product.value) return {};
  const isEnabled = product.value.state === 1;

  if (!isEnabled) {
    return {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20 backdrop-blur-md',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-200/50 dark:border-rose-500/30',
      dot: 'bg-rose-500',
      label: $t('common.disable'),
    };
  }

  return {
    bg: 'bg-primary/10 backdrop-blur-md',
    text: 'text-primary',
    border: 'border-primary/30',
    dot: 'bg-primary',
    label: $t('common.enable'),
  };
});

const tabConfigs: TabConfig[] = [
  { key: 'info', title: $t('device.instance.tab.info'), component: Info },
  {
    key: 'thingModel',
    title: $t('device.instance.tab.thingModel'),
    component: ThingModel,
  },
];

const visibleTabs = computed(() => {
  if (!product.value) return [];
  return tabConfigs.filter((tab) => !tab.show || tab.show(product.value!));
});

async function fetchInfo() {
  if (!productId) return;
  if (product.value) {
    loading.value = true;
  } else {
    initialLoading.value = true;
  }

  try {
    const data = await getProductDetail(productId);
    product.value = data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
    initialLoading.value = false;
  }
}

async function handleToggleStatus() {
  if (!product.value) return;
  const isEnabled = product.value.state === 1;
  try {
    if (isEnabled) {
      await unregisterProduct(product.value.id);
      message.success($t('common.disableSuccess'));
    } else {
      await registerProduct(product.value.id);
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
</script>

<template>
  <Page
    auto-content-height
    content-class="flex flex-col overflow-hidden"
    shadow
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

    <template v-else-if="product">
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
                    v-if="product.coverUrl"
                    :src="product.coverUrl"
                    class="h-full w-full object-cover"
                  />
                  <PackageIcon
                    v-else
                    class="m-auto mt-1.5 size-7 text-gray-300"
                  />
                </div>

                <!-- Info Text -->
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <h1
                      class="m-0 text-base font-bold text-gray-800 dark:text-gray-100"
                    >
                      {{ product.productName }}
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
                          class="relative inline-flex h-1.5 w-1.5 rounded-full"
                          :class="statusStyle.dot"
                        ></span>
                      </span>
                      {{ statusStyle.label }}
                    </div>
                  </div>
                  <div class="flex items-center gap-2 text-xs text-gray-400">
                    <span class="font-mono">{{ product.id }}</span>
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
                  v-if="product.state === 1"
                  :title="$t('common.disable')"
                >
                  <Popconfirm
                    :title="$t('device.product.action.confirmDisable')"
                    @confirm="handleToggleStatus"
                  >
                    <div
                      class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-red-500 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/20"
                    >
                      <PowerIcon class="size-4" />
                    </div>
                  </Popconfirm>
                </Tooltip>

                <Tooltip v-else :title="$t('common.enable')">
                  <Popconfirm
                    :title="$t('device.product.action.confirmEnable')"
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
                  <component :is="tab.component" v-model:product="product" />
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
