<script lang="ts" setup>
import type { ConfigMetadata } from '#/types/config-metadata';

import { ref } from 'vue';

import { Button, Card, message, Space } from 'ant-design-vue';

import {
  useYlConfigMetadataForm,
  YlConfigMetadataForm,
} from '#/components/yl-config-metadata-form';

const formDataBoolean = ref({});
const [
  registerBoolean,
  {
    setProps: setPropsBoolean,
    validate: validateBoolean,
    resetFields: resetFieldsBoolean,
    getFieldsValue: getFieldsValueBoolean,
  },
] = useYlConfigMetadataForm();

const notificationConfig: ConfigMetadata = {
  name: 'Notification Settings',
  properties: [
    {
      property: 'email',
      name: 'Email Address',
      type: { type: 'STRING', expands: { required: true } },
    },
    { property: 'sms', name: 'Phone Number', type: { type: 'STRING' } },
  ],
};

const booleanLinkageMetadata: ConfigMetadata = {
  name: 'User Preferences',
  description: 'Toggle switch to see linked fields',
  properties: [
    {
      property: 'username',
      name: 'Username',
      type: { type: 'STRING', expands: { required: true } },
    },
    {
      property: 'enableNotifications',
      name: 'Enable Notifications',
      type: {
        type: 'BOOLEAN',
        expands: {
          defaultValue: false,
          linkageProperty: 'details',
          linkagePropertyBooleanMapConfig: {
            true: notificationConfig,
          },
        },
      },
    },
  ],
};

function handleSetPropsBoolean() {
  setPropsBoolean({
    metadata: booleanLinkageMetadata,
    model: {
      username: 'user01',
      enableNotifications: false,
    },
  });
  message.success('布尔联动配置已加载');
}

async function handleValidateBoolean() {
  try {
    await validateBoolean();
    formDataBoolean.value = getFieldsValueBoolean();
    message.success('验证通过');
  } catch {
    message.error('验证失败');
  }
}

function handleResetBoolean() {
  resetFieldsBoolean();
  formDataBoolean.value = {};
}
</script>

<template>
  <Card title="布尔值联动表单" class="mb-4">
    <template #extra>
      <Space>
        <Button @click="handleSetPropsBoolean">加载配置</Button>
        <Button type="primary" @click="handleValidateBoolean">
          验证并获取值
        </Button>
        <Button @click="handleResetBoolean">重置</Button>
      </Space>
    </template>
    <YlConfigMetadataForm @register="registerBoolean" />
  </Card>

  <Card title="表单数据" class="mt-4" v-if="formDataBoolean">
    <pre>{{ JSON.stringify(formDataBoolean, null, 2) }}</pre>
  </Card>
</template>
