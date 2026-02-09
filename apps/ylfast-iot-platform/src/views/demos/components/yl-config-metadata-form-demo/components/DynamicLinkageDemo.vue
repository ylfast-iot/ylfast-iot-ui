<script lang="ts" setup>
import type { ConfigMetadata } from '#/types/config-metadata';

import { ref } from 'vue';

import { Button, Card, message, Space } from 'ant-design-vue';

import { YlConfigMetadataDesc } from '#/components/yl-config-metadata-desc';
import {
  useYlConfigMetadataForm,
  YlConfigMetadataForm,
} from '#/components/yl-config-metadata-form';

/**
 * 作者：yaolonga
 * 邮箱：1638538651@qq.com
 */

const formDataDynamic = ref({});
const [
  registerDynamic,
  {
    setProps: setPropsDynamic,
    validate: validateDynamic,
    resetFields: resetFieldsDynamic,
    getFieldsValue: getFieldsValueDynamic,
  },
] = useYlConfigMetadataForm();

const mqttConfig: ConfigMetadata = {
  name: 'MQTT 详细配置',
  properties: [
    {
      property: 'host',
      name: '服务器地址',
      type: {
        type: 'STRING',
        expands: { required: true, defaultValue: '127.0.0.1' },
      },
    },
    {
      property: 'port',
      name: '端口',
      type: {
        type: 'INTEGER',
        expands: { required: true, defaultValue: 1883 },
      },
    },
  ],
};

const httpConfig: ConfigMetadata = {
  name: 'HTTP 详细配置',
  properties: [
    {
      property: 'url',
      name: '接口 URL',
      type: {
        type: 'STRING',
        expands: { required: true, defaultValue: 'http://api.example.com' },
      },
    },
    {
      property: 'method',
      name: '请求方法',
      type: {
        type: 'ENUM',
        expands: {
          options: [
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
          ],
          defaultValue: 'POST',
        },
      },
    },
  ],
};

const dynamicLinkageMetadata: ConfigMetadata = {
  name: '动态联动配置 (linkagePropertyIsSelectValue)',
  description:
    '联动属性根据选中的值决定，如果选中 MQTT，数据将保存到 model.MQTT 中',
  properties: [
    {
      property: 'protocol',
      name: '协议类型',
      type: {
        type: 'ENUM',
        expands: {
          required: true,
          defaultValue: 'MQTT',
          linkagePropertyIsSelectValue: true,
          options: [
            { label: 'MQTT 协议', value: 'MQTT' },
            { label: 'HTTP 协议', value: 'HTTP' },
          ],
          linkagePropertyEnumMapConfig: {
            MQTT: mqttConfig,
            HTTP: httpConfig,
          },
        },
      },
    },
  ],
};

function handleSetProps() {
  setPropsDynamic({
    metadata: dynamicLinkageMetadata,
    model: {
      protocol: 'MQTT',
      MQTT: { host: '192.168.1.1', port: 1883 },
    },
  });
  message.success('动态联动配置已加载');
}

async function handleValidate() {
  try {
    await validateDynamic();
    formDataDynamic.value = getFieldsValueDynamic();
    message.success('验证通过');
  } catch (error) {
    console.error(error);
    message.error('验证失败');
  }
}

function handleReset() {
  resetFieldsDynamic();
  formDataDynamic.value = {};
}
</script>

<template>
  <Card title="动态属性联动演示" class="mb-4">
    <template #extra>
      <Space>
        <Button @click="handleSetProps">加载配置</Button>
        <Button type="primary" @click="handleValidate"> 验证并获取值 </Button>
        <Button @click="handleReset">重置</Button>
      </Space>
    </template>
    <div class="p-2">
      <div class="mb-4 text-sm text-gray-500">
        当启用 <code>linkagePropertyIsSelectValue: true</code> 时，<code>
          linkageProperty
        </code>
        会失效， 联动表单的数据将根据当前选中的值作为 Key 存储在主模型中。
      </div>
      <YlConfigMetadataForm @register="registerDynamic" />
    </div>
  </Card>

  <Card title="表单实时数据" class="mt-4" v-if="formDataDynamic">
    <pre class="bg-gray-50 p-4 dark:bg-gray-900">{{
      JSON.stringify(formDataDynamic, null, 2)
    }}</pre>
  </Card>

  <Card title="描述列表演示" class="mt-4">
    <div class="p-2">
      <YlConfigMetadataDesc
        :metadata="dynamicLinkageMetadata"
        :model="formDataDynamic"
      />
    </div>
  </Card>
</template>
