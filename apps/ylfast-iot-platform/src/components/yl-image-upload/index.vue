<script setup lang="ts">
import type { UploadChangeParam } from 'ant-design-vue';

import { ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { message, Upload } from 'ant-design-vue';

import { uploadApi } from '#/api/system/file';

const props = withDefaults(
  defineProps<{
    bucketName?: string;
    defaultValue?: string;
    dir?: string;
    disabled?: boolean;
    height?: string;
    modelValue?: string;
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    value?: string;
  }>(),
  {
    bucketName: 'public',
    defaultValue: '',
    dir: 'system',
    height: '128px',
    modelValue: '',
    objectFit: 'contain',
    value: '',
  },
);

const emit = defineEmits(['update:value', 'update:modelValue', 'change']);

const LoadingOutlined = createIconifyIcon('ant-design:loading-outlined');
const PlusOutlined = createIconifyIcon('ant-design:plus-outlined');

const imageUrl = ref<string>('');
const loading = ref<boolean>(false);

watch(
  () => [props.value, props.modelValue, props.defaultValue],
  ([val, modelVal, defaultVal]) => {
    imageUrl.value = val || modelVal || defaultVal || '';
  },
  { immediate: true },
);

const customRequest = async (options: any) => {
  const { file, onError, onSuccess } = options;
  loading.value = true;
  try {
    const res = await uploadApi({
      bucketName: props.bucketName,
      dir: props.dir,
      file,
    });
    // 适配新的 FileUploadRes 类型
    const url = res.url;

    imageUrl.value = url;
    emit('update:value', url);
    emit('update:modelValue', url);
    emit('change', url);
    onSuccess(res, file);
    message.success($t('config.message.uploadSuccess'));
  } catch (error) {
    onError(error);
    message.error($t('config.message.uploadError'));
  } finally {
    loading.value = false;
  }
};

const handleChange = (info: UploadChangeParam) => {
  if (info.file.status === 'uploading') {
    loading.value = true;
    return;
  }
  if (info.file.status === 'done') {
    loading.value = false;
  }
  if (info.file.status === 'error') {
    loading.value = false;
  }
};

const beforeUpload = (file: File) => {
  const isJpgOrPng =
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    file.type === 'image/x-icon' ||
    file.type === 'image/gif' ||
    file.type === 'image/bmp' ||
    file.type === 'image/webp' ||
    file.type === 'image/svg+xml';
  if (!isJpgOrPng) {
    message.error($t('config.hint.uploadImageOnly'));
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error($t('config.hint.imageSizeLimit'));
  }
  return isJpgOrPng && isLt2M;
};
</script>

<template>
  <Upload
    :before-upload="beforeUpload"
    :custom-request="customRequest"
    :disabled="disabled"
    :show-upload-list="false"
    :style="{ height }"
    class="avatar-uploader"
    list-type="picture-card"
    name="file"
    @change="handleChange"
  >
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :style="{ objectFit }"
      alt="avatar"
      class="h-full w-full"
    />
    <div v-else class="flex h-full w-full flex-col items-center justify-center">
      <LoadingOutlined v-if="loading" class="text-lg" />
      <PlusOutlined v-else class="text-lg" />
      <div class="ant-upload-text mt-2">{{ $t('config.action.upload') }}</div>
    </div>
  </Upload>
</template>

<style scoped>
.avatar-uploader > :deep(.ant-upload) {
  width: 100% !important;
  height: 100% !important;
  padding: 0 !important;
  overflow: hidden;
}
</style>
