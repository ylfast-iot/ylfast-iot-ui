<script setup lang="ts">
import type { QueryParamEntity, Term } from '#/adapter';
import type { PagerResult } from '#/api/basic';
import type { IotNotifyHistoryApi } from '#/api/iot/notify/history';

import { onMounted, ref } from 'vue';

import { $t } from '@vben/locales';

import { Modal as AModal } from 'ant-design-vue';

import { queryTemplatesByConfigId } from '#/api/iot/notify';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import { getHistoryColumns, getHistorySearchSchemas } from './historyData';

interface Props {
  /** 查询接口 */
  api: (
    query: QueryParamEntity,
  ) => Promise<PagerResult<IotNotifyHistoryApi.NotifyHistory>>;
  /** 固定查询条件 */
  fixedTerms?: Term[];
  // 显示搜索表单
  showSearchForm?: boolean;
  /** 表格高度 */
  height?: number | string;
  /** 是否启用模板查询下拉（如果是从配置打开应设为 true） */
  enableTemplateSearch?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  fixedTerms: () => [],
  height: 'auto',
  showSearchForm: false,
  enableTemplateSearch: false,
});

// --- 弹窗相关状态 ---
const errorDetailVisible = ref(false);
const currentErrorStack = ref('');

/**
 * 核心查询逻辑
 */
const gridQuery = async (params: any, ...args: any[]) => {
  const { page } = params;
  const formValues = args[0] || {};
  const { terms: dynamicTerms } = formValues;

  // 合并固定条件与动态条件
  const allTerms = [...props.fixedTerms];
  if (dynamicTerms && dynamicTerms.length > 0) {
    allTerms.push(...dynamicTerms);
  }

  const queryParams: QueryParamEntity = {
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    terms: allTerms,
    sorts: [{ name: 'notifyTime', order: 'desc' }],
  };

  return await props.api(queryParams);
};

// --- 表格卡片组件初始化 ---
const [TableCard, gridApi] =
  useYlVxeTableCard<IotNotifyHistoryApi.NotifyHistory>({
    mode: 'table',
    separator: false,
    gridOptions: {
      rowConfig: {
        keyField: 'id',
      },
      columns: getHistoryColumns(),
      height: props.height,
      pagerConfig: {
        enabled: true,
        pageSize: 10,
      },
      proxyConfig: {
        ajax: {
          query: gridQuery,
        },
        response: {
          result: 'data',
        },
      },
      toolbarConfig: {
        refresh: true,
        search: true,
        zoom: true,
      },
    },
    searchFormMode: 'yl-dc-form',
    showSearchForm: props.showSearchForm,
    ylDcFromOptions: {
      formSchemas: getHistorySearchSchemas(), // 初始为基础 Schema
      storeOption: {
        conf: {
          storageKey: 'iot-notify-history-dc-storage',
        },
        mode: 'localstorage',
      },
    },
  });

/**
 * 动态加载模板下拉选项
 */
onMounted(async () => {
  if (!props.enableTemplateSearch) return;

  // 从固定查询条件中提取通知配置 ID
  const notifierTerm = props.fixedTerms.find((t) => t.column === 'notifierId');
  if (notifierTerm?.value) {
    try {
      const templates = await queryTemplatesByConfigId(
        notifierTerm.value as string,
        {
          pageIndex: 0,
          pageSize: 9999,
          paging: false,
        },
      );
      if (templates && templates.length > 0) {
        const templateOptions = templates.map((t) => ({
          label: t.name,
          value: t.id,
        }));
        // 更新搜索表单 Schema
        gridApi
          .getDcFormApi()
          .resetSchema(getHistorySearchSchemas(templateOptions));
      }
    } catch (error) {
      console.error('Failed to load templates for history search:', error);
    }
  }
});

/**
 * 展示异常堆栈详情
 */
function showErrorDetail(stack: string) {
  currentErrorStack.value = stack;
  errorDetailVisible.value = true;
}

/**
 * 暴露组件方法供外部调用
 */
defineExpose({
  reload: () => gridApi.reload(),
  grid: gridApi.grid,
});
</script>

<template>
  <div class="notify-history-list h-full">
    <TableCard>
      <!-- 插槽自定义错误列展示 -->
      <template #errorStack="{ row }">
        <div
          v-if="row.errorStack"
          class="cursor-pointer truncate text-rose-500 decoration-dotted hover:underline"
          @click="showErrorDetail(row.errorStack)"
        >
          {{ row.errorStack || '--' }}
        </div>
        <span v-else class="text-slate-300">-</span>
      </template>
    </TableCard>

    <!-- 异常详情弹窗 -->
    <AModal
      v-model:open="errorDetailVisible"
      :title="$t('notify.debug.stackTitle')"
      :footer="null"
      width="800px"
      style="top: 100px"
    >
      <div
        class="max-h-[600px] overflow-auto rounded bg-slate-50 p-4 font-mono text-xs text-rose-600 dark:bg-slate-900"
      >
        <pre class="whitespace-pre-wrap break-all">{{ currentErrorStack }}</pre>
      </div>
    </AModal>
  </div>
</template>

<style scoped>
.notify-history-list :deep(.vxe-grid) {
  background: transparent;
}
</style>
