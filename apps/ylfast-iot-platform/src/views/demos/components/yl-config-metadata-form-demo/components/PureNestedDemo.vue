<script lang="ts" setup>
import type { ConfigMetadata } from '#/types/config-metadata';

import { ref } from 'vue';

import { Button, Card, message, Space } from 'ant-design-vue';

import {
  useYlConfigMetadataForm,
  YlConfigMetadataForm,
} from '#/components/yl-config-metadata-form';

const formDataPureNested = ref({});
const [
  registerPureNested,
  {
    setProps: setPropsPureNested,
    validate: validatePureNested,
    resetFields: resetFieldsPureNested,
    getFieldsValue: getFieldsValuePureNested,
  },
] = useYlConfigMetadataForm();

const addressConfigMetadata: ConfigMetadata = {
  name: 'Address',
  properties: [
    {
      property: 'street',
      name: 'Street',
      type: { type: 'STRING', expands: { required: true } },
    },
    {
      property: 'city',
      name: 'City',
      type: { type: 'STRING', expands: { required: true } },
    },
    { property: 'zipCode', name: 'Zip Code', type: { type: 'STRING' } },
  ],
};

const contactConfigMetadata: ConfigMetadata = {
  name: 'Contact',
  properties: [
    {
      property: 'email',
      name: 'Email',
      type: { type: 'STRING', expands: { componentProps: { type: 'email' } } },
    },
    { property: 'phone', name: 'Phone', type: { type: 'STRING' } },
  ],
};

const pureNestedMetadata: ConfigMetadata = {
  name: 'User Profile Configuration',
  description: 'A configuration demonstrating pure object nesting.',
  properties: [
    {
      property: 'userName',
      name: 'User Name',
      type: { type: 'STRING', expands: { required: true } },
    },
    {
      property: 'address',
      name: 'Address Information',
      type: {
        type: 'OBJECT',
        expands: {
          configMetadata: addressConfigMetadata,
        },
      },
    },
    {
      property: 'contact',
      name: 'Contact Information',
      type: {
        type: 'OBJECT',
        expands: {
          configMetadata: contactConfigMetadata,
        },
      },
    },
  ],
};

function handleSetPropsPureNested() {
  setPropsPureNested({
    metadata: pureNestedMetadata,
  });
  message.success('纯粹嵌套配置已加载');
}

async function handleValidatePureNested() {
  try {
    await validatePureNested();
    formDataPureNested.value = getFieldsValuePureNested();
    message.success('验证通过');
  } catch {
    message.error('验证失败');
  }
}

function handleResetPureNested() {
  resetFieldsPureNested();
  formDataPureNested.value = {};
}
</script>

<template>
  <Card title="纯粹对象嵌套" class="mb-4">
    <template #extra>
      <Space>
        <Button @click="handleSetPropsPureNested">加载配置</Button>
        <Button type="primary" @click="handleValidatePureNested">
          验证并获取值
        </Button>
        <Button @click="handleResetPureNested">重置</Button>
      </Space>
    </template>
    <YlConfigMetadataForm @register="registerPureNested" />
  </Card>

  <Card title="表单数据" class="mt-4" v-if="formDataPureNested">
    <pre>{{ JSON.stringify(formDataPureNested, null, 2) }}</pre>
  </Card>
</template>
