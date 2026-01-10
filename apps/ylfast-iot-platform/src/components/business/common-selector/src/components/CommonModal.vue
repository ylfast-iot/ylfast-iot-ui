<script setup lang="ts">
import type { CommonSelectorProps } from '../types';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import CommonSelectorContent from './CommonSelectorContent.vue';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['confirm']);

const contentRef = ref();
const internalOptions = ref<Partial<CommonSelectorProps>>({});

const [Modal, modalApi] = useVbenModal({
  title: props.modalTitle || '选择', // Default title
  class: 'w-[1000px]',
  onConfirm: () => {
    const records = contentRef.value?.getSelection() || [];
    const values = records.map((r: any) => r[props.idField || 'id']);
    const multiple = internalOptions.value.multiple ?? props.multiple;
    const finalValue = multiple ? values : values[0];
    emit('confirm', finalValue, records);
    modalApi.close();
  },
});

function open(options?: Partial<CommonSelectorProps>) {
  internalOptions.value = options || {};
  modalApi.open();
}

function setMode(mode: 'card' | 'table') {
  contentRef.value?.setMode(mode);
}

function close() {
  modalApi.close();
}

function clearSelection() {
  if (contentRef.value) {
    contentRef.value.clearSelection();
  }
  // 即使内容未挂载，也同步更新内部选项，确保下次打开是空的
  internalOptions.value.defaultSelectedRows = [];
}

function setSelection(rows: any[]) {
  if (contentRef.value) {
    contentRef.value.setSelection(rows);
  }
  // 同步更新内部选项
  internalOptions.value.defaultSelectedRows = rows;
}

function getSelection() {
  return contentRef.value?.getSelection() || [];
}

defineExpose({
  open,
  close,
  setMode,
  clearSelection,
  setSelection,
  getSelection,
});
</script>

<template>
  <Modal :title="internalOptions.modalTitle || modalTitle">
    <CommonSelectorContent
      ref="contentRef"
      v-bind="{ ...props, ...internalOptions }"
    >
      <!-- Pass through slots -->
      <template v-for="(_, slotName) in $slots" #[slotName]="slotData">
        <slot :name="slotName" v-bind="slotData"></slot>
      </template>
    </CommonSelectorContent>
  </Modal>
</template>
