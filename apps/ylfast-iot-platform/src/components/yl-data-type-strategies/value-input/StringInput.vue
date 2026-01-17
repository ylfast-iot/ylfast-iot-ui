<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { Input } from 'ant-design-vue';

import { selectorRegistry } from '#/components/business/selector-registry';
import { YlMonacoEditor } from '#/components/yl-monaco-editor';
import { getComponent, getComponentProps } from '#/utils/config-metadata';

const props = defineProps<{
  prop: ConfigPropertyMetadata;
  value: any;
}>();

const emit = defineEmits(['update:value', 'change']);

const innerValue = computed({
  get: () => props.value,
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

const componentProps = computed(() => {
  const baseProps = getComponentProps(props.prop);
  if (!baseProps.placeholder) {
    baseProps.placeholder = `${$t('ylConfigMetadataForm.pleaseEnter')}${props.prop.name}`;
  }
  return baseProps;
});

const customComponent = computed(() => {
  const component = getComponent(props.prop);

  // 如果type为code则使用编辑器
  if (componentProps.value && componentProps.value.type === 'code') {
    return YlMonacoEditor;
  }

  // 如果type为selector则使用选择器
  if (componentProps.value && componentProps.value.type === 'selector') {
    // 获取从注册中心获取选择器
    const selectorType = componentProps.value.selectorType;
    if (selectorType) {
      const selector = selectorRegistry.get(selectorType);
      if (selector) {
        return selector;
      }
    }
  }

  if (typeof component === 'string') {
    if (component === 'Input') {
      return Input;
    }
    // 其他自定义组件
    return Input;
  }

  return component;
});

// 计算内部组件应该绑定的字段名
const modelField = computed(() => {
  // 1. 优先使用 expands 中明确定义的 modelField
  if (props.prop.type.expands?.modelField) {
    return props.prop.type.expands.modelField;
  }
  // 2. 如果是代码编辑器模式，Monaco 默认使用 modelValue (v-model)
  if (componentProps.value && componentProps.value.type === 'code') {
    return 'modelValue';
  }
  // 3. 默认使用 Ant Design Vue 规范的 value (v-model:value)
  return 'value';
});
</script>

<template>
  <component
    :is="customComponent"
    :[modelField]="innerValue"
    :[`onUpdate:${modelField}`]="(val: any) => (innerValue = val)"
    allow-clear
    v-bind="componentProps"
  />
</template>
