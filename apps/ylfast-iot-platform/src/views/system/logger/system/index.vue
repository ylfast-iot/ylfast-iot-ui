<script setup lang="ts">
import type { LoggerApi } from '#/api/system/logger';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Tag } from 'ant-design-vue';

import { querySystemLogsPost } from '#/api/system/logger';
import { getClusterNodes } from '#/api/system/monitor/cluster';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import SystemLogDetail from './components/SystemLogDetail.vue';

const EyeIcon = createIconifyIcon('lucide:eye');
const detailRef = ref();

const [TableCard] = useYlVxeTableCard<LoggerApi.SystemLog>({
  mode: 'table',
  gridOptions: {
    height: 'auto',
    columns: [
      { field: 'name', title: $t('logger.system.name'), minWidth: 150 },
      {
        field: 'level',
        slots: { default: 'level' },
        title: $t('logger.system.level'),
        width: 100,
      },
      {
        field: 'message',
        minWidth: 300,
        showOverflow: true,
        title: $t('logger.system.message'),
      },
      {
        field: 'serverId',
        title: $t('logger.system.serviceNode'),
        width: 150,
      },
      {
        field: 'createTime',
        formatter: 'formatDateTime',
        title: $t('logger.system.createTime'),
        width: 180,
      },
      {
        field: 'action',
        fixed: 'right',
        slots: { default: 'action' },
        title: $t('common.action.label'),
        width: 80,
      },
    ],
    pagerConfig: { enabled: true },
    proxyConfig: {
      ajax: {
        query: async (_params: any, ...args: any[]) => {
          const { page } = _params;
          const queryParams = args[0] || {};
          const terms = queryParams.terms || [];

          const { data, total } = await querySystemLogsPost({
            pageIndex: page.currentPage - 1,
            pageSize: page.pageSize,
            sorts: [{ name: 'createTime', order: 'desc' }],
            terms,
          });
          return { items: data, total };
        },
      },
      enabled: true,
    },
  },
  searchFormMode: 'yl-dc-form',
  showSearchForm: true,
  tableTitle: $t('logger.system.title'),
  ylDcFromOptions: {
    formSchemas: [
      {
        component: 'Input',
        field: 'name',
        label: $t('logger.system.name'),
        termTypes: ['like', 'eq'],
      },
      {
        component: 'Select',
        componentProps: {
          options: [
            { label: 'INFO', value: 'INFO' },
            { label: 'WARN', value: 'WARN' },
            { label: 'ERROR', value: 'ERROR' },
            { label: 'DEBUG', value: 'DEBUG' },
          ],
        },
        field: 'level',
        label: $t('logger.system.level'),
      },
      {
        component: 'Input',
        field: 'message',
        label: $t('logger.system.message'),
        termTypes: ['like'],
      },
      {
        component: 'ApiSelect',
        componentProps: {
          api: getClusterNodes,
          labelField: 'serverId',
          resultField: 'nodes',
          valueField: 'serverId',
        },
        field: 'serverId',
        label: $t('logger.system.serviceNode'),
        termTypes: ['eq'],
      },
    ],
  },
});

function handleView(row: LoggerApi.SystemLog) {
  detailRef.value?.open(row);
}
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <template #level="{ row }">
        <Tag
          :color="
            row.level === 'ERROR'
              ? 'red'
              : row.level === 'WARN'
                ? 'orange'
                : 'green'
          "
        >
          {{ row.level }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Button type="link" @click="handleView(row)">
          <template #icon><EyeIcon /></template>
        </Button>
      </template>
    </TableCard>
    <SystemLogDetail ref="detailRef" />
  </Page>
</template>
