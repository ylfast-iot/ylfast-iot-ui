<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { NumberTypeDef } from '#/types/data-type';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { InputNumber } from 'ant-design-vue';

import { selectRegistry } from '#/components/business/select-registry';
import YlApiSelect from '#/components/yl-api-select';
import { getComponentProps, isDisabled } from '#/utils/config-metadata';

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

const typeDef = computed(() => props.prop.type as NumberTypeDef);

const isFloat = computed(() =>
  ['DOUBLE', 'FLOAT'].includes(props.prop.type.type),
);

const componentType = computed(
  () => getComponentProps(props.prop).type as string,
);

const apiSelectComponent = computed(() => {
  const businessId =
    getComponentProps(props.prop).businessId ||
    props.prop.type?.expands?.businessId;
  if (businessId) {
    const selectComponent = selectRegistry.get(businessId);
    if (selectComponent) {
      return selectComponent;
    }
  }
  return YlApiSelect;
});
</script>

<template>
  <component
    :is="apiSelectComponent"
    v-if="componentType === 'select'"
    v-model:value="innerValue"
    v-bind="getComponentProps(prop)"
    class="w-full"
    :disabled="isDisabled(prop)"
    :form-model="formModel"
  />
  <InputNumber
    v-else
    v-model:value="innerValue"
    :placeholder="`${$t('ylConfigMetadataForm.pleaseEnter')}${props.prop.name}`"
    class="w-full"
    :precision="isFloat ? undefined : 0"
    :step="isFloat ? 0.1 : 1"
    :min="typeDef.min"
    :max="typeDef.max"
    :disabled="isDisabled(prop)"
    v-bind="getComponentProps(prop)"
  />
</template>
