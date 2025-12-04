<script setup lang="ts">
import { ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { Button, Modal, Tooltip } from 'ant-design-vue';

import MarkdownContent from './MarkdownContent.vue';

type ButtonSizeType = 'large' | 'middle' | 'small'; // As per Ant Design Vue
type ButtonType = 'dashed' | 'default' | 'ghost' | 'link' | 'primary' | 'text';
withDefaults(
  defineProps<{
    buttonSize?: ButtonSizeType; // New prop
    buttonType?: ButtonType; // New prop
    // 显示模式：弹窗 / 平铺
    displayMode?: 'flat' | 'modal';

    // Layout Props
    height?: string; // In Modal, this sets body height. In Flat, this sets container height.
    modalWidth?: number | string;

    // 编辑模式：预览 / 编辑
    mode?: 'edit' | 'preview';
    modelValue?: string;
    // Modal Props
    title?: string;
    triggerText?: string;

    // Trigger Props
    triggerType?: 'button' | 'icon';
  }>(),
  {
    modelValue: '',
    displayMode: 'flat',
    mode: 'preview',
    title: '文档',
    modalWidth: '1000px',
    triggerType: 'icon',
    triggerText: '', // Ensure triggerText has a default for better prop usage
    buttonSize: 'middle', // Default Ant Design size
    buttonType: 'default', // Default Ant Design type
    height: '70vh', // Default height for modal content
  },
);

const emit = defineEmits(['update:modelValue', 'save', 'change']);

// As per Ant Design Vue

const FileMarkdownOutlined = createIconifyIcon(
  'ant-design:file-markdown-outlined',
);

const visible = ref(false);

function handleOpen() {
  visible.value = true;
}

function handleClose() {
  visible.value = false;
}

function handleSave(val: string) {
  emit('update:modelValue', val);
  emit('save', val);
  emit('change', val);
}
</script>

<template>
  <!-- 1. Flat Mode: 直接渲染 -->
  <div v-if="displayMode === 'flat'" class="yl-markdown-flat h-full w-full">
    <MarkdownContent
      :model-value="modelValue"
      :mode="mode"
      :height="height === '70vh' ? '100%' : height"
      @update:model-value="(val) => emit('update:modelValue', val)"
      @save="handleSave"
    />
  </div>

  <!-- 2. Modal Mode: 触发器 + 弹窗 -->
  <div v-else class="yl-markdown-modal-trigger inline-flex items-center">
    <!-- Trigger: Button -->
    <Button
      v-if="triggerType === 'button'"
      @click="handleOpen"
      :size="buttonSize"
      :type="buttonType"
      class="flex items-center justify-center hover:text-primary"
    >
      <template #icon>
        <FileMarkdownOutlined />
      </template>
      {{ triggerText || title }}
    </Button>

    <!-- Trigger: Icon -->
    <Tooltip v-else :title="triggerText || title">
      <FileMarkdownOutlined
        class="cursor-pointer text-lg text-primary hover:text-primary/80"
        @click="handleOpen"
      />
    </Tooltip>

    <!-- Modal -->
    <Modal
      v-model:open="visible"
      :title="title"
      :width="modalWidth"
      :footer="null"
      destroy-on-close
      centered
      :body-style="{ padding: '0px' }"
      @cancel="handleClose"
    >
      <!-- Content Wrapper with Explicit Height -->
      <div :style="{ height, width: '100%' }">
        <MarkdownContent
          :model-value="modelValue"
          :mode="mode"
          height="100%"
          @update:model-value="(val) => emit('update:modelValue', val)"
          @save="handleSave"
        />
      </div>
    </Modal>
  </div>
</template>
