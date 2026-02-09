<script lang="ts" setup>
import type { ConfigMetadata } from '#/types/config-metadata';

import { ref } from 'vue';

import { Button, Card, message, Space } from 'ant-design-vue';

import {
  useYlConfigMetadataForm,
  YlConfigMetadataForm,
} from '#/components/yl-config-metadata-form';

/**
 * 作者：yaolonga
 * 邮箱：1638538651@qq.com
 */

const formDataObj = ref({});
const [
  registerObj,
  { setProps: setPropsObj, getFieldsValue: getFieldsValueObj },
] = useYlConfigMetadataForm();

const objectDefaultMetadata: ConfigMetadata = {
  name: '对象默认值演示',
  properties: [
    {
      property: 'name',
      name: '名称',
      type: {
        type: 'STRING',
        expands: { defaultValue: '默认名称' },
      } as any,
    },
    {
      property: 'connection',
      name: '连接配置',
      type: {
        type: 'OBJECT',
        properties: [
          {
            id: 'host',
            name: '主机',
            valueType: {
              type: 'STRING',
              expands: { defaultValue: 'mqtt.eclipseprojects.io' },
            },
          },
          {
            id: 'port',
            name: '端口',
            valueType: {
              type: 'INTEGER',
              expands: { defaultValue: 1883 },
            },
          },
          {
            id: 'auth',
            name: '认证',
            valueType: {
              type: 'BOOLEAN',
              expands: { defaultValue: true },
            },
          },
        ],
      } as any,
    },
  ],
};

function handleSetProps() {
  setPropsObj({
    metadata: objectDefaultMetadata,
    model: {}, // 传入空模型，看是否自动填充默认值
  });
  message.success('对象默认值配置已加载');
  formDataObj.value = getFieldsValueObj();
}

function handleGetValues() {
  formDataObj.value = getFieldsValueObj();
}
</script>

<template>
  <Card title="对象默认值填充演示" class="mb-4">
    <template #extra>
      <Space>
        <Button @click="handleSetProps">加载配置并检查默认值</Button>
        <Button type="primary" @click="handleGetValues">获取当前值</Button>
      </Space>
    </template>
    <div class="p-2">
      <div class="mb-4 text-sm text-gray-500">
        此示例测试当
        <code>OBJECT</code> 类型的属性中，其子属性（properties）定义了
        <code>defaultValue</code> 时， 表单是否能自动在 model 中初始化这些值。
      </div>
      <YlConfigMetadataForm @register="registerObj" />
    </div>
  </Card>

  <Card title="表单实时数据" class="mt-4" v-if="formDataObj">
    <pre class="bg-gray-50 p-4 dark:bg-gray-900">{{
      JSON.stringify(formDataObj, null, 2)
    }}</pre>
  </Card>
</template>
