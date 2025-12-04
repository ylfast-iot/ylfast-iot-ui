<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { Select } from 'ant-design-vue';

import { getComponentProps, isDisabled } from '#/utils/config-metadata';

const props = defineProps<{
  prop: ConfigPropertyMetadata;
  value: any;
}>();

const emit = defineEmits(['update:value', 'change']);

const innerValue = computed({
  get: () => props.value || [],
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});
</script>

<template>
  <Select
    v-model:value="innerValue"
    mode="tags"
    :placeholder="`${$t('ylConfigMetadataForm.pleaseEnter')}${prop.name}`"
    :disabled="isDisabled(prop)"
    allow-clear
    class="w-full"
    v-bind="getComponentProps(prop)"
  />
</template>
