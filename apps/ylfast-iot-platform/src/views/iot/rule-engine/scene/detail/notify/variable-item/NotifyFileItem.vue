<script setup lang="ts">
import { ref, watch } from 'vue';

import { Button, Input, message, Upload } from 'ant-design-vue';

import { uploadFile } from '#/api/system/file';

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const valueRef = ref(props.modelValue || '');
const loading = ref(false);

watch(
  () => props.modelValue,
  (value) => {
    valueRef.value = value || '';
  },
  { immediate: true },
);

function handleInput(value: string) {
  valueRef.value = value;
  emit('update:modelValue', value);
}

async function beforeUpload(file: File) {
  const isAllowed = ['image/jpeg', 'image/png'].includes(file.type);
  if (!isAllowed) {
    message.error('仅支持 jpg/png 图片');
    return Upload.LIST_IGNORE;
  }
  if (file.size / 1024 / 1024 >= 4) {
    message.error('图片大小不能超过 4MB');
    return Upload.LIST_IGNORE;
  }
  loading.value = true;
  try {
    const result = await uploadFile(file);
    handleInput(result?.accessUrl || result?.url || '');
  } finally {
    loading.value = false;
  }
  return Upload.LIST_IGNORE;
}
</script>

<template>
  <Input
    class="notify-file-input"
    :value="valueRef"
    allow-clear
    @update:value="handleInput"
  >
    <template #addonAfter>
      <Upload :before-upload="beforeUpload" :show-upload-list="false">
        <Button type="link" size="small" :loading="loading">上传图片</Button>
      </Upload>
    </template>
  </Input>
</template>

<style scoped>
.notify-file-input {
  :deep(.ant-input-wrapper) {
    overflow: hidden;
    border: 1px solid #e8e8e8;
    border-radius: 12px;
    box-shadow: none;
  }

  :deep(.ant-input) {
    border: 0 !important;
    box-shadow: none !important;
  }

  :deep(.ant-input-group-addon) {
    background: #fafafa;
    border: 0;
  }
}
</style>
