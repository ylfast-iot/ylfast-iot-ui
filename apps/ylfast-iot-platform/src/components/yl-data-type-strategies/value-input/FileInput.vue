<script setup lang="ts">
import type { UploadProps } from 'ant-design-vue';

import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { FileTypeDef } from '#/types/data-type';

import { computed, ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Input, Spin, Textarea, Upload } from 'ant-design-vue';

import { getComponentProps, isDisabled } from '#/utils/config-metadata';
import { useFileUpload } from '#/views/system/file/hooks/useFileUpload';

const props = defineProps<{
  prop: ConfigPropertyMetadata;
  value: any;
}>();

const emit = defineEmits(['update:value', 'change', 'update:status']);

const UploadOutlined = createIconifyIcon('ant-design:upload-outlined');

const typeDef = computed(() => props.prop.type as FileTypeDef);
const isBase64 = computed(() => typeDef.value.bodyType === 'base64');

const innerValue = computed({
  get: () => props.value,
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

const {
  beforeUpload: hookBeforeUpload,
  processUpload,
  uploading,
  responseMap,
} = useFileUpload({
  selectedNodeId: ref(''),
  selectedBucketId: ref(undefined),
  selectedOptions: ref([]),
  uploadExpireTime: ref(undefined),
  onSuccess: () => {
    const responses = Object.values(responseMap.value);
    if (responses.length > 0) {
      const lastResponse = responses[responses.length - 1];
      if (lastResponse?.accessUrl) {
        innerValue.value = lastResponse.accessUrl;
      }
    }
  },
  onStatusChange: (status) => {
    emit('update:status', status);
  },
});

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  if (isBase64.value) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.addEventListener('load', () => {
      innerValue.value = reader.result;
    });
    return false;
  }

  hookBeforeUpload(file);
  processUpload();
  return false;
};

const inputProps = computed(() => {
  return {
    ...getComponentProps(props.prop),
    type: undefined,
    accept: undefined,
  };
});
const uploadProps = computed(() => {
  return {
    accept: getComponentProps(props.prop)?.accept || '*',
    type: undefined,
  };
});
</script>

<template>
  <div class="flex items-start gap-2">
    <Spin :spinning="uploading" wrapper-class-name="flex-1">
      <Textarea
        v-if="isBase64"
        v-model:value="innerValue"
        :placeholder="$t('dataType.strategies.file.types.base64')"
        :disabled="isDisabled(prop)"
        class="w-full"
        allow-clear
        :auto-size="{ minRows: 2, maxRows: 6 }"
        v-bind="inputProps"
      />
      <Input
        v-else
        v-model:value="innerValue"
        :placeholder="$t('dataType.strategies.file.types.url')"
        :disabled="isDisabled(prop)"
        class="w-full"
        allow-clear
        v-bind="inputProps"
      />
    </Spin>
    <Upload
      :show-upload-list="false"
      :before-upload="beforeUpload"
      :disabled="isDisabled(prop) || uploading"
      v-bind="uploadProps"
    >
      <Button :disabled="isDisabled(prop) || uploading" :loading="uploading">
        <template #icon><UploadOutlined /></template>
      </Button>
    </Upload>
  </div>
</template>
