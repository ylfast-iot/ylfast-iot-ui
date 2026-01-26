<script setup lang="ts">
import type { IotGatewayApi } from '#/api/iot/gateway';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Spin, Table, Tag, Tooltip } from 'ant-design-vue';

import { getGatewayDetail, getGatewayProviders } from '#/api/iot/gateway';
import { YlMarkdown } from '#/components/yl-markdown';

import { useGatewayChannel } from '../hooks/useGatewayChannel';
import { useGatewayRoutes } from '../hooks/useGatewayRoutes';

// Icons
const ProtocolIcon = createIconifyIcon('lucide:message-square-code');
const NetworkIcon = createIconifyIcon('lucide:network');
const PluginIcon = createIconifyIcon('lucide:puzzle');
const TransportIcon = createIconifyIcon('lucide:zap');
const BoxIcon = createIconifyIcon('lucide:box');

const loading = ref(false);
const gatewayDetail = ref<IotGatewayApi.DeviceGatewayDetail | null>(null);
const providerMap = ref<Record<string, string>>({});

const [Drawer, drawerApi] = useVbenDrawer({
  title: $t('common.detail'),
  onCancel() {
    drawerApi.close();
    gatewayDetail.value = null;
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      gatewayDetail.value = null;
    }
  },
});

async function open(id: string) {
  drawerApi.open();
  loading.value = true;
  try {
    // Parallel fetch: detail and providers (if not loaded)
    const [detailRes, providersRes] = await Promise.all([
      getGatewayDetail(id),
      Object.keys(providerMap.value).length === 0
        ? getGatewayProviders()
        : Promise.resolve([]),
    ]);

    gatewayDetail.value = detailRes;

    // Update provider map if fetched
    if (providersRes.length > 0) {
      providersRes.forEach((p) => {
        providerMap.value[p.id] = p.name;
      });
    }

    drawerApi.setState({
      title: `${detailRes.name} - ${$t('common.detail')}`,
    });
  } catch (error) {
    console.error('Failed to fetch gateway detail:', error);
  } finally {
    loading.value = false;
  }
}

// Helpers to simplify template logic
const { isNetwork, isPlugin } = useGatewayChannel(
  computed(() => gatewayDetail.value?.channel),
);

// 路由表相关逻辑
const { routeColumns, sortedRoutes } = useGatewayRoutes(
  computed(() => gatewayDetail.value?.transportDetail?.routes),
  computed(() => gatewayDetail.value?.transport),
);

defineExpose({
  open,
});
</script>

