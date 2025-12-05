<script lang="ts" setup>
import type { ConfigMetadata } from '#/types/config-metadata';

import { onMounted, ref } from 'vue';

import { JsonViewer } from '@vben/common-ui';

import { useStorage } from '@vueuse/core';
import { Button, Card, message, Space, Textarea } from 'ant-design-vue';

import {
  useYlConfigMetadataForm,
  YlConfigMetadataForm,
} from '#/components/yl-config-metadata-form';

const defaultMetadata = {
  name: 'Import Demo',
  description: 'Demonstrating all features via imported JSON',
  properties: [
    {
      property: 'basicInfo',
      name: 'Basic Information',
      type: {
        type: 'OBJECT',
        expands: {
          configMetadata: {
            properties: [
              {
                property: 'username',
                name: 'Username',
                type: { type: 'STRING', expands: { required: true } },
              },
              {
                property: 'age',
                name: 'Age',
                type: { type: 'INTEGER', expands: { span: 12 } },
              },
              {
                property: 'isAdmin',
                name: 'Is Admin',
                type: { type: 'BOOLEAN', expands: { span: 12 } },
              },
            ],
          },
        },
      },
    },
    {
      property: 'connection',
      name: 'Connection Type',
      description: 'Select type to see linkage',
      type: {
        type: 'ENUM',
        expands: {
          required: true,
          linkageProperty: 'proxySettings',
          options: [
            { label: 'Direct', value: 'direct' },
            { label: 'Proxy', value: 'proxy' },
          ],
          linkagePropertyEnumMapConfig: {
            proxy: {
              name: 'Proxy Settings',
              properties: [
                {
                  property: 'proxyHost',
                  name: 'Proxy Host',
                  type: { type: 'STRING', expands: { required: true } },
                },
                {
                  property: 'proxyPort',
                  name: 'Proxy Port',
                  type: { type: 'INTEGER' },
                },
              ],
            },
          },
        },
      },
    },
    {
      property: 'tags',
      name: 'Tags',
      type: { type: 'ARRAY' },
    },
  ],
};

// Persist to localStorage
const metadataJson = useStorage(
  'yl-config-metadata-demo-json',
  JSON.stringify(defaultMetadata, null, 2),
);

const currentMetadata = ref<ConfigMetadata | ConfigMetadata[] | undefined>(
  undefined,
);
const formData = ref({});
const error = ref('');

const [register, { validate, getFieldsValue }] = useYlConfigMetadataForm();

function handleRender() {
  error.value = '';
  try {
    const parsed = JSON.parse(metadataJson.value);
    currentMetadata.value = parsed;
    message.success('渲染成功');
  } catch (error_: any) {
    error.value = `JSON 解析失败: ${error_.message}`;
    message.error('JSON 解析失败');
  }
}

function handleReset() {
  metadataJson.value = JSON.stringify(defaultMetadata, null, 2);
  handleRender();
}

async function handleExternalSubmit() {
  try {
    await validate();
    const values = getFieldsValue();
    formData.value = values;
    message.success('外部提交成功');
  } catch {
    message.error('验证失败');
  }
}

async function handleSubmit(values: any) {
  formData.value = values;
  message.success('内部提交成功');
}

// Auto render on mount
onMounted(() => {
  handleRender();
});
</script>

<template>
  <Card title="导入 Metadata 渲染" class="mb-4">
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <!-- Input Area (40%) -->
      <div class="flex flex-col gap-2 lg:col-span-2">
        <div class="mb-2 font-bold">元数据 JSON 配置:</div>
        <Textarea
          v-model:value="metadataJson"
          :rows="20"
          placeholder="请输入 JSON 格式的元数据"
          class="font-mono text-sm"
        />
        <Space class="mt-2">
          <Button type="primary" @click="handleRender">渲染表单</Button>
          <Button @click="handleReset">重置 JSON</Button>
          <Button @click="handleExternalSubmit">获取数据 (外部调用)</Button>
        </Space>
      </div>

      <!-- Preview Area (60%) -->
      <div
        class="flex flex-col gap-2 border-l border-gray-200 pl-4 lg:col-span-3 dark:border-gray-700"
      >
        <div class="mb-2 font-bold">表单预览 (含内部操作栏):</div>
        <div v-if="error" class="mb-2 text-red-500">{{ error }}</div>

        <div
          v-if="currentMetadata"
          class="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <YlConfigMetadataForm
            @register="register"
            :metadata="currentMetadata"
            :show-action="true"
            layout="vertical"
            @submit="handleSubmit"
          />
        </div>
        <div v-else class="italic text-gray-400">
          点击左侧“渲染表单”以查看结果
        </div>

        <div
          class="mb-2 mt-4 rounded bg-blue-50 p-2 font-bold dark:bg-blue-900/20"
        >
          提交结果 / 表单数据:
        </div>
        <JsonViewer :value="formData" copyable boxed />
      </div>
    </div>
  </Card>
</template>
