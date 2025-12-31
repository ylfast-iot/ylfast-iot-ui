<script setup lang="ts">
import type { DeviceMetadata, DeviceMetadataType } from '#/types/metadata';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { useClipboard } from '@vueuse/core';
import { message, TabPane, Tabs, Tooltip, Upload } from 'ant-design-vue';

import MonacoEditor from '#/components/yl-monaco-editor/index.vue';
import { downloadByData } from '#/utils/file/download';

import EventEditor from './src/EventEditor.vue';
import FunctionEditor from './src/FunctionEditor.vue';
import PropertyEditor from './src/PropertyEditor.vue';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    height?: number | string;
    value: DeviceMetadata;
  }>(),
  {
    height: '100%',
  },
);

const emit = defineEmits(['update:value', 'change']);

const activeTab = ref('property');

const ImportOutlined = createIconifyIcon('ant-design:import-outlined');
const ExportOutlined = createIconifyIcon('ant-design:export-outlined');
const CopyOutlined = createIconifyIcon('ant-design:copy-outlined');
const CodeOutlined = createIconifyIcon('ant-design:code-outlined');
const SaveOutlined = createIconifyIcon('ant-design:save-outlined');

const [PreviewModal, previewModalApi] = useVbenModal({
  title: $t('thingModel.common.preview'),
  footer: false,
  class: 'w-3/5 h-[600px] flex flex-col',
  draggable: true,
});

const { copy } = useClipboard();
const isSourceEditMode = ref(false);
const sourceCodeValue = ref('');

function handleCopy() {
  const text = isSourceEditMode.value
    ? sourceCodeValue.value
    : JSON.stringify(props.value, null, 2);
  copy(text);
  message.success($t('thingModel.common.success'));
}

function openPreview() {
  isSourceEditMode.value = false;
  sourceCodeValue.value = JSON.stringify(props.value, null, 2);
  previewModalApi.open();
}

function handleSaveSourceCode() {
  try {
    const data = JSON.parse(sourceCodeValue.value);
    if (typeof data !== 'object') {
      throw new TypeError($t('thingModel.common.invalidJson'));
    }
    handleUpdate(data);
    message.success($t('thingModel.common.success'));
    // Optional: Switch back to preview or stay in edit
    // isSourceEditMode.value = false;
  } catch {
    message.error($t('thingModel.common.jsonParseError'));
  }
}

function handleExport() {
  const text = isSourceEditMode.value
    ? sourceCodeValue.value
    : JSON.stringify(props.value, null, 2);
  downloadByData(text, 'thing-model.json');
  message.success($t('thingModel.common.success'));
}

async function handleImport(file: File) {
  try {
    const result = await file.text(); // Use file.text()
    const data = JSON.parse(result);
    if (typeof data !== 'object') {
      throw new TypeError($t('thingModel.common.invalidJson'));
    }
    handleUpdate(data);
    sourceCodeValue.value = JSON.stringify(data, null, 2); // Update editor content
    isSourceEditMode.value = true; // Switch to edit mode
    message.success($t('thingModel.common.success'));
  } catch {
    message.error($t('thingModel.common.jsonParseError'));
  }
  return false; // Prevent upload
}

function handleUpdate(val: DeviceMetadata) {
  emit('update:value', val);
}
function handleChange(type: DeviceMetadataType, val: DeviceMetadata) {
  emit('change', type, val);
}
</script>

