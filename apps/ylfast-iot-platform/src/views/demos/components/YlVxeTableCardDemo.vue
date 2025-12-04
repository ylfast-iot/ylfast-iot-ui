<script setup lang="ts">
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { Page } from '@vben/common-ui';

import { Avatar, Card, Tag } from 'ant-design-vue';

import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

// 模拟数据
const mockData = Array.from({ length: 50 }).map((_, i) => ({
  desc: `这是一个模拟的物联网设备描述信息 ${i + 1}...`,
  id: i + 1,
  ip: `192.168.1.${i + 1}`,
  name: `设备 ${i + 1}`,
  status: i % 3 === 0 ? 'online' : 'offline',
  type: i % 2 === 0 ? 'Sensor' : 'Gateway',
  updatedAt: new Date().toLocaleString(),
}));

// 模拟 API 请求
const mockApi = async (searchParams: any, val: any) => {
  console.warn('mockApi', searchParams, val);
  const { page } = searchParams;
  return new Promise((resolve) => {
    setTimeout(() => {
      const { currentPage = 1, pageSize = 10 } = page || {};
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      const result = mockData.slice(start, end);
      resolve({
        items: result,
        total: mockData.length,
      });
    }, 500);
  });
};

const schemas: YlDcFormSchema[] = [
  {
    label: '设备名称',
    termTypes: ['eq', 'like', 'nlike'],
    field: 'name',
    defaultValue: 'test',
    component: 'Input',
  },
  {
    label: '创建时间',
    field: 'createTime',
    component: 'DatePicker',
    componentProps: { showTime: true, valueFormat: 'YYYY-MM-DD HH:mm:ss' },
  },
  {
    label: '状态',
    field: 'state',
    component: 'Select',
    componentProps: {
      options: [
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'notActive' },
      ],
    },
  },
];

const [TableCard] = useYlVxeTableCard<{
  ip: string;
  name: string;
  status: string;
  type: string;
  updatedAt: string;
}>({
  tableTitle: '设备列表',
  tableTitleHelp: '模拟接口请求示例',
  cardOptions: {
    minWidth: 300,
  },
  showSearchForm: true,
  searchFormMode: 'yl-dc-form',
  ylDcFromOptions: {
    formSchemas: schemas,
  },
  gridOptions: {
    // 提取通用配置到顶层
    columns: [
      { field: 'name', title: '设备名称' },
      { field: 'status', title: '状态' },
      { field: 'ip', title: 'IP 地址' },
      { field: 'type', title: '类型' },
      { field: 'updatedAt', title: '更新时间' },
    ],
    // 启用代理配置
    proxyConfig: {
      enabled: true, // 必须启用
      ajax: {
        // 接收 { page, sorts, filters, form }
        query: mockApi,
      },
      // 映射响应字段
      response: {
        result: 'items',
        total: 'total',
      },
    },
    pagerConfig: {
      enabled: true,
      pageSize: 10,
      pageSizes: [5, 10, 20, 50],
    },
    toolbarConfig: {
      custom: true,
      export: true,
      refresh: true, // 显示刷新按钮
      search: true, // 显示工具栏
      zoom: true,
    },
    height: 'auto',
    border: true,
    stripe: true,
  },
});
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <!-- 自定义卡片插槽 -->
      <template #card="{ row }">
        <Card class="h-full" hoverable>
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Avatar
                  :style="{
                    backgroundColor:
                      row.status === 'online' ? '#87d068' : '#f56a00',
                  }"
                >
                  {{ row.name[0] }}
                </Avatar>
                <span>{{ row.name }}</span>
              </div>
              <Tag :color="row.status === 'online' ? 'success' : 'error'">
                {{ row.status }}
              </Tag>
            </div>
          </template>

          <div class="mb-2 text-sm text-gray-500">IP: {{ row.ip }}</div>
          <div class="mb-4">
            {{ row.desc }}
          </div>

          <div
            class="mt-2 flex justify-between border-t pt-2 text-xs text-gray-400"
          >
            <span>类型: {{ row.type }}</span>
            <span>{{ row.updatedAt }}</span>
          </div>
        </Card>
      </template>
    </TableCard>
  </Page>
</template>
