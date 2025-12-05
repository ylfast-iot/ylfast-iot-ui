<script lang="ts" setup>
import type { ConfigMetadata } from '#/types/config-metadata';

import { ref } from 'vue';

import { Card, Checkbox, message, Space } from 'ant-design-vue';

import { YlConfigMetadataForm } from '#/components/yl-config-metadata-form';

const showAction = ref(true);
const showSubmit = ref(true);
const showReset = ref(true);

function handleDemoSubmit(values: any) {
  message.success(`提交成功: ${JSON.stringify(values)}`);
}

function handleDemoReset() {
  message.info('表单已重置');
}

const basicMetadata: ConfigMetadata = {
  name: 'Simple MQTT Config',
  properties: [
    {
      property: 'host',
      name: 'Host',
      type: { type: 'STRING', expands: { required: true } },
    },
  ],
};
</script>

<template>
  <Card title="底部操作栏示例" class="mb-4">
    <template #extra>
      <Space>
        <Checkbox v-model:checked="showAction">显示操作栏</Checkbox>
        <Checkbox v-model:checked="showSubmit">显示提交</Checkbox>
        <Checkbox v-model:checked="showReset">显示重置</Checkbox>
      </Space>
    </template>

    <YlConfigMetadataForm
      :metadata="basicMetadata"
      :show-action="showAction"
      :show-submit-button="showSubmit"
      :show-reset-button="showReset"
      submit-button-text="保存设置"
      @submit="handleDemoSubmit"
      @reset="handleDemoReset"
    />
  </Card>
</template>