<template>
  <div
    class="yl-thing-model-editor flex flex-col"
    :style="{
      height: typeof height === 'number' ? `${height}px` : height,
    }"
  >
    <PreviewModal>
      <template #title>
        <span>{{ $t('thingModel.common.sourceCode') }}</span>
      </template>
      <div class="flex h-full flex-col">
        <div class="mb-2 flex items-center justify-between border-b pb-2">
          <div
            class="flex items-center gap-1 rounded bg-gray-100 p-1 dark:bg-gray-800"
          >
            <div
              class="cursor-pointer rounded px-3 py-1 text-xs transition-colors"
              :class="
                !isSourceEditMode
                  ? 'bg-white shadow dark:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              "
              @click="isSourceEditMode = false"
            >
              {{ $t('thingModel.common.preview') }}
            </div>
            <div
              class="cursor-pointer rounded px-3 py-1 text-xs transition-colors"
              :class="
                isSourceEditMode
                  ? 'bg-white shadow dark:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              "
              @click="isSourceEditMode = true"
            >
              {{ $t('thingModel.common.edit') }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Tooltip
              v-if="isSourceEditMode"
              :title="$t('thingModel.common.save')"
            >
              <div
                class="flex size-8 cursor-pointer items-center justify-center rounded-sm border border-primary bg-primary text-white transition-colors hover:bg-primary/90"
                @click="handleSaveSourceCode"
              >
                <SaveOutlined />
              </div>
            </Tooltip>
            <Upload
              :before-upload="handleImport"
              :show-upload-list="false"
              accept=".json"
            >
              <Tooltip :title="$t('thingModel.common.import')">
                <div
                  class="flex size-8 cursor-pointer items-center justify-center rounded-sm border border-primary text-primary transition-colors hover:bg-primary hover:text-white"
                  :class="{ 'pointer-events-none opacity-50': disabled }"
                >
                  <ImportOutlined />
                </div>
              </Tooltip>
            </Upload>
            <Tooltip :title="$t('thingModel.common.export')">
              <div
                class="flex size-8 cursor-pointer items-center justify-center rounded-sm border border-primary text-primary transition-colors hover:bg-primary hover:text-white"
                :class="{ 'pointer-events-none opacity-50': disabled }"
                @click="handleExport"
              >
                <ExportOutlined />
              </div>
            </Tooltip>
            <Tooltip :title="$t('thingModel.common.copy')">
              <div
                class="flex size-8 cursor-pointer items-center justify-center rounded-sm border border-primary text-primary transition-colors hover:bg-primary hover:text-white"
                @click="handleCopy"
              >
                <CopyOutlined />
              </div>
            </Tooltip>
          </div>
        </div>
        <div class="flex-1 overflow-hidden">
          <MonacoEditor
            v-model:model-value="sourceCodeValue"
            language="json"
            :read-only="!isSourceEditMode"
          />
        </div>
      </div>
    </PreviewModal>

    <Tabs v-model:active-key="activeTab" class="flex-1 overflow-hidden">
      <template #rightExtra>
        <div class="px-4">
          <Tooltip :title="$t('thingModel.common.sourceCode')">
            <div
              class="flex size-8 cursor-pointer items-center justify-center rounded-sm border border-primary text-primary transition-colors hover:bg-primary hover:text-white"
              @click="openPreview"
            >
              <CodeOutlined />
            </div>
          </Tooltip>
          <slot name="rightExtra"></slot>
        </div>
      </template>
      <TabPane key="property" :tab="$t('thingModel.tabs.property')">
        <PropertyEditor
          class="h-full"
          :value="value"
          :disabled="disabled"
          @update:value="handleUpdate"
          @change="handleChange"
        />
      </TabPane>
      <TabPane key="function" :tab="$t('thingModel.tabs.function')">
        <FunctionEditor
          class="h-full"
          :value="value"
          :disabled="disabled"
          @update:value="handleUpdate"
          @change="handleChange"
        />
      </TabPane>
      <TabPane key="event" :tab="$t('thingModel.tabs.event')">
        <EventEditor
          class="h-full"
          :value="value"
          :disabled="disabled"
          @update:value="handleUpdate"
          @change="handleChange"
        />
      </TabPane>
    </Tabs>
  </div>
</template>

<style scoped>
.yl-thing-model-editor :deep(.ant-tabs) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.yl-thing-model-editor :deep(.ant-tabs-nav) {
  flex-shrink: 0;
  margin-bottom: 0;
}

.yl-thing-model-editor :deep(.ant-tabs-content-holder) {
  flex: 1;
  height: 0;
  overflow: hidden;
}

.yl-thing-model-editor :deep(.ant-tabs-content) {
  height: 100%;
}
</style>
