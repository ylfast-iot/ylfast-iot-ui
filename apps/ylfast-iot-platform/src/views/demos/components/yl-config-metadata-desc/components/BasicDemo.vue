<script setup lang="ts">
import type { ConfigMetadata } from '#/types/config-metadata';
import type { Recordable } from '#/types/data-type';

import { ref } from 'vue';

import { Card } from 'ant-design-vue';

import { YlConfigMetadataDesc } from '#/components/yl-config-metadata-desc';

// 模拟配置元数据
const metadata = ref<ConfigMetadata>({
  name: '设备基本配置',
  description: '设备的基础配置信息',
  properties: [
    {
      property: 'deviceName',
      name: '设备名称',
      description: '设备的唯一标识名称',
      type: {
        type: 'STRING',
        expands: {
          required: true,
          maxLength: 50,
        },
      },
    },
    {
      property: 'deviceType',
      name: '设备类型',
      description: '设备的分类类型',
      type: {
        type: 'ENUM',
        elements: [
          { value: 'sensor', text: '传感器' },
          { value: 'actuator', text: '执行器' },
          { value: 'gateway', text: '网关' },
        ],
        expands: {
          required: true,
        },
      },
    },
    {
      property: 'enabled',
      name: '启用状态',
      description: '设备是否启用',
      type: {
        type: 'BOOLEAN',
        expands: {
          defaultValue: true,
        },
      },
    },
    {
      property: 'port',
      name: '端口号',
      description: '设备通信端口',
      type: {
        type: 'INTEGER',
        expands: {
          defaultValue: 8080,
        },
      },
    },
    {
      property: 'tags',
      name: '标签',
      description: '设备标签',
      type: {
        type: 'ARRAY',
        expands: {},
      },
    },
    {
      property: 'description',
      name: '描述',
      description: '设备详细描述',
      type: {
        type: 'STRING',
        expands: {
          maxLength: 200,
        },
      },
    },
  ],
});

// 模拟数据
const model = ref<Recordable>({
  deviceName: 'Device-001',
  deviceType: 'sensor',
  enabled: true,
  port: 8080,
  tags: ['温度', '湿度', '压力'],
  description: '这是一个温湿度传感器设备',
});
</script>

<template>
  <div class="basic-demo">
    <Card title="基础示例 - 预览模式">
      <YlConfigMetadataDesc
        :metadata="metadata"
        :model="model"
        :show-edit-button="false"
      />
    </Card>

    <Card class="mt-4" title="数据模型">
      <pre class="text-sm">{{ JSON.stringify(model, null, 2) }}</pre>
    </Card>
  </div>
</template>

<style scoped>
.basic-demo {
  max-width: 1200px;
}
</style>
