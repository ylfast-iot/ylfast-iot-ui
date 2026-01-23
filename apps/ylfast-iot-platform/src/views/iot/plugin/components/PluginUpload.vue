<script setup lang="ts">
import type { IotPluginApi } from '#/api/iot/plugin';

import { computed, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { message, Progress, Upload } from 'ant-design-vue';

import { uploadPlugin } from '#/api/iot/plugin';

const props = defineProps<{
  value?: IotPluginApi.PluginDriverUploadInfo;
}>();

const emit = defineEmits<{
  success: [info: IotPluginApi.PluginDriverUploadInfo];
  'update:value': [value: IotPluginApi.PluginDriverUploadInfo | undefined];
}>();

const UploadIcon = createIconifyIcon('lucide:upload-cloud');
const CheckIcon = createIconifyIcon('lucide:check-circle');
const FileIcon = createIconifyIcon('lucide:file-archive');
const TrashIcon = createIconifyIcon('lucide:trash-2');

const uploading = ref(false);
const uploadProgress = ref(0);
const uploadedInfo = ref<IotPluginApi.PluginDriverUploadInfo | undefined>(
  props.value,
);
watch(
  () => props.value,
  (val) => {
    uploadedInfo.value = val;
  },
  { immediate: true },
);

const hasFile = computed(() => !!uploadedInfo.value);

const handleUpload = async (file: File) => {
  if (!file.name.endsWith('.jar')) {
    message.error($t('plugin.upload.onlyJar'));
    return false;
  }

  uploading.value = true;
  uploadProgress.value = 0;

  // Simulate progress for UX
  const progressInterval = setInterval(() => {
    if (uploadProgress.value < 90) {
      uploadProgress.value += Math.random() * 15;
    }
  }, 200);

  try {
    const result = await uploadPlugin(file);
    clearInterval(progressInterval);
    uploadProgress.value = 100;

    uploadedInfo.value = result;
    emit('update:value', result);
    emit('success', result);
    message.success($t('plugin.upload.success'));
  } catch (error) {
    clearInterval(progressInterval);
    uploadProgress.value = 0;
    message.error($t('plugin.upload.failed'));
    console.error('Upload failed:', error);
  } finally {
    setTimeout(() => {
      uploading.value = false;
    }, 500);
  }

  return false;
};

const handleRemove = () => {
  uploadedInfo.value = undefined;
  uploadProgress.value = 0;
  emit('update:value', undefined);
};
</script>

<template>
  <div class="plugin-upload-container">
    <!-- Upload Area -->
    <div v-if="!hasFile && !uploading" class="upload-area">
      <Upload.Dragger
        :before-upload="handleUpload"
        :show-upload-list="false"
        accept=".jar"
        class="plugin-dragger"
      >
        <div class="upload-content">
          <div class="upload-icon-wrapper">
            <UploadIcon class="upload-icon" />
          </div>
          <p class="upload-title">{{ $t('plugin.upload.dragTitle') }}</p>
          <p class="upload-subtitle">{{ $t('plugin.upload.supportFormat') }}</p>
        </div>
      </Upload.Dragger>
    </div>

    <!-- Uploading State -->
    <div v-else-if="uploading" class="uploading-state">
      <div class="progress-wrapper">
        <div class="progress-icon">
          <FileIcon class="file-icon animate-pulse" />
        </div>
        <div class="progress-info">
          <span class="progress-text">
            {{ $t('file.upload.uploading') }}...
          </span>
          <Progress
            :percent="Math.round(uploadProgress)"
            :show-info="false"
            size="small"
            status="active"
            stroke-color="hsl(var(--primary))"
          />
        </div>
      </div>
    </div>

    <!-- Uploaded State -->
    <div v-else class="uploaded-state">
      <div class="file-info-card">
        <div class="file-header">
          <div class="success-icon">
            <CheckIcon class="check-icon" />
          </div>
          <div class="file-details">
            <span class="file-name" :title="uploadedInfo?.filename">
              {{ uploadedInfo?.filename }}
            </span>
            <span class="file-meta"> v{{ uploadedInfo?.version }} </span>
          </div>
          <button
            class="remove-btn"
            type="button"
            :title="$t('common.delete')"
            @click="handleRemove"
          >
            <TrashIcon class="remove-icon" />
          </button>
        </div>

        <div class="plugin-preview">
          <div class="preview-row">
            <span class="preview-label">{{ $t('plugin.id') }}:</span>
            <span class="preview-value">{{ uploadedInfo?.id || '-' }}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">{{ $t('plugin.name') }}:</span>
            <span class="preview-value">{{ uploadedInfo?.name || '-' }}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">{{ $t('plugin.type') }}:</span>
            <span class="preview-value type-tag">
              {{ uploadedInfo?.type?.name || uploadedInfo?.type?.text || '-' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plugin-upload-container {
  width: 100%;
}

.upload-area {
  width: 100%;
}

.plugin-dragger :deep(.ant-upload-drag) {
  background: linear-gradient(
    135deg,
    hsl(var(--primary) / 3%) 0%,
    hsl(var(--muted) / 20%) 100%
  ) !important;
  border: 2px dashed hsl(var(--primary) / 25%) !important;
  border-radius: 16px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.plugin-dragger :deep(.ant-upload-drag:hover) {
  background: linear-gradient(
    135deg,
    hsl(var(--primary) / 8%) 0%,
    hsl(var(--primary) / 3%) 100%
  ) !important;
  border-color: hsl(var(--primary) / 50%) !important;
  box-shadow: 0 8px 24px -8px hsl(var(--primary) / 20%);
  transform: translateY(-2px);
}

.upload-content {
  padding: 32px 24px;
  text-align: center;
}

.upload-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  background: linear-gradient(
    135deg,
    hsl(var(--primary) / 15%) 0%,
    hsl(var(--primary) / 5%) 100%
  );
  border-radius: 16px;
}

.upload-icon {
  width: 32px;
  height: 32px;
  color: hsl(var(--primary));
}

.upload-title {
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.upload-subtitle {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.uploading-state {
  padding: 24px;
  background: hsl(var(--muted) / 30%);
  border: 1px solid hsl(var(--border));
  border-radius: 16px;
}

.progress-wrapper {
  display: flex;
  gap: 16px;
  align-items: center;
}

.progress-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: hsl(var(--primary) / 10%);
  border-radius: 12px;
}

.file-icon {
  width: 24px;
  height: 24px;
  color: hsl(var(--primary));
}

.progress-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.progress-text {
  font-size: 13px;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.uploaded-state {
  width: 100%;
}

.file-info-card {
  padding: 16px;
  background: linear-gradient(
    135deg,
    hsl(142deg 76% 36% / 6%) 0%,
    hsl(var(--muted) / 20%) 100%
  );
  border: 1px solid hsl(142deg 76% 36% / 20%);
  border-radius: 16px;
}

.file-header {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid hsl(var(--border) / 50%);
}

.success-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: hsl(142deg 76% 36% / 15%);
  border-radius: 10px;
}

.check-icon {
  width: 22px;
  height: 22px;
  color: hsl(142deg 76% 36%);
}

.file-details {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.file-meta {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.meta-separator {
  margin: 0 6px;
  opacity: 0.5;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 8px;
  transition: all 0.2s;
}

.remove-btn:hover {
  color: hsl(0deg 84% 60%);
  background: hsl(0deg 84% 60% / 10%);
}

.remove-icon {
  width: 16px;
  height: 16px;
}

.plugin-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-row {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}

.preview-label {
  flex-shrink: 0;
  width: 60px;
  color: hsl(var(--muted-foreground));
}

.preview-value {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.type-tag {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 10%);
  border-radius: 4px;
}
</style>
