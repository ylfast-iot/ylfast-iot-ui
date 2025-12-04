<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';

import { $t } from '@vben/locales';

import { Input } from 'ant-design-vue';

defineProps<{
  prop: ConfigPropertyMetadata;
  value: any;
}>();
</script>

<template>
  <Input
    :value="value"
    :placeholder="`${$t('ylConfigMetadataForm.unsupportedType')}: ${prop.type.type}`"
    disabled
  />
</template>
