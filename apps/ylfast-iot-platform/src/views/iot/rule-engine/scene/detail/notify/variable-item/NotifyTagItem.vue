<script setup lang="ts">
import { ref, watch } from 'vue';

import { Select } from 'ant-design-vue';

import { getWeChatTags } from '#/api/iot/notify/template';

const props = defineProps<{
  modelValue: Record<string, any>;
  notifierId: string;
}>();

const emit = defineEmits<{
  change: [value: { displayName?: string }];
  'update:modelValue': [value: Record<string, any>];
}>();

const options = ref<any[]>([]);

watch(
  () => props.notifierId,
  async (value) => {
    if (!value) {
      options.value = [];
      return;
    }
    const result = await getWeChatTags(value);
    options.value = (result || []).map((item: any) => ({
      label: item.name || item.id,
      value: item.id,
    }));
  },
  { immediate: true },
);

function handleChange(value: string, option: any) {
  emit('update:modelValue', {
    source: 'fixed',
    value,
  });
  emit('change', { displayName: option?.label || '' });
}
</script>

<template>
  <Select
    :value="modelValue?.value"
    class="notify-simple-select"
    :options="options"
    allow-clear
    placeholder="请选择标签"
    @change="handleChange"
  />
</template>

<style scoped>
.notify-simple-select {
  width: 100%;

  :deep(.ant-select-selector) {
    min-height: 42px;
    border-color: #e8e8e8 !important;
    border-radius: 12px !important;
    box-shadow: none !important;
  }

  :deep(.ant-select-selection-placeholder) {
    color: #bfbfbf;
  }
}
</style>
