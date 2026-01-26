<script setup lang="ts">
import type { QueryParamEntity } from '#/adapter';

import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, message } from 'ant-design-vue';

import { IotNotifyConfigApi, queryHistoryByConfigId } from '#/api/iot/notify';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import DebugModal from '../components/DebugModal.vue';
import HistoryModal from '../components/HistoryModal.vue';
import NotifyConfigCard from './components/NotifyConfigCard.vue';
import { getColumns, getSearchFormSchemas } from './data';

const PlusIcon = createIconifyIcon('lucide:plus');
const router = useRouter();

// --- 调试弹窗注册 ---
const [DebugModalInstance, debugModalApi] = useVbenModal({
  connectedComponent: DebugModal,
});

// --- 表格查询逻辑 ---
const gridQuery = async (params: any, ...args: any[]) => {
  const { page } = params;
  const formValues = args[0] || {};
  const { terms } = formValues;

  const queryParams: QueryParamEntity = {
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    terms,
    sorts: [{ name: 'createTime', order: 'desc' }],
  };
  return await IotNotifyConfigApi.basicCrudApis.postQuery(queryParams);
};

// --- 表格卡片组件配置 ---
const [TableCard, gridApi] = useYlVxeTableCard<IotNotifyConfigApi.NotifyConfig>(
  {
    defaultMode: 'card',
    gridOptions: {
      rowConfig: {
        keyField: 'id',
      },
      columns: getColumns(),
      height: 'auto',
      pagerConfig: {
        enabled: true,
        pageSize: 12,
        pageSizes: [12, 24, 48],
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
        custom: true,
        export: true,
        refresh: true,
        search: true,
        zoom: true,
      },
    },
    searchFormMode: 'yl-dc-form',
    showSearchForm: true,
    ylDcFromOptions: {
      formSchemas: getSearchFormSchemas(),
      storeOption: {
        conf: {
          storageKey: 'iot-notify-dc-storage',
        },
        mode: 'localstorage',
      },
    },
  },
);

// --- 事件处理函数 ---

/**
 * 跳转新增页面
 */
function handleAdd() {
  router.push('/iot/notify/config/detail');
}

/**
 * 跳转编辑页面
 */
function handleEdit(row: IotNotifyConfigApi.NotifyConfig) {
  router.push({ path: '/iot/notify/config/detail', query: { id: row.id } });
}

/**
 * 删除记录
 */
async function handleDelete(row: IotNotifyConfigApi.NotifyConfig) {
  try {
    await IotNotifyConfigApi.basicCrudApis.deleteById(row.id);
    message.success($t('common.deleteSuccess'));
    gridApi.reload(); // 刷新列表
  } catch (error) {
    console.error(error);
  }
}

const [HistoryModalInstance, historyModalApi] = useVbenModal({
  connectedComponent: HistoryModal,
});

/**
 * 打开调试弹窗
 */
function handleDebug(row: IotNotifyConfigApi.NotifyConfig) {
  debugModalApi.setData({ notifierId: row.id });
  (debugModalApi as any).open();
}

/**
 * 查看历史记录
 */
function handleViewHistory(row: IotNotifyConfigApi.NotifyConfig) {
  historyModalApi.setData({
    api: (params: QueryParamEntity) => queryHistoryByConfigId(row.id, params),
    fixedTerms: [
      { column: 'notifierId', value: row.id },
      { column: 'provider', value: row.provider },
      { column: 'notifyType', value: row.type },
    ],
    title: `${row.name} - ${$t('notify.debug.historyTitle')}`,
    enableTemplateSearch: true,
  });
  historyModalApi.open();
}
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <!-- Toolbar -->
      <template #toolbar-tools>
        <div class="flex gap-2">
          <Button type="primary" @click="handleAdd">
            <template #icon>
              <PlusIcon class="mr-1 size-4" />
            </template>
            {{ $t('notify.config.list.add') }}
          </Button>
        </div>
      </template>

      <!-- Table Action Column -->
      <template #action="{ row }">
        <div class="flex-center flex gap-2">
          <Button type="link" size="small" @click.stop="handleEdit(row)">
            {{ $t('common.action.edit') }}
          </Button>
          <Button type="link" size="small" @click.stop="handleDebug(row)">
            {{ $t('common.action.debug') }}
          </Button>
          <Button type="link" size="small" @click.stop="handleViewHistory(row)">
            {{ $t('notify.debug.history') }}
          </Button>
          <Button
            type="link"
            size="small"
            danger
            @click.stop="handleDelete(row)"
          >
            {{ $t('common.action.delete') }}
          </Button>
        </div>
      </template>

      <!-- Card Template -->
      <template #card="{ row }">
        <NotifyConfigCard
          :row="row"
          @delete="handleDelete"
          @edit="handleEdit"
          @debug="handleDebug"
          @history="handleViewHistory"
        />
      </template>
    </TableCard>
    <DebugModalInstance />
    <HistoryModalInstance />
  </Page>
</template>

<style scoped></style>
