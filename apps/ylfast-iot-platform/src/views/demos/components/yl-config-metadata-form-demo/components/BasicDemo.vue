<script lang="ts" setup>
import type { ConfigMetadata } from '#/types/config-metadata';

import { ref } from 'vue';

import { Button, Card, message, Space } from 'ant-design-vue';

import {
  useYlConfigMetadataForm,
  YlConfigMetadataForm,
} from '#/components/yl-config-metadata-form';

const formDataBasic = ref({});
const [
  registerBasic,
  {
    setProps: setPropsBasic,
    validate: validateBasic,
    resetFields: resetFieldsBasic,
    getFieldsValue: getFieldsValueBasic,
  },
] = useYlConfigMetadataForm();

const longMarkdown = `
# MQTT Client Configuration Guide

This comprehensive guide details how to configure your MQTT client for optimal performance and security.

## 1. Introduction

MQTT (Message Queuing Telemetry Transport) is a lightweight, publish-subscribe network protocol.

## 2. Basic Connection Settings

### 2.1 Host
The **Host** is the IP address or domain name of your MQTT broker.

### 2.2 Port
- **1883**: Default non-secure port.
- **8883**: Default secure port (TLS/SSL).
`;

const basicMetadata: ConfigMetadata = {
  name: 'Simple MQTT Config',
  description: 'A flat configuration example',
  document: longMarkdown,
  properties: [
    {
      property: 'host',
      name: 'Host',
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
    {
      property: 'useTls',
      name: 'Use TLS',
      type: { type: 'BOOLEAN', expands: { defaultValue: false } },
    },
    {
      property: 'type',
      name: 'Client Type',
      type: {
        type: 'ENUM',
        expands: {
          options: [
            { label: 'Publisher', value: 'PUB' },
            { label: 'Subscriber', value: 'SUB' },
          ],
          required: true,
        },
      },
    },
  ],
};

function handleSetPropsBasic() {
  setPropsBasic({
    metadata: basicMetadata,
    model: { host: 'localhost', type: 'PUB' },
  });
  message.success('基础配置已加载');
}

async function handleValidateBasic() {
  try {
    await validateBasic();
    formDataBasic.value = getFieldsValueBasic();
    message.success('验证通过');
  } catch {
    message.error('验证失败');
  }
}

function handleResetBasic() {
  resetFieldsBasic();
  formDataBasic.value = {};
}
</script>

<template>
  <Card title="基础表单 (扁平结构)" class="mb-4">
    <template #extra>
      <Space>
        <Button @click="handleSetPropsBasic">加载配置</Button>
        <Button type="primary" @click="handleValidateBasic">
          验证并获取值
        </Button>
        <Button @click="handleResetBasic">重置</Button>
      </Space>
    </template>
    <YlConfigMetadataForm @register="registerBasic" />
  </Card>

  <Card title="表单数据" class="mt-4" v-if="formDataBasic">
    <pre>{{ JSON.stringify(formDataBasic, null, 2) }}</pre>
  </Card>
</template>
