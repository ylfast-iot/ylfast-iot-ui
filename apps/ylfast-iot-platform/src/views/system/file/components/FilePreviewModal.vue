<script setup lang="ts">
import type { FileEntity } from '#/api/system/file';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Image } from 'ant-design-vue';

import { downloadFile, getFileUrl } from '#/api/system/file';
import { getFileTypeInfo } from '#/enums/file';

const DownloadIcon = createIconifyIcon('lucide:download');

const currentFile = ref<FileEntity | null>(null);
const previewUrl = ref('');

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    modalApi.close();
  },
});

function open(file: FileEntity) {
  currentFile.value = file;
  previewUrl.value = getFileUrl(file.id, file.extension, {
    accessKey: file.others?.accessKey as string,
  });

  modalApi.setState({
    title: $t('file.preview.title', { name: file.name }),
  });
  modalApi.open();
}

const handleDownload = () => {
  if (currentFile.value) {
    downloadFile(
      currentFile.value.id,
      currentFile.value.extension,
      currentFile.value.name,
      currentFile.value.others?.accessKey as string,
    );
  }
};

defineExpose({ open });
</script>

<template>
  <Modal
    :footer="false"
    class="file-preview-modal w-[1000px]"
    :destroy-on-close="true"
  >
    <div class="flex flex-col overflow-hidden bg-background">
      <!-- Preview Area -->
      <div
        class="relative z-10 flex w-full items-center justify-center overflow-hidden p-4"
        style="height: 400px"
      >
        <!-- Image Preview -->
        <div
          v-if="
            currentFile &&
            getFileTypeInfo(currentFile.extension).value === 'IMAGE'
          "
          class="preview-container relative flex h-full w-full items-center justify-center overflow-auto"
        >
          <Image
            :src="previewUrl"
            class="block max-w-full"
            :alt="currentFile.name"
            :preview="true"
          />
        </div>

        <!-- Video Preview -->
        <div
          v-else-if="
            currentFile &&
            getFileTypeInfo(currentFile.extension).value === 'VIDEO'
          "
          class="flex aspect-video w-full max-w-4xl items-center justify-center overflow-hidden rounded-2xl bg-black"
        >
          <video
            :src="previewUrl"
            controls
            autoplay
            class="h-full w-full outline-none"
          ></video>
        </div>

        <!-- Not Supported -->
        <div
          v-else
          class="max-w-md rounded-2xl border border-dashed border-border/40 bg-muted/10 p-12 text-center backdrop-blur-sm"
        >
          <div class="mb-6 text-6xl opacity-10 drop-shadow-sm grayscale">
            📁
          </div>
          <p class="text-[15px] font-medium text-muted-foreground">
            {{ $t('file.preview.notSupported') }}
          </p>
        </div>
      </div>

      <!-- Action Area -->
      <div class="flex w-full flex-col items-center justify-center py-6">
        <div
          class="flex items-center gap-4 rounded-2xl border border-border/10 bg-muted/30 px-4 py-2 backdrop-blur-sm"
        >
          <div
            class="flex items-center gap-2 font-mono text-xs font-medium text-muted-foreground/80"
          >
            <span class="max-w-[200px] truncate uppercase">{{
              currentFile?.name
            }}</span>
            <span v-if="currentFile" class="text-primary/40">•</span>
            <span v-if="currentFile" class="uppercase">{{
              currentFile.extension
            }}</span>
          </div>

          <div class="h-3 w-[1px] bg-border/40"></div>

          <Button
            type="text"
            size="small"
            @click="handleDownload"
            class="flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-primary transition-all hover:bg-primary/5 active:scale-95"
          >
            <DownloadIcon class="size-3.5" />
            <span class="text-[11px] font-bold tracking-wider">{{
              $t('file.action.download')
            }}</span>
          </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.file-preview-modal :deep(.ant-modal-content) {
  padding: 0;
  overflow: hidden;
  background: hsl(var(--card));
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 50%);
}

.file-preview-modal :deep(.ant-modal-header) {
  padding: 20px 24px;
  background: hsl(var(--card));
  border-bottom: 1px solid hsl(var(--border) / 10%);
}

.file-preview-modal :deep(.ant-modal-close) {
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  line-height: 32px;
  background: hsl(var(--muted) / 50%);
  border-radius: 50%;
  transition: all 0.3s;
}

.file-preview-modal :deep(.ant-modal-close:hover) {
  color: hsl(var(--destructive));
  background: hsl(var(--destructive) / 10%);
}

.preview-container {
  scrollbar-width: thin;
}

.preview-container::-webkit-scrollbar {
  width: 6px;
}

.preview-container::-webkit-scrollbar-thumb {
  background: hsl(var(--muted));
  border-radius: 10px;
}
</style>
