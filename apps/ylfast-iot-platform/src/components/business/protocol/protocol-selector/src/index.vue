<script setup lang="ts">
import type { BaseSelectorProps } from '#/components/business/common-selector/src/types';

import { ref } from 'vue';

import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

import {
  CommonModal,
  CommonTrigger,
} from '#/components/business/common-selector';
import { useSelectorEcho } from '#/components/business/common-selector/src/hooks/useSelectorEcho';

import ProtocolCardItem from './components/ProtocolCardItem.vue';
import {
  getProtocolTypeInfo,
  queryProtocolList,
  queryProtocolListNoPaging,
  useProtocolSelectorConfig,
} from './config';

const props = withDefaults(defineProps<BaseSelectorProps>(), {
  value: undefined,
  multiple: true,
  disabled: false,
  displayMode: 'table',
  placeholder: undefined,
  hideTrigger: false,
  showPager: true,
  showSearchForm: true,
});

const emit = defineEmits(['update:value', 'change', 'select']);

const { searchFormSchemas, tableColumns } = useProtocolSelectorConfig();

const modalRef = ref();

// 使用通用的回显 Hook
const { selectedRows } = useSelectorEcho({
  value: props.value,
  echoApi: queryProtocolListNoPaging,
  idField: 'protocolId',
  multiple: props.multiple,
});

function handleOpen(options: any = {}) {
  if (props.disabled) return;
  modalRef.value?.open({
    displayMode: props.displayMode,
    multiple: props.multiple,
    paramsTerms: props.paramsTerms,
    defaultSelectedRows: selectedRows.value,
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
  selectedRows.value = selectedRows.value.filter((r) => r.protocolId !== id);
}

function clearSelection() {
  selectedRows.value = [];
  modalRef.value?.clearSelection();
}

function setSelection(rows: any[]) {
  selectedRows.value = rows;
  modalRef.value?.setSelection(rows);
}

defineExpose({
  open: handleOpen,
  close: () => modalRef.value?.close(),
  setMode: (mode: any) => modalRef.value?.setMode(mode),
  clearSelection,
  setSelection,
});
</script>

<template>
  <div class="w-full">
    <slot name="trigger" :handle-open="handleOpen">
      <CommonTrigger
        v-if="!hideTrigger"
        :disabled="disabled"
        id-field="protocolId"
        :placeholder="placeholder"
        :selected-rows="selectedRows"
        :value="value"
        name-field="protocolName"
        @click="handleOpen"
        @remove="handleRemove"
      />
    </slot>

    <CommonModal
      ref="modalRef"
      :default-selected-rows="selectedRows"
      :display-mode="displayMode"
      :modal-title="$t('protocol.selectTitle', '选择协议')"
      :multiple="multiple"
      :params-terms="paramsTerms"
      :query-api="queryProtocolList"
      :search-form-schemas="searchFormSchemas"
      :show-pager="showPager"
      :show-search-form="showSearchForm"
      :table-columns="tableColumns"
      id-field="protocolId"
      name-field="protocolName"
      @confirm="handleConfirm"
    >
      <!-- Table Slots -->
      <template #protocolType="{ row }">
        <Tag :color="getProtocolTypeInfo(row.protocolType).color">
          {{ getProtocolTypeInfo(row.protocolType).label }}
        </Tag>
      </template>

      <!-- Card Slot -->
      <template #card-item="{ item, isSelected }">
        <ProtocolCardItem :is-selected="isSelected" :item="item" />
      </template>
    </CommonModal>
  </div>
</template>
