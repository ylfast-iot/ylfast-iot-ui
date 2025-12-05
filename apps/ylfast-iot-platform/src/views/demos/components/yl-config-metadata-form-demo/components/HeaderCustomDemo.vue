<script lang="ts" setup>
import type { ConfigMetadata } from '#/types/config-metadata';

import { ref } from 'vue';

import { Card, Checkbox, Space } from 'ant-design-vue';

import { YlConfigMetadataForm } from '#/components/yl-config-metadata-form';

const hideRoot = ref(false);
const hideNested = ref(false);

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
            MQTT: {
              name: 'MQTT Settings',
              properties: [
                {
                  property: 'host',
                  name: 'Broker Host',
                  type: { type: 'STRING' },
                },
              ],
            },
            HTTP: {
              name: 'HTTP Settings',
              properties: [
                {
                  property: 'url',
                  name: 'Endpoint URL',
                  type: { type: 'STRING' },
                },
              ],
            },
          },
        },
      },
    },
  ],
};
</script>

<template>
  <Card title="自定义标题与隐藏" class="mb-4">
    <template #extra>
      <Space>
        <Checkbox v-model:checked="hideRoot">隐藏根标题</Checkbox>
        <Checkbox v-model:checked="hideNested">隐藏嵌套标题</Checkbox>
      </Space>
    </template>

    <YlConfigMetadataForm
      :metadata="complexMetadata"
      :hide-root-header="hideRoot"
      :hide-nested-header="hideNested"
    >
      <template #rootHeader="{ group }">
        <div
          class="mb-4 rounded bg-blue-100 p-2 font-bold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
        >
          自定义根标题: {{ group.name }}
        </div>
      </template>
      <template #nestedHeader="{ group }">
        <div
          class="mb-2 rounded bg-green-100 p-1 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300"
        >
          自定义嵌套标题: {{ group.name }}
        </div>
      </template>
    </YlConfigMetadataForm>
  </Card>
</template>
