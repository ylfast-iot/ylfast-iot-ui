<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { BooleanTypeDef } from '#/types/data-type';

import { computed } from 'vue';

import { Select } from 'ant-design-vue';

import { getComponentProps, isDisabled } from '#/utils/config-metadata';

const props = defineProps<{
  prop: ConfigPropertyMetadata;
  value: any;
}>();

const emit = defineEmits(['update:value', 'change']);

const typeDef = computed(() => props.prop.type as BooleanTypeDef);

const innerValue = computed({
  get: () =>
    typeof props.value === 'boolean'
      ? JSON.stringify(props.value)
      : props.value,
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

function convertValue(val: any, type: string | undefined) {
  if (type === 'NUMBER') {
    return Number(val);
  }
  if (type === 'BOOLEAN') {
    return String(val).toLowerCase() === 'true';
  }
  return val;
}

const checkedValue = computed(() => {
  const val = typeDef.value.trueValue || true;
  return convertValue(val, typeDef.value.valueType);
});

const unCheckedValue = computed(() => {
  const val = typeDef.value.falseValue || false;
  return convertValue(val, typeDef.value.valueType);
});

const options = computed(() => [
  { label: typeDef.value.trueText || '是', value: checkedValue.value },
  { label: typeDef.value.falseText || '否', value: unCheckedValue.value },
]);
</script>

<template>
  <Select
    v-model:value="innerValue"
    :options="options"
    :disabled="isDisabled(prop)"
    class="w-full"
    v-bind="getComponentProps(prop)"
  />
</template>
