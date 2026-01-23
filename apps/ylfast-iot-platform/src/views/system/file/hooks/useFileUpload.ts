import type { FileInfo } from '#/api/system/file';

import { computed, onUnmounted, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { uploadFile, uploadFileSharding } from '#/api/system/file';

const SHARDING_THRESHOLD = 200 * 1024 * 1024; // 200MB

interface UseFileUploadOptions {
  selectedNodeId: { value: string };
  selectedBucketId: { value: string | undefined };
  selectedOptions: { value: string[] };
  uploadExpireTime: { value: number | undefined };
  onSuccess?: () => void;
  onStatusChange?: (uploading: boolean) => void;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const {
    selectedNodeId,
    selectedBucketId,
    selectedOptions,
    uploadExpireTime,
    onSuccess,
    onStatusChange,
  } = options;

  const fileList = ref<any[]>([]);
  const uploading = ref(false);
  const progressMap = ref<Record<string, number>>({});
  const statusMap = ref<Record<string, 'active' | 'exception' | 'success'>>({});
  const responseMap = ref<Record<string, FileInfo>>({});
  const abortController = ref<AbortController | null>(null);

  const canUpload = computed(() => {
    return fileList.value.some((f) => statusMap.value[f.uid] !== 'success');
  });

  watch(uploading, (val) => {
    onStatusChange?.(val);
  });

  onUnmounted(() => {
    handleCancelUpload();
  });

  const handleCancelUpload = () => {
    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
    }
  };

  const handleRemove = (file: any) => {
    const index = fileList.value.indexOf(file);
    if (index !== -1) {
      fileList.value.splice(index, 1);
    }
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete progressMap.value[file.uid];
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete statusMap.value[file.uid];
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete responseMap.value[file.uid];
  };

  const handleClear = () => {
    fileList.value = [];
    progressMap.value = {};
    statusMap.value = {};
    responseMap.value = {};
  };

  const beforeUpload = (file: any) => {
    fileList.value = [...fileList.value, file];
    return false;
  };

  const generateSessionId = () => {
    return (
      Math.random().toString(36).slice(2, 15) +
      Math.random().toString(36).slice(2, 15)
    );
  };

  const processUpload = async () => {
    const pendingFiles = fileList.value.filter(
      (f) => statusMap.value[f.uid] !== 'success',
    );
    if (pendingFiles.length === 0) return;

    uploading.value = true;
    handleCancelUpload();
    abortController.value = new AbortController();

    try {
      for (const file of pendingFiles) {
        if (abortController.value?.signal.aborted) break;

        try {
          statusMap.value[file.uid] = 'active';
          progressMap.value[file.uid] = 0;

          const targetBucketId = selectedBucketId.value;
          const targetNodeId =
            selectedNodeId.value === 'auto' ? '' : selectedNodeId.value;
          const targetOptions = selectedOptions.value.map((opt) => ({
            value: opt,
          })) as any;
          let response: FileInfo;

          if (file.size > SHARDING_THRESHOLD) {
            const dynamicChunkSize = Math.max(
              5 * 1024 * 1024,
              Math.min(20 * 1024 * 1024, Math.floor(file.size / 50)),
            );
            const totalChunks = Math.ceil(file.size / dynamicChunkSize);
            const concurrencyLimit = Math.max(
              2,
              Math.min(6, Math.ceil(totalChunks / 10)),
            );
            const sessionId = generateSessionId();

            const chunkIndices = Array.from(
              { length: totalChunks - 1 },
              (_, i) => i,
            );
            const lastChunkIndex = totalChunks - 1;

            let finalResponse: FileInfo | undefined;
            let completedChunks = 0;
            let fileError: any = null;

            const uploadWorker = async () => {
              while (
                chunkIndices.length > 0 &&
                !fileError &&
                !abortController.value?.signal.aborted
              ) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const i = chunkIndices.shift()!;
                const start = i * dynamicChunkSize;
                const end = Math.min(file.size, start + dynamicChunkSize);
                const chunk = file.slice(start, end);
                const chunkFile = new File([chunk], file.name);

                try {
                  await uploadFileSharding(
                    sessionId,
                    chunkFile,
                    start,
                    file.size,
                    {
                      bucket: targetBucketId,
                      serverNodeId: targetNodeId,
                      options: targetOptions,
                      expires: uploadExpireTime.value
                        ? dayjs(Number(uploadExpireTime.value)).valueOf()
                        : undefined,
                      signal: abortController.value?.signal,
                    },
                  );
                  completedChunks++;
                  progressMap.value[file.uid] = Math.round(
                    (completedChunks / totalChunks) * 100,
                  );
                } catch (error) {
                  fileError = error;
                  throw error;
                }
              }
            };

            if (totalChunks > 1) {
              const workers = Array.from(
                { length: Math.min(concurrencyLimit, totalChunks - 1) },
                () => uploadWorker(),
              );
              await Promise.all(workers);
            }

            if (fileError) throw fileError;
            if (abortController.value?.signal.aborted)
              throw new Error('Upload cancelled');

            const start = lastChunkIndex * dynamicChunkSize;
            const end = Math.min(file.size, start + dynamicChunkSize);
            const chunk = file.slice(start, end);
            const chunkFile = new File([chunk], file.name);

            // eslint-disable-next-line prefer-const
            finalResponse = await uploadFileSharding(
              sessionId,
              chunkFile,
              start,
              file.size,
              {
                bucket: targetBucketId,
                serverNodeId: targetNodeId,
                options: targetOptions,
                expires: uploadExpireTime.value
                  ? dayjs(Number(uploadExpireTime.value)).valueOf()
                  : undefined,
                signal: abortController.value?.signal,
              },
            );

            completedChunks++;
            progressMap.value[file.uid] = 100;
            if (!finalResponse?.id && !finalResponse?.accessUrl)
              throw new Error($t('file.upload.shardError'));
            response = finalResponse;
          } else {
            response = await uploadFile(
              file,
              {
                bucket: targetBucketId,
                serverNodeId: targetNodeId,
                options: targetOptions,
                expires: uploadExpireTime.value
                  ? dayjs(Number(uploadExpireTime.value)).valueOf()
                  : undefined,
                signal: abortController.value?.signal,
              },
              (progressEvent) => {
                progressMap.value[file.uid] = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total,
                );
              },
            );
          }

          statusMap.value[file.uid] = 'success';
          progressMap.value[file.uid] = 100;
          responseMap.value[file.uid] = response;
        } catch (error: any) {
          if (
            error?.name === 'AbortError' ||
            abortController.value?.signal.aborted
          ) {
            statusMap.value[file.uid] = 'exception';
            break;
          }
          statusMap.value[file.uid] = 'exception';
          message.error(
            $t('file.upload.fail', {
              name: file.name,
              reason: error?.message || error || $t('file.upload.unknownError'),
            }),
          );
        }
      }

      const hasSuccess = fileList.value.some(
        (f) => statusMap.value[f.uid] === 'success',
      );
      if (hasSuccess) {
        const allPendingFailed = pendingFiles.every(
          (f) => statusMap.value[f.uid] === 'exception',
        );
        if (!allPendingFailed) {
          message.success($t('file.upload.success'));
          onSuccess?.();
        }
      }
    } finally {
      uploading.value = false;
      abortController.value = null;
    }
  };

  return {
    fileList,
    uploading,
    progressMap,
    statusMap,
    responseMap,
    canUpload,
    processUpload,
    handleCancelUpload,
    handleRemove,
    handleClear,
    beforeUpload,
  };
}
