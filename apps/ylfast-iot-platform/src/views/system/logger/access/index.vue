<script setup lang="ts">
import type { LoggerApi } from '#/api/system/logger';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Tag } from 'ant-design-vue';

import { queryAccessLogsPost } from '#/api/system/logger';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import AccessLogDetail from './components/AccessLogDetail.vue';

const EyeIcon = createIconifyIcon('lucide:eye');
const detailRef = ref();

const [TableCard] = useYlVxeTableCard<LoggerApi.AccessLog>({
  mode: 'table',
  gridOptions: {
    height: 'auto',
    columns: [
      { field: 'ip', title: $t('logger.access.ip'), width: 140 },
      { field: 'url', minWidth: 200, title: $t('logger.access.url') },
      { field: 'action', minWidth: 150, title: $t('logger.access.describe') },
      {
        field: 'httpMethod',
        slots: { default: 'method' },
        title: $t('logger.access.method'),
        width: 100,
      },
      {
        field: 'requestTime',
        formatter: 'formatDateTime',
        title: $t('logger.access.requestTime'),
        width: 180,
      },
      {
        field: 'duration',
        slots: { default: 'duration' },
        title: $t('logger.access.duration'),
        width: 100,
      },
      {
        field: 'context.username',
        title: $t('logger.access.user'),
        width: 120,
      },
      {
        field: 'operation',
        fixed: 'right',
        slots: { default: 'operation' },
        title: $t('common.action.label'),
        width: 80,
      },
    ],
    proxyConfig: {
      ajax: {
        query: async (_params: any, ...args: any[]) => {
          const { page } = _params;
          const queryParams = args[0] || {};
          const terms = queryParams.terms || [];

          const { data, total } = await queryAccessLogsPost({
            pageIndex: page.currentPage - 1,
            pageSize: page.pageSize,
            sorts: [{ name: 'requestTime', order: 'desc' }],
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
  tableTitle: $t('logger.access.title'),
  ylDcFromOptions: {
    formSchemas: [
      {
        component: 'Input',
        field: 'ip',
        label: $t('logger.access.ip'),
        termTypes: ['like', 'eq'],
      },
      {
        component: 'Input',
        field: 'action',
        label: $t('logger.access.describe'),
        termTypes: ['like', 'eq'],
      },
      {
        component: 'Input',
        field: 'context.username',
        label: $t('logger.access.user'),
        termTypes: ['like', 'eq'],
      },
      {
        component: 'Input',
        field: 'url',
        label: $t('logger.access.url'),
        termTypes: ['like', 'eq'],
      },
      {
        component: 'Select',
        componentProps: {
          options: [
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' },
            { label: 'DELETE', value: 'DELETE' },
          ],
        },
        field: 'httpMethod',
        label: $t('logger.access.method'),
      },
    ],
  },
});

function handleView(row: LoggerApi.AccessLog) {
  detailRef.value?.open(row);
}
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <template #method="{ row }">
        <Tag :color="row.httpMethod === 'GET' ? 'green' : 'blue'">
          {{ row.httpMethod }}
        </Tag>
      </template>
      <template #duration="{ row }">
        {{ row.responseTime - row.requestTime }} ms
      </template>
      <template #operation="{ row }">
        <Button type="link" @click="handleView(row)">
          <template #icon><EyeIcon /></template>
        </Button>
      </template>
    </TableCard>
    <AccessLogDetail ref="detailRef" />
  </Page>
</template>
