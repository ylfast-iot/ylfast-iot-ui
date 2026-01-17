<script setup lang="ts">
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, message, Upload } from 'ant-design-vue';

import { uploadProtocol } from '#/api/iot/protocol';

const emit = defineEmits(['success']);

const UploadIcon = createIconifyIcon('lucide:upload');

const fileList = ref<any[]>([]);
const uploading = ref(false);

const [Modal, modalApi] = useVbenModal({
  title: $t('common.action.upload'),
  onConfirm: handleUpload,
  class: 'w-[500px]',
});

function handleRemove(file: any) {
  const index = fileList.value.indexOf(file);
  const newFileList = [...fileList.value];
  newFileList.splice(index, 1);
  fileList.value = newFileList;
}

function beforeUpload(file: any) {
  fileList.value = [file]; // Limit to 1 file
  return false; // Prevent auto upload
}

async function handleUpload() {
  if (fileList.value.length === 0) {
    message.warning($t('common.validate.required'));
    return;
  }

  const file = fileList.value[0];
  uploading.value = true;
  modalApi.setState({ confirmLoading: true });

  try {
    const res = await uploadProtocol(file);
    // res contains fileUploadRes and protocols.
    const names = res.protocols.map((p) => p.name).join(', ');
    message.success(`${$t('common.uploadSuccess')}: ${names}`);
    emit('success');
    fileList.value = [];
    modalApi.close();
  } catch (error) {
    console.error(error);
  } finally {
    uploading.value = false;
    modalApi.setState({ confirmLoading: false });
  }
}
</script>

<template>
  <Modal>
    <div class="p-4">
      <Upload
        :before-upload="beforeUpload"
        :file-list="fileList"
        @remove="handleRemove"
      >
        <Button>
          <template #icon>
            <UploadIcon class="size-4" />
          </template>
          {{ $t('common.selectFile') }}
        </Button>
      </Upload>
      <div class="mt-4 text-sm text-slate-500">
        {{ $t('protocol.supportedFormatsJar') }}
      </div>
    </div>
  </Modal>
</template>
