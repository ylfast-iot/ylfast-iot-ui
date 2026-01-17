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

import ProductCardItem from './components/ProductCardItem.vue';
import {
  queryProductList,
  queryProductListNoPaging,
  useProductSelectorConfig,
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

const { searchFormSchemas, tableColumns } = useProductSelectorConfig();

const modalRef = ref();

// 使用通用的回显 Hook
const { selectedRows } = useSelectorEcho({
  value: props.value,
  echoApi: queryProductListNoPaging,
  idField: 'id',
  multiple: props.multiple,
});

function handleOpen(options: any = {}) {
  if (props.disabled) return;
  modalRef.value?.open({
    displayMode: props.displayMode,
    multiple: props.multiple,
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
  selectedRows.value = selectedRows.value.filter((r) => r.id !== id);
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
        id-field="id"
        :placeholder="placeholder"
        :selected-rows="selectedRows"
        :value="value"
        name-field="productName"
        @click="handleOpen"
        @remove="handleRemove"
      />
    </slot>

    <CommonModal
      ref="modalRef"
      :after-fetch="afterFetch"
      :before-fetch="beforeFetch"
      :default-selected-rows="selectedRows"
      :display-mode="displayMode"
      :modal-title="$t('device.product.selectorTitle', '选择产品')"
      :multiple="multiple"
      :query-api="queryProductList"
      :search-form-schemas="searchFormSchemas"
      :show-pager="showPager"
      :show-search-form="showSearchForm"
      :table-columns="tableColumns"
      id-field="id"
      name-field="productName"
      @confirm="handleConfirm"
    >
      <!-- Table Slots -->
      <template #productType="{ row }">
        <Tag color="blue">
          {{ row.productType }}
        </Tag>
      </template>

      <!-- Card Slot -->
      <template #card-item="{ item, isSelected }">
        <ProductCardItem :is-selected="isSelected" :item="item" />
      </template>
    </CommonModal>
  </div>
</template>
