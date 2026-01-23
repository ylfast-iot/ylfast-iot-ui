<script setup lang="ts">
import type { FileBucketEntity } from '#/api/system/file';
import type { SystemClusterMonitorApi } from '#/api/system/monitor/cluster';

import { computed, onMounted, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Alert,
  Button,
  DatePicker,
  Form,
  Select,
  Upload,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useFileUpload } from '../hooks/useFileUpload';
import FileOptionsSelector from './FileOptionsSelector.vue';
import FileTaskList from './FileTaskList.vue';

const props = withDefaults(defineProps<Props>(), {
  nodes: () => [],
  buckets: () => [],
});
const emit = defineEmits(['success', 'uploadStatusChange']);
const UploadIcon = createIconifyIcon('lucide:upload');
const TrashIcon = createIconifyIcon('lucide:trash-2');

interface Props {
  // eslint-disable-next-line vue/require-default-prop
  bucket?: FileBucketEntity;
  // eslint-disable-next-line vue/require-default-prop
  node?: SystemClusterMonitorApi.ClusterNodeInfo;
  nodes?: SystemClusterMonitorApi.ClusterNodeInfo[];
  buckets?: FileBucketEntity[];
}

const selectedNodeId = ref<string>('auto');
const selectedBucketId = ref<string>();
const selectedOptions = ref<string[]>([]);
const uploadExpireTime = ref<any>();
const showExpireTime = computed(() =>
  selectedOptions.value.includes('tempFile'),
);

// 重置过期时间，当 tempFile 被取消时
watch(showExpireTime, (val) => {
  if (!val) uploadExpireTime.value = undefined;
});

const {
  fileList,
  uploading,
  progressMap,
  statusMap,
  responseMap,
  canUpload,
  processUpload,
  handleRemove,
  handleClear,
  beforeUpload,
} = useFileUpload({
  selectedNodeId,
  selectedBucketId,
  selectedOptions,
  uploadExpireTime,
  onSuccess: () => emit('success'),
  onStatusChange: (status) => emit('uploadStatusChange', status),
});

onMounted(() => {
  selectedNodeId.value = props.node?.serverId || 'auto';
  if (props.bucket) selectedBucketId.value = props.bucket.id;
});

watch(
  () => props.node,
  (val) => {
    selectedNodeId.value = val?.serverId || 'auto';
  },
);
watch(
  () => props.bucket,
  (val) => {
    if (val) selectedBucketId.value = val.id;
  },
);
</script>

<template>
  <div
    class="flex h-[650px] flex-col overflow-hidden bg-white dark:bg-[#1a1a1a]"
  >
    <div class="flex-shrink-0 p-4 pb-2">
      <Alert v-if="!selectedNodeId" type="info" show-icon class="mb-3">
        <template #message>
          <span class="text-xs">{{ $t('file.upload.selectNodeTip') }}</span>
        </template>
      </Alert>

      <Form layout="vertical" class="mb-3">
        <div class="mb-3 grid grid-cols-2 gap-3">
          <Form.Item
            :label="$t('file.serverNode')"
            class="!mb-0"
            :required="true"
          >
            <Select
              v-model:value="selectedNodeId"
              :placeholder="$t('file.upload.selectNode')"
              size="small"
              class="w-full"
              allow-clear
              :options="[
                { label: $t('file.upload.autoNode'), value: 'auto' },
                ...nodes.map((n) => ({
                  label: n.alias || n.host,
                  value: n.serverId,
                })),
              ]"
            />
          </Form.Item>
          <Form.Item :label="$t('file.bucket')" class="!mb-0">
            <Select
              v-model:value="selectedBucketId"
              :placeholder="$t('file.upload.selectBucket')"
              allow-clear
              size="small"
              :options="buckets.map((b) => ({ label: b.name, value: b.id }))"
            />
          </Form.Item>
        </div>
        <Form.Item :label="$t('file.upload.fileOptions')" class="!mb-0">
          <FileOptionsSelector v-model:value="selectedOptions" class="mt-1" />
        </Form.Item>

        <Form.Item
          v-if="showExpireTime"
          :label="$t('file.upload.expires')"
          class="!mb-0 mt-3"
        >
          <DatePicker
            v-model:value="uploadExpireTime"
            :placeholder="$t('file.upload.expiresPlaceholder')"
            size="small"
            class="w-full"
            show-time
            value-format="x"
            :disabled-date="
              (current) => current && current < dayjs().startOf('day')
            "
          />
        </Form.Item>
      </Form>

      <div class="mt-4 px-1">
        <Upload.Dragger
          :file-list="fileList"
          :before-upload="beforeUpload"
          :on-remove="handleRemove"
          :multiple="true"
          :show-upload-list="false"
          class="custom-dragger"
        >
          <div class="py-4">
            <p class="ant-upload-drag-icon mb-1 flex justify-center">
              <UploadIcon class="size-7 text-primary opacity-80" />
            </p>
            <p class="ant-upload-text text-sm font-semibold">
              {{ $t('file.upload.dragTip') }}
            </p>
            <p class="ant-upload-hint mt-1 px-4 text-[11px] text-gray-400">
              {{ $t('file.upload.dragSubTip') }}
            </p>
          </div>
        </Upload.Dragger>
      </div>
    </div>

    <!-- Task List (This should take the remaining space) -->
    <div
      class="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-gray-100 dark:border-gray-800"
    >
      <FileTaskList
        :file-list="fileList"
        :progress-map="progressMap"
        :status-map="statusMap"
        :response-map="responseMap"
        :uploading="uploading"
        @remove="handleRemove"
      />
    </div>

    <div
      class="flex flex-shrink-0 items-center justify-between border-t bg-white p-3 dark:bg-[#1a1a1a]"
    >
      <div class="text-[10px] text-gray-400">
        {{ $t('file.upload.totalFiles', { count: fileList.length }) }}
      </div>
      <div class="flex gap-2">
        <Button
          v-if="fileList.length > 0 && !uploading"
          size="small"
          variant="ghost"
          class="text-xs"
          @click="handleClear"
        >
          <template #icon><TrashIcon class="size-3" /></template>
          {{ $t('file.action.clear') }}
        </Button>
        <Button
          :disabled="!canUpload"
          type="primary"
          size="small"
          :loading="uploading"
          class="px-4 text-xs"
          @click="processUpload"
        >
          {{
            uploading
              ? $t('file.upload.uploading')
              : $t('file.action.startUpload')
          }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-dragger :deep(.ant-upload) {
  padding: 0 !important;
}

.custom-dragger :deep(.ant-upload-drag) {
  height: auto !important; /* Ensure it doesn't try to fill height */
  background: hsl(var(--muted) / 10%) !important;
  border: 1px dashed hsl(var(--primary) / 30%) !important;
  border-radius: 12px !important;
  transition: all 0.2s ease-in-out;
}

.custom-dragger :deep(.ant-upload-drag:hover) {
  background: hsl(var(--primary) / 5%) !important;
  border-color: hsl(var(--primary) / 60%) !important;
}
</style>
