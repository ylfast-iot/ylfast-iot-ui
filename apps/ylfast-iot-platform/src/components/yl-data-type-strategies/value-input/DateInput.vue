<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';

import { computed } from 'vue';

import { DatePicker } from 'ant-design-vue';

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
  <DatePicker
    v-model:value="innerValue"
    class="w-full"
    value-format="YYYY-MM-DD HH:mm:ss"
    show-time
    :disabled="isDisabled(prop)"
    v-bind="getComponentProps(prop)"
  />
</template>
