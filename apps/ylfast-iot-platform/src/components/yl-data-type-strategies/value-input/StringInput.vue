<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { Input, Textarea } from 'ant-design-vue';

import { selectRegistry } from '#/components/business/select-registry';
import { selectorRegistry } from '#/components/business/selector-registry';
import YlApiSelect from '#/components/yl-api-select';
import { YlMarkdown } from '#/components/yl-markdown';
import { YlMonacoEditor } from '#/components/yl-monaco-editor';
import {
  getComponent,
  getComponentProps,
  isDisabled,
} from '#/utils/config-metadata';

const props = defineProps<{
  formModel?: any;
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

  // markdown组件给定默认属性
  if (baseProps.type === 'markdown') {
    baseProps.mode = 'edit';

    // @ts-ignore
    // 使markdown编辑器平铺，默认是弹框模式
    baseProps.displayMode = 'flat';
  }

  return baseProps;
});

const customComponent = computed(() => {
  const component = getComponent(props.prop);

  // 如果type为markdown则使用markdown编辑器
  if (componentProps.value && componentProps.value.type === 'markdown') {
    return YlMarkdown;
  }

  // 如果type为code则使用编辑器
  if (componentProps.value && componentProps.value.type === 'code') {
    return YlMonacoEditor;
  }

  // 如果type为richText
  if (componentProps.value && componentProps.value.type === 'richText') {
    return Textarea;
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

  // 如果type为select则使用YlApiSelect
  if (componentProps.value && componentProps.value.type === 'select') {
    // 优先从业务选择器注册中心获取
    const businessId =
      componentProps.value.businessId || props.prop.type?.expands?.businessId;
    if (businessId) {
      const selectComponent = selectRegistry.get(businessId);
      if (selectComponent) {
        return selectComponent;
      }
    }
    return YlApiSelect;
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
  // 2. 如果是代码编辑器模式或markdown编辑器 默认使用 modelValue (v-model)
  if (
    componentProps.value &&
    ['code', 'markdown'].includes(componentProps.value.type ?? '')
  ) {
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
    :disabled="isDisabled(prop)"
    :form-model="formModel"
    allow-clear
    v-bind="componentProps"
  />
</template>
