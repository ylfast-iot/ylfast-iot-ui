<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { DataType, DataTypeDef } from '#/types/data-type';

import { computed, ref, shallowRef, watch } from 'vue';

import { JsonViewer } from '@vben/common-ui';

import { Card, Select } from 'ant-design-vue';

import { getTypeDefinitionComponent } from '#/components/yl-data-type-strategies/type-definition';
import { getFormItemComponent } from '#/components/yl-data-type-strategies/value-input';
import { DATA_TYPE_OPTIONS } from '#/enums/data-type';

const currentType = ref<DataType>('FLOAT');
const definitionValue = ref<DataTypeDef>({ type: 'FLOAT' });
const inputValue = ref<any>(null);

const DefinitionComponent = shallowRef<any>(null);
const InputComponent = shallowRef<any>(null);

// Watch type change to load components and reset values
watch(
  currentType,
  (newType) => {
    // 1. Load Definition Component
    DefinitionComponent.value = getTypeDefinitionComponent(newType);
    // Reset definition value based on type
    const newDef: DataTypeDef = { type: newType };
    if (newType === 'ENUM') {
      (newDef as any).enums = [];
      (newDef as any).elementValueType = { type: 'STRING' };
    } else if (newType === 'ARRAY') {
      (newDef as any).elementType = { type: 'STRING' };
    }
    definitionValue.value = newDef;

    // 2. Load Input Component
    InputComponent.value = getFormItemComponent(newType);
    // Reset input value
    inputValue.value = null;
  },
  { immediate: true },
);

// Construct the mock Prop for the Input Component based on the current Definition
const currentProp = computed<ConfigPropertyMetadata>(() => {
  return {
    property: 'demoProperty',
    name: '演示属性',
    // IMPORTANT: Pass the definitionValue (reactive) as the type definition
    type: definitionValue.value,
  };
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="mb-2 flex items-center">
      <span class="mr-4 font-bold">选择数据类型:</span>
      <Select
        v-model:value="currentType"
        :options="DATA_TYPE_OPTIONS"
        class="w-48"
      />
    </div>

    <div class="flex flex-col gap-4 md:flex-row">
      <!-- Left Column: Type Definition -->
      <Card title="1. 类型定义 (Definition)" class="flex-1">
        <div v-if="DefinitionComponent" class="mb-4 rounded border p-4">
          <component
            :is="DefinitionComponent"
            v-model:value="definitionValue"
          />
        </div>
        <div v-else class="mb-4 p-4 text-gray-500">
          该类型无需额外配置或未注册定义组件。
        </div>

        <div class="mt-4">
          <h4 class="mb-2 font-bold text-gray-600">定义数据 (DataTypeDef):</h4>
          <JsonViewer
            :value="definitionValue"
            :expanded="true"
            boxed
            copyable
          />
        </div>
      </Card>

      <!-- Right Column: Value Input -->
      <Card title="2. 值输入 (Input)" class="flex-1">
        <div v-if="InputComponent" class="mb-4 rounded border p-4">
          <p class="mb-2 text-sm text-gray-500">
            根据左侧定义限制输入 (如最大值、最小值):
          </p>
          <component
            :is="InputComponent"
            v-model:value="inputValue"
            :prop="currentProp"
          />
        </div>
        <div v-else class="mb-4 p-4 text-gray-500">该类型未注册输入组件。</div>

        <div class="mt-4">
          <h4 class="mb-2 font-bold text-gray-600">输入值 (Value):</h4>
          <JsonViewer
            :value="{ value: inputValue }"
            :expanded="true"
            boxed
            copyable
          />
        </div>
      </Card>
    </div>
  </div>
</template>
