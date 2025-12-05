<script setup lang="ts">
import type { ConfigMetadata } from '#/types/config-metadata';
import type { Recordable } from '#/types/data-type';

import { ref } from 'vue';

import { Card, message } from 'ant-design-vue';

import { YlConfigMetadataDesc } from '#/components/yl-config-metadata-desc';

// 复杂配置元数据（包含嵌套对象和联动）
const metadata = ref<ConfigMetadata>({
  name: '高级设备配置',
  description: '包含嵌套配置和联动关系的复杂示例',
  properties: [
    {
      property: 'protocol',
      name: '通信协议',
      description: '选择设备使用的通信协议',
      type: {
        type: 'ENUM',
        elements: [
          { value: 'mqtt', text: 'MQTT' },
          { value: 'http', text: 'HTTP' },
          { value: 'tcp', text: 'TCP' },
        ],
        expands: {
          required: true,
          linkageProperty: 'protocolConfig',
          linkagePropertyEnumMapConfig: {
            mqtt: {
              name: 'MQTT 配置',
              properties: [
                {
                  property: 'broker',
                  name: 'Broker 地址',
                  type: {
                    type: 'STRING',
                    expands: { required: true },
                  },
                },
                {
                  property: 'topic',
                  name: '主题',
                  type: {
                    type: 'STRING',
                    expands: { required: true },
                  },
                },
                {
                  property: 'qos',
                  name: 'QoS',
                  type: {
                    type: 'INTEGER',
                    expands: { defaultValue: 0 },
                  },
                },
              ],
            },
            http: {
              name: 'HTTP 配置',
              properties: [
                {
                  property: 'url',
                  name: 'URL',
                  type: {
                    type: 'STRING',
                    expands: { required: true },
                  },
                },
                {
                  property: 'method',
                  name: '请求方法',
                  type: {
                    type: 'ENUM',
                    elements: [
                      { value: 'GET', text: 'GET' },
                      { value: 'POST', text: 'POST' },
                    ],
                    expands: { defaultValue: 'GET' },
                  },
                },
              ],
            },
            tcp: {
              name: 'TCP 配置',
              properties: [
                {
                  property: 'host',
                  name: '主机地址',
                  type: {
                    type: 'STRING',
                    expands: { required: true },
                  },
                },
                {
                  property: 'port',
                  name: '端口',
                  type: {
                    type: 'INTEGER',
                    expands: { required: true, defaultValue: 8080 },
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      property: 'security',
      name: '安全配置',
      description: '设备安全相关配置',
      type: {
        type: 'OBJECT',
        expands: {
          configMetadata: {
            name: '安全设置',
            properties: [
              {
                property: 'enableAuth',
                name: '启用认证',
                type: {
                  type: 'BOOLEAN',
                  expands: { defaultValue: false },
                },
              },
              {
                property: 'username',
                name: '用户名',
                type: {
                  type: 'STRING',
                  expands: {},
                },
              },
              {
                property: 'password',
                name: '密码',
                type: {
                  type: 'PASSWORD',
                  expands: {},
                },
              },
            ],
          },
        },
      },
    },
  ],
});

// 模拟数据
const model = ref<Recordable>({
  protocol: 'mqtt',
  protocolConfig: {
    broker: 'mqtt://localhost:1883',
    topic: 'device/data',
    qos: 1,
  },
  security: {
    enableAuth: true,
    username: 'admin',
    password: '******',
  },
});

// 保存处理
function handleSave(data: Recordable) {
  console.warn('保存数据:', data);
  message.success('保存成功！');
}
</script>

<template>
  <div class="complex-demo">
    <Card title="复杂示例 - 嵌套对象与联动配置">
      <YlConfigMetadataDesc
        :metadata="metadata"
        :model="model"
        @save="handleSave"
      />
    </Card>

    <Card class="mt-4" title="数据模型">
      <pre class="text-sm">{{ JSON.stringify(model, null, 2) }}</pre>
    </Card>
  </div>
</template>

<style scoped>
.complex-demo {
  max-width: 1200px;
}
</style>
