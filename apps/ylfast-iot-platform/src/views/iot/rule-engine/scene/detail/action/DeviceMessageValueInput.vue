<script setup lang="ts">
import { computed } from 'vue';

import { Form, Input, Segmented, TreeSelect } from 'ant-design-vue';

import { getFormItemComponent } from '#/components/yl-data-type-strategies/value-input';

const props = defineProps<{
  builtinTree: any[];
  modelValue?: Record<string, any>;
  name: string;
  required?: boolean;
  type?: Record<string, any>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>];
}>();

const source = computed(() => props.modelValue?.source || 'fixed');
const dataType = computed(() => normalizeType(props.type?.type));
const typeProp = computed(() => ({
  name: props.name,
  type: {
    ...props.type,
    elements:
      props.type?.elements?.map((item: any) => ({
        label: item?.text || item?.name || String(item?.value ?? ''),
        value: item?.value,
      })) || [],
    type: dataType.value,
  },
  value: props.modelValue?.value,
}));

const ValueComponent = computed(() => getFormItemComponent(dataType.value));

function normalizeType(type?: string) {
  const upper = String(type || 'STRING').toUpperCase();
  if (['BYTE', 'INT', 'SHORT'].includes(upper)) return 'INTEGER';
  if (upper === 'DECIMAL') return 'DOUBLE';
  return upper;
}

function update(patch: Record<string, any>) {
  emit('update:modelValue', {
    ...props.modelValue,
    ...patch,
  });
}

function changeSource(nextSource: number | string) {
  const sourceValue = String(nextSource);
  if (sourceValue === 'upper') {
    emit('update:modelValue', {
      source: 'upper',
      upperKey: undefined,
      value: undefined,
    });
    return;
  }
  emit('update:modelValue', {
    source: 'fixed',
    upperKey: undefined,
    value: undefined,
  });
}

function changeFixedValue(value: any) {
  update({ source: 'fixed', value });
}

function changeUpperKey(value: string) {
  update({ source: 'upper', upperKey: value, value: undefined });
}

function filterTreeNode(input: string, node: any) {
  const texts = [node?.title, node?.description, node?.column, node?.value]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return texts.includes(input.toLowerCase());
}
</script>

<template>
  <div class="device-message-value-input">
    <Segmented
      class="source-switch"
      :options="[
        { label: '手动输入', value: 'fixed' },
        { label: '内置参数', value: 'upper' },
      ]"
      :value="source"
      @update:value="changeSource"
    />

    <Form.Item
      v-if="source === 'upper'"
      class="mb-0"
      :name="[name, 'upperKey']"
      :rules="required ? [{ required: true, message: `请选择${name}` }] : []"
    >
      <TreeSelect
        :value="modelValue?.upperKey"
        class="w-full"
        :tree-data="builtinTree"
        :dropdown-style="{ maxHeight: '320px', overflow: 'auto' }"
        placeholder="请选择内置参数"
        show-search
        tree-default-expand-all
        :filter-tree-node="filterTreeNode"
        tree-node-label-prop="selectedLabel"
        @update:value="changeUpperKey"
      />
    </Form.Item>

    <Form.Item
      v-else
      class="mb-0"
      :name="[name, 'value']"
      :rules="required ? [{ required: true, message: `请输入${name}` }] : []"
    >
      <component
        :is="ValueComponent"
        v-if="ValueComponent"
        :prop="typeProp"
        :value="modelValue?.value"
        @update:value="changeFixedValue"
        @change="changeFixedValue"
      />
      <Input
        v-else
        :value="modelValue?.value"
        :placeholder="`请输入${name}`"
        @update:value="changeFixedValue"
      />
    </Form.Item>
  </div>
</template>

<style scoped>
.device-message-value-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.source-switch {
  width: fit-content;
}
</style>
