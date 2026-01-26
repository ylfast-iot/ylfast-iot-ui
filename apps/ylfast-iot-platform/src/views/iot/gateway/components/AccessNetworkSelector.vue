<script setup lang="ts">
import type { IotNetCompApi } from '#/api/iot/network-config';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { computed, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Alert, Empty, Pagination, Spin } from 'ant-design-vue';

import { getAliveNetworkInfo } from '#/api/iot/network-config';
import { YlDcForm } from '#/components/yl-dc-form';

interface Props {
  value?: string;
  networkTypeId?: string;
  includeId?: string;
  disabled?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:value', 'change', 'select']);

// 图标
const NetworkIcon = createIconifyIcon('lucide:network');
const CheckIcon = createIconifyIcon('lucide:check');
const InfoIcon = createIconifyIcon('lucide:info');

// 状态
const loading = ref(false);
const networkList = ref<IotNetCompApi.ChannelInfo[]>([]);
const queryTerms = ref<any[]>([]);

// 分页状态
const pagination = ref({
  current: 1,
  pageSize: 12,
  total: 0,
});

// 搜索表单配置
const searchFormSchemas: YlDcFormSchema[] = [
  {
    field: 'id',
    label: $t('gateway.detail.id'),
    component: 'Input',
    termTypes: ['like'],
  },
  {
    field: 'name',
    label: $t('gateway.detail.name'),
    component: 'Input',
    termTypes: ['like'],
  },
  {
    field: 'description',
    label: $t('gateway.detail.desc'),
    component: 'Input',
    termTypes: ['like'],
  },
];

// 统一过滤逻辑 (前端过滤，如果 API 不需要后端过滤的话)
// 但后端接口 getAliveNetworkInfo 支持 query 参数，所以我们优先使用后端过滤
const filteredNetworkList = computed(() => networkList.value);

function handleSearch(terms: any[]) {
  // 映射表单字段到数据库列名
  const fieldMapping: Record<string, string> = {
    networkId: 'id',
    networkName: 'name',
    networkDescription: 'description',
  };

  queryTerms.value = terms.map((term) => ({
    ...term,
    column: fieldMapping[term.column] || term.column,
  }));
  pagination.value.current = 1;
  fetchNetworks();
}

function handleReset() {
  queryTerms.value = [];
  pagination.value.current = 1;
  fetchNetworks();
}

function handlePageChange(page: number, pageSize: number) {
  pagination.value.current = page;
  pagination.value.pageSize = pageSize;
  fetchNetworks();
}

// 数据拉取
async function fetchNetworks() {
  if (!props.networkTypeId) {
    console.warn(
      '[AccessNetworkSelector] networkTypeId is missing, skipping fetch',
    );
    return;
  }
  loading.value = true;
  try {
    // 构建查询条件
    const terms = [...queryTerms.value];

    // 如果是编辑模式（有 props.value）且没有搜索，或者为了确保选中项始终可见
    // 我们可以在后端过滤中添加一个逻辑，但简单的做法是：
    // 如果没有搜索条件，直接查询列表，后端会自动返回符合条件的组件。
    // 如果有搜索条件，按搜索条件查询。

    const res = await getAliveNetworkInfo(
      props.networkTypeId,
      props.includeId,
      {
        pageIndex: pagination.value.current - 1,
        pageSize: pagination.value.pageSize,
        terms: terms.length > 0 ? terms : [],
      },
    );

    // 如果有选中值，且不在返回列表中，则单独查询一次并合并（可选方案）
    // 或者目前保持简单，直接按条件查询。
    // 注意：getAliveNetworkInfo 如果返回的是 IotNetCompApi.ChannelInfo[] 则可能没有 total
    // 我们需要确认接口返回结构。
    networkList.value = res || [];
    // 如果接口不返回 total，我们可能需要特殊处理或者假设一个值（如果不支持分页的话）
    // 但通常 Iot API 支持分页。如果 res 本身是数组，说明后端可能没有返回分页元数据。
    // 经查，getAliveNetworkInfo 返回的是 ChannelInfo[]
    // 这里暂时假设如果返回的是数组，total 就等于列表长度（如果是第一页且数量小于 pageSize）
    // 如果后端不支持分页 total，那分页控件可能就不准确。
    pagination.value.total = res?.length || 0;
  } catch (error) {
    console.error('[AccessNetworkSelector] 获取网络组件失败:', error);
  } finally {
    loading.value = false;
  }
}

// 监听网络类型或 includeId 变化，重新拉取列表
watch(
  [() => props.networkTypeId, () => props.includeId],
  ([newTypeId]) => {
    if (newTypeId) {
      fetchNetworks();
    }
  },
  { immediate: true },
);

function handleSelect(id: string) {
  if (props.disabled) return;
  emit('update:value', id);
  emit('change', id);
  const selectedItem = networkList.value.find((item) => item.id === id);
  if (selectedItem) {
    emit('select', selectedItem);
  }
}
</script>

<template>
  <div
    class="flex flex-1 flex-col transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
  >
    <Alert
      :message="$t('gateway.detail.network.alert')"
      type="info"
      show-icon
      class="mb-8 rounded-xl border-none bg-primary/5 text-primary"
    >
      <template #icon><InfoIcon class="size-4" focusable="false" /></template>
    </Alert>

