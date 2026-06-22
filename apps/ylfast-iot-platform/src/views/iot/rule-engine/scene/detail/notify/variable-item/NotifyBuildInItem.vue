<script setup lang="ts">
import { computed, defineComponent, h } from 'vue';

import { DatePicker, Select, TreeSelect } from 'ant-design-vue';

import { getFormItemComponent } from '#/components/yl-data-type-strategies/value-input';

const props = defineProps<{
  builtinTree: any[];
  definition: any;
  modelValue: Record<string, any>;
}>();

const emit = defineEmits<{
  change: [value: { displayName?: string; otherColumn?: string }];
  'update:modelValue': [value: Record<string, any>];
}>();

const VariableValueRenderer = defineComponent({
  name: 'NotifyVariableValueRenderer',
  props: {
    definition: { type: Object, required: true },
    value: { type: Object, required: true },
  },
  emits: ['change'],
  setup(innerProps, { emit: innerEmit }) {
    const prop = computed(() =>
      createInputProp(innerProps.definition, innerProps.value),
    );
    const component = computed(() =>
      getFormItemComponent(resolveDataType(innerProps.definition)),
    );
    return () =>
      h(component.value as any, {
        prop: prop.value,
        value: innerProps.value?.value,
        'onUpdate:value': (val: any) => innerEmit('change', val),
      });
  },
});

const source = computed(() => props.modelValue?.source || 'fixed');
const treeData = computed(() => {
  const rawTree = props.builtinTree || [];
  const filtered = filterTreeByType(rawTree, getBusinessType(props.definition));
  return filtered.length > 0 ? filtered : rawTree;
});

function getBusinessType(item: any) {
  return String(
    item?.expands?.businessType || item?.type?.type || item?.type || 'string',
  ).toLowerCase();
}

function resolveDataType(item: any) {
  const type = String(item?.type?.type || item?.type || 'STRING').toUpperCase();
  return type === 'INT' ? 'INTEGER' : type;
}

function createInputProp(item: any, currentValue: any) {
  const enumElements =
    item?.type?.elements?.map((element: any) => ({
      label: element?.text || element?.name || String(element?.value ?? ''),
      value: element?.value,
    })) || [];
  return {
    name: item.name,
    type: {
      type: resolveDataType(item),
      elements: enumElements,
      expands: item?.type?.expands || {},
      falseText: item?.type?.falseText,
      max: item?.type?.max,
      min: item?.type?.min,
      trueText: item?.type?.trueText,
      valueType: item?.type?.valueType,
    },
    value: currentValue?.value,
  } as any;
}

function matchesVariableType(variableType: string, targetType: string) {
  const current = String(variableType || '').toLowerCase();
  if (!targetType || !current) return true;
  if (current === targetType) return true;
  if (
    ['double', 'float', 'int', 'integer', 'long', 'number'].includes(current) &&
    ['double', 'float', 'int', 'integer', 'long', 'number'].includes(targetType)
  ) {
    return true;
  }
  if (targetType === 'date') {
    return ['date', 'datetime'].includes(current);
  }
  return false;
}

function filterTreeByType(list: any[], targetType: string) {
  const result: any[] = [];
  for (const item of list || []) {
    const children = filterTreeByType(item.children || [], targetType);
    if (children.length > 0) {
      result.push({ ...item, children, disabled: true });
      continue;
    }
    if (matchesVariableType(item.variableType, targetType)) {
      result.push({ ...item, disabled: false, children: [] });
    }
  }
  return result;
}

function updateSource(value: 'fixed' | 'upper') {
  emit('update:modelValue', {
    ...props.modelValue,
    source: value,
    upperKey: value === 'upper' ? props.modelValue?.upperKey : undefined,
    value: value === 'fixed' ? props.modelValue?.value : undefined,
  });
  if (value === 'fixed') {
    emit('change', { otherColumn: undefined });
  }
}

function updateUpperValue(value: string, label: any, extra: any) {
  const data = extra?.triggerNode?.dataRef || extra?.triggerNode || {};
  emit('update:modelValue', {
    ...props.modelValue,
    source: 'upper',
    upperKey: value,
    value: undefined,
  });
  emit('change', {
    displayName: Array.isArray(label) ? label[0] : label,
    otherColumn: data?.column,
  });
}

function updateFixedValue(value: any) {
  emit('update:modelValue', {
    ...props.modelValue,
    source: 'fixed',
    value,
    upperKey: undefined,
  });
  emit('change', { otherColumn: undefined });
}

function titleRender(data: any) {
  return h('div', { class: 'builtin-title' }, [
    h('span', { class: 'builtin-name' }, data.fullTitle || data.title),
    data.description
      ? h('span', { class: 'builtin-desc' }, data.description)
      : null,
  ]);
}
</script>

<template>
  <div class="variable-inline-editor">
    <Select
      class="variable-source"
      :value="source"
      :options="[
        { label: '手动输入', value: 'fixed' },
        { label: '内置参数', value: 'upper' },
      ]"
      @update:value="updateSource($event)"
    />

    <TreeSelect
      v-if="source === 'upper'"
      :value="modelValue?.upperKey"
      class="variable-content"
      :tree-data="treeData"
      :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
      placeholder="请选择内置参数"
      tree-default-expand-all
      tree-node-filter-prop="title"
      show-search
      :tree-title-render="titleRender"
      @change="updateUpperValue"
    />

    <DatePicker
      v-else-if="getBusinessType(definition) === 'date'"
      :value="modelValue?.value"
      class="variable-content"
      allow-clear
      show-time
      value-format="YYYY-MM-DD HH:mm:ss"
      format="YYYY-MM-DD HH:mm:ss"
      @update:value="updateFixedValue($event)"
    />

    <VariableValueRenderer
      v-else
      :definition="definition"
      :value="modelValue || {}"
      class="variable-content"
      @change="updateFixedValue"
    />
  </div>
</template>

<style scoped>
.variable-inline-editor {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.variable-inline-editor:focus-within {
  background: #fff;
  border-color: #1677ff;
  box-shadow: 0 0 0 3px rgb(22 119 255 / 8%);
}

.variable-source {
  flex: none;
  width: 128px;
  background: #fafafa;
}

.variable-content {
  width: calc(100% - 128px);
}

.variable-inline-editor :deep(.ant-select-selector),
.variable-inline-editor :deep(.ant-picker),
.variable-inline-editor :deep(.ant-input),
.variable-inline-editor :deep(.ant-input-number),
.variable-inline-editor :deep(.ant-tree-select .ant-select-selector) {
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.variable-inline-editor :deep(.variable-source .ant-select-selector) {
  border-inline-end: 1px solid #f0f0f0 !important;
  border-start-start-radius: 12px !important;
  border-end-start-radius: 12px !important;
}

.variable-inline-editor :deep(.variable-content .ant-select-selector),
.variable-inline-editor :deep(.variable-content .ant-picker),
.variable-inline-editor :deep(.variable-content .ant-input),
.variable-inline-editor :deep(.variable-content .ant-input-number) {
  border-start-end-radius: 12px !important;
  border-end-end-radius: 12px !important;
}

.variable-inline-editor :deep(.ant-select-selection-placeholder),
.variable-inline-editor :deep(.ant-input::placeholder) {
  color: #bfbfbf;
}

.builtin-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  line-height: 1.4;
}

.builtin-name {
  font-weight: 500;
  color: #1f1f1f;
}

.builtin-desc {
  font-size: 12px;
  color: #8c8c8c;
}
</style>
