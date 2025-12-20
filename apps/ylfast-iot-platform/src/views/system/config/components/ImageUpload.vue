<script setup lang="ts">
import type { UploadChangeParam } from 'ant-design-vue';

import { ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { message, Upload } from 'ant-design-vue';

import { uploadApi } from '#/api/system/file';

const props = withDefaults(
  defineProps<{
    bucketName?: string;
    defaultValue?: string;
    dir?: string;
    disabled?: boolean;
    height?: string;
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    value: string;
  }>(),
  {
    bucketName: 'public',
    dir: 'system',
    defaultValue: '',
    height: '128px',
    objectFit: 'contain',
  },
);

const emit = defineEmits(['update:value', 'change']);

const LoadingOutlined = createIconifyIcon('ant-design:loading-outlined');
const PlusOutlined = createIconifyIcon('ant-design:plus-outlined');

const imageUrl = ref<string>('');
const loading = ref<boolean>(false);

watch(
  () => [props.value, props.defaultValue],
  ([val, defaultVal]) => {
    imageUrl.value = val || defaultVal || '';
  },
  { immediate: true },
);

const customRequest = async (options: any) => {
  const { file, onSuccess, onError } = options;
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
    emit('change', url);
    onSuccess(res, file);
    message.success('上传成功');
  } catch (error) {
    onError(error);
    message.error('上传失败');
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
    message.error('只能上传图片文件!');
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB!');
  }
  return isJpgOrPng && isLt2M;
};
</script>

<template>
  <Upload
    name="file"
    list-type="picture-card"
    class="avatar-uploader"
    :show-upload-list="false"
    :custom-request="customRequest"
    :before-upload="beforeUpload"
    :disabled="disabled"
    :style="{ height }"
    @change="handleChange"
  >
    <img
      v-if="imageUrl"
      :src="imageUrl"
      alt="avatar"
      class="h-full w-full"
      :style="{ objectFit }"
    />
    <div v-else>
      <LoadingOutlined v-if="loading" />
      <PlusOutlined v-else />
      <div class="ant-upload-text">上传</div>
    </div>
  </Upload>
</template>

<style scoped>
.avatar-uploader > :deep(.ant-upload) {
  width: 100%;
  height: 100%;
  padding: 0 !important;
  overflow: hidden;
}
</style>
