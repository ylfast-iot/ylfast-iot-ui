<script setup lang="ts">
import type { ConfigMetadata } from '#/types/config-metadata';
import type { Recordable } from '#/types/data-type';

import { ref } from 'vue';

import { Card, message } from 'ant-design-vue';

import { YlConfigMetadataDesc } from '#/components/yl-config-metadata-desc';

// 模拟配置元数据
const metadata = ref<ConfigMetadata>({
  name: '设备配置',
  description: '设备的配置信息',
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
      type: {
        type: 'INTEGER',
        expands: {
          defaultValue: 8080,
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
});

// 保存处理
function handleSave(data: Recordable) {
  console.warn('保存数据:', data);
  // 更新 model
  Object.assign(model.value, data);
  message.success('保存成功！');
}

// 取消处理
function handleCancel() {
  console.warn('取消编辑');
  message.info('已取消编辑');
}
</script>

<template>
  <div class="edit-mode-demo">
    <Card title="编辑模式示例">
      <YlConfigMetadataDesc
        :model="model"
        :metadata="metadata"
        @cancel="handleCancel"
        @save="handleSave"
      />
    </Card>

    <Card class="mt-4" title="数据模型">
      <pre class="text-sm">{{ JSON.stringify(model, null, 2) }}</pre>
    </Card>
  </div>
</template>

<style scoped>
.edit-mode-demo {
  max-width: 1200px;
}
</style>
