<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { NumberTypeDef } from '#/types/data-type';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { InputNumber } from 'ant-design-vue';

import { getComponentProps, isDisabled } from '#/utils/config-metadata';

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

const typeDef = computed(() => props.prop.type as NumberTypeDef);

const isFloat = computed(() =>
  ['DOUBLE', 'FLOAT'].includes(props.prop.type.type),
);
</script>

<template>
  <InputNumber
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
