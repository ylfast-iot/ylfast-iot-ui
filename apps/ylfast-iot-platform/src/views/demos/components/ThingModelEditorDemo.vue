<script setup lang="ts">
/**
 * @author yaolonga
 * @email 1638538651@qq.com
 */
import type { DeviceMetadata } from '#/types/metadata';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Switch } from 'ant-design-vue';

import { ThingModelEditor } from '#/components/yl-thing-model-editor';

const disabled = ref(false);

const mockData = ref<DeviceMetadata>({
  id: 'device_001',
  name: 'Smart Sensor',
  description: 'A smart sensor device',
  expands: {
    propertyGroups: [
      { id: 'group_base', name: 'Basic Info' },
      { id: 'group_env', name: 'Environment' },
    ],
  },
  properties: [
    {
      id: 'temp',
      name: 'Temperature',
      description: 'Current temperature',
      valueType: { type: 'DOUBLE' },
      // @ts-ignore
      propertyValueType: { type: 'DOUBLE' },
      source: { type: 'DEVICE', accessType: ['READ', 'REPORT'] },
      expands: {
        groupId: 'group_env',
        propertyValueWebDisplay: true,
        storageType: { ignore: false, 'json-string': false },
      },
      // @ts-ignore
      required: true,
    },
    {
      id: 'firmware_version',
      name: 'Firmware Version',
      description: '',
      valueType: { type: 'STRING' },
      // @ts-ignore
      propertyValueType: { type: 'STRING' },
      source: { type: 'DEVICE', accessType: ['READ'] },
      expands: {
        groupId: 'group_base',
        propertyValueWebDisplay: true,
        storageType: { ignore: false, 'json-string': false },
      },
      // @ts-ignore
      required: false,
    },
  ],
  functions: [
    {
      id: 'reboot',
      name: 'Reboot',
      description: 'Reboot device',
      async: false,
      inputParams: [],
      output: { type: 'BOOLEAN' },
      expands: {},
    },
    {
      id: 'set_threshold',
      name: 'Set Threshold',
      description: '',
      async: true,
      inputParams: [
        {
          id: 'val',
          name: 'Value',
          description: '',
          valueType: { type: 'DOUBLE' },
          // @ts-ignore
          propertyValueType: { type: 'DOUBLE' },
          expands: {},
        },
      ],
      output: { type: 'STRING' },
      expands: {},
    },
  ],
  events: [
    {
      id: 'overheat',
      name: 'Overheat Alarm',
      description: '',
      eventType: { type: 'ALARM', alarmLevel: 'warn' },
      output: { type: 'DOUBLE' },
    },
  ],
});
</script>

<template>
  <Page
    auto-content-height
    title="Thing Model Editor Demo"
    description="Demo for IoT Thing Model Editor"
  >
    <div class="mb-4 flex gap-4">
      <div class="flex items-center gap-2">
        <span>Disabled:</span>
        <Switch v-model:checked="disabled" />
      </div>
    </div>

    <Card
      class="h-[600px] w-full"
      :body-style="{
        height: '100%',
      }"
    >
      <ThingModelEditor v-model:value="mockData" :disabled="disabled" />
    </Card>

    <div class="mt-4">
      <h3>Data Preview:</h3>
      <textarea
        class="h-64 w-full rounded border p-2 font-mono text-xs"
        readonly
        :value="JSON.stringify(mockData, null, 2)"
      ></textarea>
    </div>
  </Page>
</template>
