<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { Tag } from 'ant-design-vue';

import { CommonList } from '#/components/business/common-selector';

import { queryProductList, useProductSelectorConfig } from '../config';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['selectionChange']);

const { searchFormSchemas, tableColumns } = useProductSelectorConfig();

const listRef = ref();

function handleSelectionChange(rows: any[]) {
  emit('selectionChange', rows);
}

function getSelection() {
  return listRef.value?.getSelection();
}

function clearSelection() {
  listRef.value?.clearSelection();
}

function setSelection(rows: any[]) {
  listRef.value?.setSelection(rows);
}

defineExpose({ getSelection, clearSelection, setSelection });
</script>

<template>
  <CommonList
    ref="listRef"
    v-bind="props"
    id-field="id"
    :query-api="queryProductList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @selection-change="handleSelectionChange"
  >
    <template #productType="{ row }">
      <Tag color="blue">
        {{ row.productType }}
      </Tag>
    </template>
  </CommonList>
</template>
