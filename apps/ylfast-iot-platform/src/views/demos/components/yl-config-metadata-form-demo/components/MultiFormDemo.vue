<script lang="ts" setup>
import type { ConfigMetadata } from '#/types/config-metadata';

import { ref } from 'vue';

import { Button, Card, message, Space } from 'ant-design-vue';

import {
  useYlConfigMetadataForm,
  YlConfigMetadataForm,
} from '#/components/yl-config-metadata-form';

const formDataMulti = ref({});
const [
  registerMulti,
  {
    setProps: setPropsMulti,
    validate: validateMulti,
    resetFields: resetFieldsMulti,
    getFieldsValue: getFieldsValueMulti,
  },
] = useYlConfigMetadataForm();

const longMarkdown = `
# MQTT Client Configuration Guide

This comprehensive guide details how to configure your MQTT client for optimal performance and security.

## 1. Introduction

MQTT (Message Queuing Telemetry Transport) is a lightweight, publish-subscribe network protocol.
`;

const multiMetadata: ConfigMetadata[] = [
  {
    name: 'Basic Information',
    description: 'General application settings',
    document: longMarkdown,
    properties: [
      {
        property: 'appName',
        name: 'App Name',
        type: { type: 'STRING', expands: { required: true } },
      },
      { property: 'version', type: { type: 'STRING' } },
    ],
  },
  {
    name: 'Network Settings',
    description: 'Connectivity options',
    properties: [
      {
        property: 'ip',
        name: 'IP Address',
        type: { type: 'STRING', expands: { span: 12, required: true } },
      },
      { property: 'port', type: { type: 'INTEGER', expands: { span: 12 } } },
    ],
  },
];

function handleSetPropsMulti() {
  setPropsMulti({
    metadata: multiMetadata,
    model: {
      appName: 'My IoT App',
      version: '1.0.0',
    },
  });
  message.success('多表单配置已加载');
}

async function handleValidateMulti() {
  try {
    await validateMulti();
    formDataMulti.value = getFieldsValueMulti();
    message.success('验证通过');
  } catch {
    message.error('验证失败');
  }
}

function handleResetMulti() {
  resetFieldsMulti();
  formDataMulti.value = {};
}
</script>

<template>
  <Card title="多配置组渲染" class="mb-4">
    <template #extra>
      <Space>
        <Button @click="handleSetPropsMulti">加载配置</Button>
        <Button type="primary" @click="handleValidateMulti">
          验证并获取值
        </Button>
        <Button @click="handleResetMulti">重置</Button>
      </Space>
    </template>
    <YlConfigMetadataForm @register="registerMulti" />
  </Card>

  <Card title="表单数据" class="mt-4" v-if="formDataMulti">
    <pre>{{ JSON.stringify(formDataMulti, null, 2) }}</pre>
  </Card>
</template>