    <div class="mb-8 border-b border-dashed border-slate-200 pb-8">
      <YlDcForm
        :form-schemas="searchFormSchemas"
        :show-more-button="false"
        @search="handleSearch"
        @reset="handleReset"
      />
    </div>

    <Spin
      :spinning="loading"
      :tip="$t('gateway.detail.network.loading')"
      class="flex flex-1 flex-col overflow-hidden"
    >
      <!-- List Area: Scrollable -->
      <div class="min-h-0 flex-1 overflow-y-auto pr-1">
        <div
          v-if="filteredNetworkList.length > 0"
          class="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <div
            v-for="item in filteredNetworkList"
            :key="item.id"
            class="relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 dark:bg-[#151515]"
            :class="[
              value === item.id
                ? 'border-primary bg-primary/[0.02] shadow-md shadow-primary/5 ring-1 ring-primary/20'
                : 'border-slate-100 dark:border-gray-800',
              disabled
                ? 'cursor-not-allowed opacity-60 grayscale'
                : 'cursor-pointer hover:border-primary/50 hover:shadow-lg',
            ]"
            @click="handleSelect(item.id)"
          >
            <!-- Selection Indicator: Elegant Circle -->
            <div
              v-if="value === item.id"
              class="absolute right-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-lg duration-300 animate-in fade-in zoom-in"
            >
              <CheckIcon class="size-3" focusable="false" />
            </div>

            <!-- Card Header -->
            <div class="flex items-start gap-4 p-5 pb-3">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 dark:bg-primary/20"
                :class="
                  value === item.id
                    ? 'scale-110 shadow-lg shadow-primary/20'
                    : ''
                "
              >
                <NetworkIcon class="size-6" />
              </div>
              <div class="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
                <h3
                  class="m-0 truncate text-[15px] font-bold tracking-tight text-slate-800 dark:text-gray-100"
                  :title="item.name"
                >
                  {{ item.name }}
                </h3>
                <div
                  class="flex items-center gap-1.5 font-mono text-[10px] font-bold text-slate-400"
                >
                  <span class="opacity-60">ID:</span>
                  <span class="truncate">{{ item.id }}</span>
                </div>
              </div>
            </div>

            <!-- Card Content: Addresses with Health -->
            <div class="flex flex-col px-5 pb-5">
              <div class="mt-2 flex flex-col gap-2">
                <div
                  v-for="addr in item.addresses"
                  :key="addr.address"
                  class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 transition-colors dark:bg-white/5"
                >
                  <div class="flex items-center gap-2 overflow-hidden">
                    <div
                      class="h-1.5 w-1.5 shrink-0 rounded-full"
                      :class="
                        addr.health === 1
                          ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                          : 'bg-rose-500'
                      "
                    ></div>
                    <span
                      class="truncate font-mono text-[11px] text-slate-600 dark:text-gray-300"
                    >
                      {{ addr.address }}
                    </span>
                  </div>
                  <span
                    class="shrink-0 text-[10px] font-bold uppercase tracking-wider opacity-40"
                  >
                    {{
                      addr.health === 1
                        ? $t('gateway.status.online')
                        : $t('gateway.status.error')
                    }}
                  </span>
                </div>

                <div
                  v-if="!item.addresses?.length"
                  class="flex h-10 items-center justify-center rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-400 dark:border-gray-800"
                >
                  {{ $t('gateway.detail.network.noAddress') }}
                </div>
              </div>

              <!-- Description -->
              <div
                v-if="item.description"
                class="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 text-[11px] leading-relaxed text-slate-500 dark:border-gray-800/50 dark:bg-black/20 dark:text-gray-400"
              >
                <p class="m-0 line-clamp-2">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="filteredNetworkList.length === 0 && !loading"
          class="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white dark:border-gray-800 dark:bg-white/5"
        >
          <Empty :description="$t('gateway.detail.network.empty')" />
        </div>
      </div>

      <!-- Pagination Area: Fixed -->
      <div
        v-if="filteredNetworkList.length > 0"
        class="mt-4 flex shrink-0 justify-center border-t border-slate-50 pb-4 pt-8"
      >
        <Pagination
          v-model:current="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :show-total="(total) => $t('gateway.pagination.total', { total })"
          size="small"
          show-size-changer
          @change="handlePageChange"
        />
      </div>
    </Spin>
  </div>
</template>

<style scoped>
/* yl-dc-form 之前已经被移除过背景，现在确保其在白色背景下表现一致 */
:deep(.ant-spin-nested-loading),
:deep(.ant-spin-container) {
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
}

:deep(.yl-dc-form-container) {
  padding: 0;
  background: white !important;
  box-shadow: none !important;
}
</style>
