<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';

import { computed, ref } from 'vue';

import { YlConfigMetadataForm } from '#/components/yl-config-metadata-form';

const props = defineProps<{
  prop: ConfigPropertyMetadata;
  value: any;
}>();

const emit = defineEmits(['update:value', 'change']);

const nestedFormRef = ref();

const innerValue = computed({
  get: () => props.value,
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

function handleNestedChange(val: any) {
  innerValue.value = val;
  emit('change', val);
}

// Expose methods
defineExpose({
  validate: async () => {
    if (
      nestedFormRef.value &&
      typeof nestedFormRef.value.validate === 'function'
    ) {
      return nestedFormRef.value.validate();
    }
  },
  resetFields: async () => {
    if (
      nestedFormRef.value &&
      typeof nestedFormRef.value.resetFields === 'function'
    ) {
      return nestedFormRef.value.resetFields();
    }
  },
});
</script>

<template>
  <div
    class="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
  >
    <YlConfigMetadataForm
      ref="nestedFormRef"
      :is-nested="true"
      :metadata="
        prop.type.expands?.configMetadata || { name: '', properties: [] }
      "
      :model="innerValue || {}"
      @change="handleNestedChange"
    />
  </div>
</template>
