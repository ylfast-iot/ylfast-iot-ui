<script setup lang="tsx">
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { columns } from './data';

const gridOptions: VxeGridProps = {
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    // 点击行选中
    trigger: 'default',
    checkMethod: ({ row }) => row?.userId !== 1,
  },
  columns,
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async () => {
        return {
          data: [],
        };
      },
    },
  },
  headerCellConfig: {
    height: 44,
  },
  cellConfig: {
    height: 48,
  },
  rowConfig: {
    keyField: 'id',
  },
  height: 'auto',
  id: 'system-user-index',
};

const [BasicTable] = useVbenVxeGrid({
  gridOptions,
});
</script>

<template>
  <Page :auto-content-height="true">
    <BasicTable table-title="角色列表" />
  </Page>
</template>

<style scoped></style>