<template>
  <Drawer class="w-1/2">
    <Spin :spinning="loading">
      <div v-if="gatewayDetail" class="flex flex-col gap-6 p-4">
        <!-- Provider Info -->
        <div
          class="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20"
          >
            <BoxIcon class="size-6" focusable="false" />
          </div>
          <div class="flex flex-col">
            <span
              class="text-[10px] font-black uppercase tracking-widest text-primary/70"
            >
              {{ gatewayDetail.channel }}
            </span>
            <span
              class="text-sm font-bold uppercase tracking-tight text-slate-700 dark:text-slate-200"
            >
              {{
                providerMap[gatewayDetail.provider] || gatewayDetail.provider
              }}
            </span>
          </div>
        </div>

        <!-- Protocol Info -->
        <div
          v-if="gatewayDetail.protocolDetail"
          class="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30"
          >
            <ProtocolIcon class="size-6" />
          </div>
          <div class="flex flex-col overflow-hidden">
            <span
              class="text-[10px] font-black uppercase tracking-widest text-indigo-400"
            >
              {{ $t('gateway.detail.protocol.title') }}
            </span>
            <span
              class="truncate text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              {{ gatewayDetail.protocolDetail.name }}
              <span class="ml-1 text-xs font-normal text-slate-400">
                ({{ gatewayDetail.protocolId }})
              </span>
            </span>
          </div>
        </div>

        <!-- Network Info -->
        <div
          v-if="gatewayDetail.channelInfo && isNetwork()"
          class="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-900/30"
          >
            <NetworkIcon class="size-6" focusable="false" />
          </div>
          <div class="flex flex-col overflow-hidden">
            <span
              class="text-[10px] font-black uppercase tracking-widest text-blue-400"
            >
              {{ $t('gateway.detail.network.title') }}
            </span>
            <span
              class="truncate text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              {{ gatewayDetail.channelInfo.name }}
              <span class="ml-1 text-xs font-normal text-slate-400">
                ({{ gatewayDetail.channelId }})
              </span>
            </span>
          </div>
        </div>

        <!-- Plugin Info -->
        <div
          v-if="gatewayDetail.channelInfo && isPlugin()"
          class="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-500 dark:bg-purple-900/30"
          >
            <PluginIcon class="size-6" focusable="false" />
          </div>
          <div class="flex flex-col overflow-hidden">
            <span
              class="text-[10px] font-black uppercase tracking-widest text-purple-400"
            >
              {{ $t('gateway.detail.plugin.title') }}
            </span>
            <span
              class="truncate text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              {{ gatewayDetail.channelInfo.name }}
              <span class="ml-1 text-xs font-normal text-slate-400">
                ({{ gatewayDetail.channelId }})
              </span>
            </span>
          </div>
        </div>

        <!-- Transport Detail -->
        <div
          v-if="gatewayDetail.transportDetail"
          class="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10"
        >
          <div
            class="flex items-center gap-4 border-b border-slate-50 pb-4 dark:border-white/5"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20"
            >
              <TransportIcon class="size-5" focusable="false" />
            </div>
            <div class="flex flex-col overflow-hidden">
              <span
                class="text-[10px] font-black uppercase tracking-widest text-primary/70"
              >
                {{ $t('gateway.detail.transportDetails') }}
              </span>
              <span
                class="truncate text-sm font-bold uppercase tracking-tight text-slate-700 dark:text-slate-200"
              >
                {{ gatewayDetail.transportDetail.name }}
                <span class="ml-1 text-xs font-normal text-slate-400">
                  ({{ gatewayDetail.transport }})
                </span>
              </span>
            </div>
          </div>

          <!-- Features -->
          <div
            v-if="gatewayDetail.transportDetail.features?.length > 0"
            class="flex flex-wrap gap-2"
          >
            <Tag
              v-for="feat in gatewayDetail.transportDetail.features"
              :key="feat.id"
              color="blue"
              class="rounded-full border-none bg-blue-50 px-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            >
              {{ feat.name }}
            </Tag>
          </div>

          <!-- Routes Table -->
          <div
            v-if="gatewayDetail.transportDetail.routes?.length > 0"
            class="mt-4 border-t border-slate-50 pt-4 dark:border-white/5"
          >
            <div
              class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              {{ $t('gateway.detail.routes') }}
            </div>
            <Table
              bordered
              :columns="routeColumns"
              :data-source="sortedRoutes"
              size="small"
              :pagination="false"
              :scroll="{ x: 'max-content' }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'direction'">
                  <div class="flex items-center justify-center">
                    <Tag
                      v-if="record.upstream"
                      color="blue"
                      class="mr-0 text-[10px]"
                    >
                      {{ $t('gateway.detail.upstream') }}
                    </Tag>
                    <Tag
                      v-if="record.downstream"
                      color="orange"
                      class="mr-0 text-[10px]"
                    >
                      {{ $t('gateway.detail.downstream') }}
                    </Tag>
                  </div>
                </template>

                <template v-else-if="column.key === 'method'">
                  <div class="flex flex-wrap gap-1">
                    <Tag v-for="m in record.method" :key="m" color="blue">
                      {{ m }}
                    </Tag>
                  </div>
                </template>
                <template v-else-if="column.key === 'contentType'">
                  <div class="flex flex-wrap gap-1">
                    <Tag v-for="ct in record.contentType" :key="ct">
                      {{ ct }}
                    </Tag>
                  </div>
                </template>
                <template v-else-if="column.key === 'description'">
                  <Tooltip :title="record.description">
                    <span class="block max-w-[200px] truncate">{{
                      record.description
                    }}</span>
                  </Tooltip>
                </template>
              </template>
            </Table>
          </div>

          <!-- Docs -->
          <div
            v-if="gatewayDetail.transportDetail.document"
            class="mt-4 border-t border-slate-50 pt-4 dark:border-white/5"
          >
            <div
              class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              {{ $t('gateway.detail.docs') }}
            </div>
            <YlMarkdown
              :model-value="gatewayDetail.transportDetail.document"
              display-mode="modal"
              :title="`${gatewayDetail.transportDetail.name} ${$t(
                'gateway.detail.docs',
              )}`"
              :trigger-text="$t('common.view')"
              trigger-type="button"
              button-size="small"
            />
          </div>
        </div>
      </div>
    </Spin>
  </Drawer>
</template>
