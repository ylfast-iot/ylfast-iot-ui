<script setup lang="ts">
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, message } from 'ant-design-vue';

import { useYlDcForm } from '#/components/yl-dc-form';

// 1. 定义 Schema
const schemas: YlDcFormSchema[] = [
  {
    field: 'deviceName',
    label: '设备名称',
    component: 'Input',
    defaultValue: '',
    termTypes: ['eq', 'like'],
  },
  {
    field: 'deviceType',
    label: '设备类型',
    component: 'Select',
    componentProps: {
      options: [
        { label: '网关', value: 'gateway' },
        { label: '传感器', value: 'sensor' },
        { label: '控制器', value: 'controller' },
      ],
    },
    termTypes: ['eq'],
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      options: [
        { label: '在线', value: 'online' },
        { label: '离线', value: 'offline' },
        { label: '维护中', value: 'maintenance' },
      ],
    },
    termTypes: ['eq', 'in'],
  },
  {
    field: 'createTime',
    label: '创建时间',
    component: 'DatePicker',
    termTypes: ['gt', 'lt', 'eq'],
  },
];

// 2. 注册 Hook
const [YlDcForm, { getFieldsValue }] = useYlDcForm({
  formSchemas: schemas,
  size: 'middle',
  // 开启条件存储（本地模式）
  storeOption: {
    mode: 'localstorage',
    conf: { storageKey: 'demo-yl-dc-form-conditions' },
  },
});

// 结果展示
const result = ref<any>(null);

// 3. 处理搜索
const handleSearch = (terms: any) => {
  result.value = terms;
  message.success('触发搜索，请查看下方结果或控制台');
};

// 处理保存
const handleSave = () => {
  message.success('触发保存');
};

const handleGetValues = () => {
  const values = getFieldsValue();
  result.value = values;
  message.info('已获取当前表单值');
};
</script>

<template>
  <Page title="YlDcForm 动态条件表单演示">
    <div class="p-4">
      <Card title="基本使用 & 条件存储" class="mb-4">
        <template #extra>
          <a-button type="primary" size="small" @click="handleGetValues">
            手动获取值
          </a-button>
        </template>

        <YlDcForm @search="handleSearch" @save="handleSave" />
      </Card>

      <Card title="查询结果 (JSON)" class="mt-4">
        <p
          v-if="result"
          class="max-h-96 overflow-auto rounded bg-gray-100 p-4 text-sm dark:bg-gray-800 dark:text-gray-300"
        >
          {{ JSON.stringify(result, null, 2) }}
        </p>
        <div v-else class="text-gray-400">暂无搜索结果，请点击搜索按钮...</div>
      </Card>
    </div>
  </Page>
</template>
