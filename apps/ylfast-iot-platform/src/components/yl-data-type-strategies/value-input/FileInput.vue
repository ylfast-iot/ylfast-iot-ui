<script setup lang="ts">
import type { UploadProps } from 'ant-design-vue';

import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { FileTypeDef } from '#/types/data-type';

import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Input, Textarea, Upload } from 'ant-design-vue';

import { getComponentProps, isDisabled } from '#/utils/config-metadata';

const props = defineProps<{
  prop: ConfigPropertyMetadata;
  value: any;
}>();

const emit = defineEmits(['update:value', 'change']);

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

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  if (isBase64.value) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.addEventListener('load', () => {
      innerValue.value = reader.result;
    });
    return false;
  }
  // For URL mode, we assume external handling or simple return true (which might fail without action)
  // Here we just allow selecting file but don't know how to get URL without backend.
  // So for URL mode, maybe we just rely on the Input field or a mock upload?
  return false;
};
</script>

<template>
  <div class="flex items-start gap-2">
    <Textarea
      v-if="isBase64"
      v-model:value="innerValue"
      :placeholder="$t('dataType.strategies.file.types.base64')"
      :disabled="isDisabled(prop)"
      class="flex-1"
      allow-clear
      :auto-size="{ minRows: 2, maxRows: 6 }"
      v-bind="getComponentProps(prop)"
    />
    <Input
      v-else
      v-model:value="innerValue"
      :placeholder="$t('dataType.strategies.file.types.url')"
      :disabled="isDisabled(prop)"
      class="flex-1"
      allow-clear
      v-bind="getComponentProps(prop)"
    />
    <Upload
      :show-upload-list="false"
      :before-upload="beforeUpload"
      :disabled="isDisabled(prop)"
      accept="*"
    >
      <Button :disabled="isDisabled(prop)">
        <template #icon><UploadOutlined /></template>
      </Button>
    </Upload>
  </div>
</template>
