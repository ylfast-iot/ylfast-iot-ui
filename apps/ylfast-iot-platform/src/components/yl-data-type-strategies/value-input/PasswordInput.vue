<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { StringTypeDef } from '#/types/data-type';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { InputPassword } from 'ant-design-vue';

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

const typeDef = computed(() => props.prop.type as StringTypeDef);
</script>

<template>
  <InputPassword
    v-model:value="innerValue"
    :placeholder="`${$t('ylConfigMetadataForm.pleaseEnter')}${prop.name}`"
    :disabled="isDisabled(prop)"
    :maxlength="typeDef.maxLength"
    allow-clear
    v-bind="getComponentProps(prop) as any"
  />
</template>
