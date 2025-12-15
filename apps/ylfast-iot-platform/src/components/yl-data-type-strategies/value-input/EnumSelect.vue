<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { EnumTypeDef } from '#/types/data-type';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { Select } from 'ant-design-vue';

import {
  getComponentProps,
  getEnumOptions,
  isDisabled,
} from '#/utils/config-metadata';

const props = defineProps<{
  prop: ConfigPropertyMetadata;
  value: any;
}>();

const emit = defineEmits(['update:value', 'change']);

const isMulti = computed(() => {
  const typeDef = props.prop.type as EnumTypeDef;
  return typeDef.type === 'ENUM' && typeDef.multi === true;
});

const innerValue = computed({
  get: () => {
    if (isMulti.value) {
      if (Array.isArray(props.value)) {
        return props.value;
      }
      // Check for null or undefined explicitly to allow 'false' (boolean) or 0 (number) to be wrapped
      return props.value !== undefined && props.value !== null
        ? [props.value]
        : [];
    }
    // Single mode
    if (Array.isArray(props.value)) {
      return props.value.length > 0 ? props.value[0] : undefined;
    }
    return props.value;
  },
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});
</script>

<template>
  <Select
    v-model:value="innerValue"
    :mode="isMulti ? 'multiple' : undefined"
    :options="getEnumOptions(prop)"
    :placeholder="`${$t('ylConfigMetadataForm.pleaseSelect')}${prop.name}`"
    allow-clear
    :disabled="isDisabled(prop)"
    style="width: 100%"
    v-bind="getComponentProps(prop)"
  />
</template>
