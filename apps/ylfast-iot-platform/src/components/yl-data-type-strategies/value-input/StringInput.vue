<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { Input, InputPassword } from 'ant-design-vue';

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
</script>

<template>
  <InputPassword
    v-if="prop.type.type === 'PASSWORD'"
    v-model:value="innerValue"
    :placeholder="`${$t('ylConfigMetadataForm.pleaseEnter')}${prop.name}`"
    :disabled="isDisabled(prop)"
    allow-clear
    v-bind="getComponentProps(prop)"
  />
  <Input
    v-else
    v-model:value="innerValue"
    :placeholder="`${$t('ylConfigMetadataForm.pleaseEnter')}${prop.name}`"
    :disabled="isDisabled(prop)"
    allow-clear
    v-bind="getComponentProps(prop)"
  />
</template>
