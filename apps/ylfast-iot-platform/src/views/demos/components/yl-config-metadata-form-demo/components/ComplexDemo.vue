<script lang="ts" setup>
import type { ConfigMetadata } from '#/types/config-metadata';

import { ref } from 'vue';

import { Button, Card, message, Space } from 'ant-design-vue';

import {
  useYlConfigMetadataForm,
  YlConfigMetadataForm,
} from '#/components/yl-config-metadata-form';

const formDataComplex = ref({});
const [
  registerComplex,
  {
    setProps: setPropsComplex,
    validate: validateComplex,
    resetFields: resetFieldsComplex,
    getFieldsValue: getFieldsValueComplex,
  },
] = useYlConfigMetadataForm();

// 定义嵌套的属性配置
const mqttConfigMetadata: ConfigMetadata = {
  name: 'MQTT Settings', // Name for the nested form card
  description: '这是一个描述',
  properties: [
    {
      property: 'host',
      name: 'Broker Host',
      type: { type: 'STRING', expands: { required: true, span: 12 } },
    },
    {
      property: 'port',
      name: 'Port',
      type: {
        type: 'INTEGER',
        expands: { required: true, span: 12, defaultValue: 1883 },
      },
    },
  ],
};

const httpConfigMetadata: ConfigMetadata = {
  name: 'HTTP Settings', // Name for the nested form card
  properties: [
    {
      property: 'url',
      name: 'Endpoint URL',
      type: { type: 'STRING', expands: { required: true } },
    },
    {
      property: 'headers',
      name: 'Headers (JSON)',
      description: 'Enter headers as JSON string',
      type: { type: 'STRING' },
    },
  ],
};

const complexMetadata: ConfigMetadata = {
  name: 'Device Connection Configuration',
  description: 'Demonstrates Nested Objects and Linkage Logic',
  properties: [
    {
      property: 'deviceName',
      name: 'Device Name',
      type: { type: 'STRING', expands: { required: true, span: 12 } },
    },
    {
      property: 'isEnabled',
      name: 'Enabled',
      type: { type: 'BOOLEAN', expands: { span: 12, defaultValue: true } },
    },
    {
      property: 'protocol',
      name: 'Protocol',
      description: 'Select protocol to see linkage fields',
      type: {
        type: 'ENUM',
        expands: {
          required: true,
          linkageProperty: 'connectionSettings',
          options: [
            { label: 'MQTT', value: 'MQTT' },
            { label: 'HTTP', value: 'HTTP' },
          ],
          linkagePropertyEnumMapConfig: {
            MQTT: mqttConfigMetadata,
            HTTP: httpConfigMetadata,
          },
        },
      },
    },
  ],
};

function handleSetPropsComplex() {
  setPropsComplex({
    metadata: complexMetadata,
    model: {
      deviceName: 'Test Device 01',
      protocol: 'MQTT',
      connectionSettings: { host: 'broker.hivemq.com' },
    },
  });
  message.success('复杂配置已加载');
}

async function handleValidateComplex() {
  try {
    await validateComplex();
    formDataComplex.value = getFieldsValueComplex();
    message.success('验证通过');
  } catch {
    message.error('验证失败');
  }
}

function handleResetComplex() {
  resetFieldsComplex();
  formDataComplex.value = {};
}
</script>

<template>
  <Card title="复杂表单 (对象嵌套 & 字段联动)" class="mb-4">
    <template #extra>
      <Space>
        <Button @click="handleSetPropsComplex">加载配置</Button>
        <Button type="primary" @click="handleValidateComplex">
          验证并获取值
        </Button>
        <Button @click="handleResetComplex">重置</Button>
      </Space>
    </template>
    <YlConfigMetadataForm @register="registerComplex" />
  </Card>

  <Card title="表单数据" class="mt-4" v-if="formDataComplex">
    <pre>{{ JSON.stringify(formDataComplex, null, 2) }}</pre>
  </Card>
</template>
