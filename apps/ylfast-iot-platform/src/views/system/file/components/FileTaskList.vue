<script setup lang="ts">
import type { FileInfo } from '#/api/system/file';

import { h } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Modal, Progress, Tooltip } from 'ant-design-vue';

import { formatFileSize } from '../data';

defineProps<{
  fileList: any[];
  progressMap: Record<string, number>;
  responseMap: Record<string, FileInfo>;
  statusMap: Record<string, string>;
  uploading: boolean;
}>();
const emit = defineEmits(['remove']);
const FileIcon = createIconifyIcon('lucide:file');
const EyeIcon = createIconifyIcon('lucide:eye');
const XIcon = createIconifyIcon('lucide:x');
const UploadIcon = createIconifyIcon('lucide:upload');

const handleViewResponse = (file: any, response: FileInfo) => {
  Modal.info({
    title: $t('file.upload.responseTitle', { name: file.name }),
    width: 600,
    maskClosable: true,
    content: h('div', { class: 'mt-4' }, [
      h(
        'pre',
        {
          class:
            'bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-[400px] text-xs leading-relaxed font-mono',
        },
        JSON.stringify(response, null, 2),
      ),
    ]),
  });
};
</script>

<template>
  <div class="h-full overflow-y-auto px-4 py-1 pb-4">
    <div v-if="fileList.length > 0" class="flex flex-col gap-1.5 py-2">
      <div
        v-for="file in fileList"
        :key="file.uid"
        class="group flex items-center gap-2 rounded border border-transparent bg-gray-50/80 p-2 transition-all hover:border-primary/20 dark:bg-gray-800/50"
      >
        <FileIcon class="size-4 flex-shrink-0 text-gray-400" />
        <div class="min-w-0 flex-1">
          <div class="mb-0.5 flex items-center justify-between">
            <span class="truncate text-[11px] font-medium leading-tight">{{
              file.name
            }}</span>
            <span class="text-[10px] text-gray-400">{{
              formatFileSize(file.size)
            }}</span>
          </div>
          <Progress
            :percent="progressMap[file.uid] || 0"
            :status="(statusMap[file.uid] as any) || 'normal'"
            size="small"
            :stroke-width="2"
            stroke-color="var(--primary-color)"
            :show-info="true"
            class="custom-progress !mb-0"
          />
        </div>

        <div class="flex items-center gap-1">
          <Tooltip
            v-if="statusMap[file.uid] === 'success'"
            :title="$t('file.upload.viewResponse')"
          >
            <Button
              type="text"
              size="small"
              class="flex-center h-6 w-6 !p-0.5 text-primary/70 hover:bg-primary/10 hover:text-primary"
              @click="handleViewResponse(file, responseMap[file.uid]!)"
            >
              <EyeIcon class="size-3.5" />
            </Button>
          </Tooltip>

          <Button
            v-if="!uploading"
            type="text"
            size="small"
            danger
            class="flex-center h-6 w-6 !p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
            @click="emit('remove', file)"
          >
            <XIcon class="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
    <div
      v-else
      class="flex h-full flex-col items-center justify-center py-10 text-gray-300"
    >
      <UploadIcon class="mb-2 size-10 opacity-10" />
      <span class="text-xs">{{ $t('file.upload.empty') }}</span>
    </div>
  </div>
</template>

<style scoped>
:deep(.ant-progress-bg) {
  background-color: hsl(var(--primary)) !important;
}

:deep(.custom-progress .ant-progress-text) {
  margin-inline-start: 4px;
  font-size: 9px !important;
  color: #999;
}
</style>
