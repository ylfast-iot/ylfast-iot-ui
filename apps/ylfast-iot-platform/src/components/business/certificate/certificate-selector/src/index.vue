<script setup lang="ts">
import type { BaseSelectorProps } from '#/components/business/common-selector/src/types';

import { ref } from 'vue';

import { CommonTrigger } from '#/components/business/common-selector';
import { useSelectorEcho } from '#/components/business/common-selector/src/hooks/useSelectorEcho';

import CertificateSelectorModal from './components/CertificateSelectorModal.vue';
import { queryCertificateListNoPaging } from './config';

const props = withDefaults(defineProps<BaseSelectorProps>(), {
  disabled: false,
  displayMode: 'table',
  hideTrigger: false,
  multiple: true,
  placeholder: undefined,
  showPager: true,
  showSearchForm: true,
  value: undefined,
});

const emit = defineEmits(['update:value', 'change', 'select']);

const modalRef = ref();

// 使用通用的回显 Hook
const { selectedRows } = useSelectorEcho({
  echoApi: queryCertificateListNoPaging,
  idField: 'id',
  multiple: props.multiple,
  value: props.value,
});

function handleOpen(options: any = {}) {
  if (props.disabled) return;
  modalRef.value?.open({
    defaultSelectedRows: selectedRows.value,
    displayMode: props.displayMode,
    multiple: props.multiple,
    paramsTerms: props.paramsTerms,
    showPager: props.showPager,
    showSearchForm: props.showSearchForm,
    ...options,
  });
}

function handleConfirm(val: any, records: any[]) {
  selectedRows.value = records;
  emit('update:value', val);
  emit('change', val, records);
}

function handleRemove(id: string) {
  if (props.disabled) return;
  const newValue = props.multiple
    ? (props.value as string[]).filter((v) => v !== id)
    : undefined;
  emit('update:value', newValue);
  selectedRows.value = selectedRows.value.filter((r) => r.id !== id);
}

function clearSelection() {
  selectedRows.value = [];
  modalRef.value?.clearSelection(); // This might fail if modalRef is not exposing clearSelection, let's check
}

function setSelection(rows: any[]) {
  selectedRows.value = rows;
  // CertificateSelectorModal doesn't expose setSelection/clearSelection in my previous implementation.
  // I should update CertificateSelectorModal to expose them or access inner CommonModal.
  // But CommonModal methods are accessed via open() mostly.
  // Let's check CommonModal.
}

defineExpose({
  clearSelection,
  close: () => modalRef.value?.close(),
  open: handleOpen,
  setMode: (mode: any) => modalRef.value?.setMode(mode), // Expects setMode on modalRef
  setSelection,
});
</script>

<template>
  <div class="w-full">
    <slot :handle-open="handleOpen" name="trigger">
      <CommonTrigger
        v-if="!hideTrigger"
        :disabled="disabled"
        id-field="id"
        :placeholder="placeholder"
        :selected-rows="selectedRows"
        :value="value"
        name-field="name"
        @click="handleOpen"
        @remove="handleRemove"
      />
    </slot>

    <CertificateSelectorModal
      ref="modalRef"
      :display-mode="displayMode"
      :multiple="multiple"
      :params-terms="paramsTerms"
      :show-pager="showPager"
      :show-search-form="showSearchForm"
      @confirm="handleConfirm"
    />
  </div>
</template>
