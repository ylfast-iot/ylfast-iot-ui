<script setup lang="ts">
import type { IotProtocolApi } from '#/api/iot/protocol';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { computed, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Alert, Empty, Pagination, Spin } from 'ant-design-vue';

import { getSupportTransportProtocols } from '#/api/iot/protocol';
import { YlDcForm } from '#/components/yl-dc-form';

interface Props {
  value?: string;
  transportId?: string;
  disabled?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:value', 'change', 'select']);

// 图标
const ProtocolIcon = createIconifyIcon('lucide:scroll-text');
const CheckIcon = createIconifyIcon('lucide:check');
const InfoIcon = createIconifyIcon('lucide:info');

// 状态
const loading = ref(false);
const protocolList = ref<IotProtocolApi.ProtocolInfo[]>([]);
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
    field: 'protocolId',
    label: $t('gateway.detail.id'),
    component: 'Input',
    termTypes: ['like'],
  },
  {
    field: 'protocolName',
    label: $t('gateway.detail.name'),
    component: 'Input',
    termTypes: ['like'],
  },
  {
    field: 'protocolDescription',
    label: $t('gateway.detail.desc'),
    component: 'Input',
    termTypes: ['like'],
  },
];

// 前端过滤与分页逻辑
// 协议列表由后端过滤，此处直接返回
const filteredProtocolList = computed(() => {
  return protocolList.value;
});

// 分页逻辑
const paginatedProtocolList = computed(() => {
  const list = filteredProtocolList.value;
  const start = (pagination.value.current - 1) * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return list.slice(start, end);
});

function handleSearch(terms: any[]) {
  const fieldMapping: Record<string, string> = {
    protocolId: 'id',
    protocolName: 'name',
    protocolDescription: 'description',
  };

  queryTerms.value = terms.map((term) => ({
    ...term,
    column: fieldMapping[term.column] || term.column,
  }));
  pagination.value.current = 1;
  fetchProtocols();
}

function handleReset() {
  queryTerms.value = [];
  pagination.value.current = 1;
  fetchProtocols();
}

function handlePageChange(page: number, pageSize: number) {
  pagination.value.current = page;
  pagination.value.pageSize = pageSize;
}

// 数据拉取
async function fetchProtocols() {
  if (!props.transportId) {
    console.warn(
      '[AccessProtocolSelector] transportId is missing, skipping fetch',
    );
    return;
  }
  loading.value = true;
  try {
    const res = await getSupportTransportProtocols(props.transportId, {
      paging: false, // 消息协议通常数量不多，先获取全部后前端分页
      terms: queryTerms.value,
    });
    protocolList.value = res || [];
    pagination.value.total = protocolList.value.length;
  } catch (error) {
    console.error('[AccessProtocolSelector] 获取消息协议失败:', error);
  } finally {
    loading.value = false;
  }
}

// 监听传输协议变化
watch(
  () => props.transportId,
  (newId) => {
    if (newId) {
      fetchProtocols();
    }
  },
  { immediate: true },
);

function handleSelect(id: string) {
  if (props.disabled) return;
  emit('update:value', id);
  emit('change', id);
  const selectedItem = protocolList.value.find((item) => item.id === id);
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
      :message="$t('gateway.detail.protocol.alert')"
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
      :tip="$t('gateway.detail.protocol.loading')"
      class="flex flex-1 flex-col overflow-hidden"
    >
      <!-- List Area: Scrollable -->
      <div class="min-h-0 flex-1 overflow-y-auto pr-1">
        <div
          v-if="filteredProtocolList.length > 0"
          class="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div
            v-for="item in paginatedProtocolList"
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

            <!-- Card Header & Description -->
            <div class="flex flex-col gap-4 p-5 pb-5">
              <div class="flex items-center gap-4">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 dark:bg-primary/20"
                  :class="
                    value === item.id
                      ? 'scale-110 shadow-lg shadow-primary/20'
                      : ''
                  "
                >
                  <ProtocolIcon class="size-6" />
                </div>
                <div class="flex min-w-0 flex-1 flex-col gap-0.5">
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

              <!-- Description Box -->
              <div
                class="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-500 transition-colors dark:border-gray-800/50 dark:bg-black/20 dark:text-gray-400"
              >
                <p class="m-0 line-clamp-3">
                  {{ item.description || $t('gateway.detail.protocol.noDesc') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="filteredProtocolList.length === 0 && !loading"
          class="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white dark:border-gray-800 dark:bg-white/5"
        >
          <Empty :description="$t('gateway.detail.protocol.empty')" />
        </div>
      </div>

      <!-- Pagination Area: Fixed -->
      <div
        v-if="filteredProtocolList.length > 0"
        class="mt-4 flex shrink-0 justify-center border-t border-slate-50 pb-4 pt-8"
      >
        <Pagination
          v-model:current="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="filteredProtocolList.length"
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
