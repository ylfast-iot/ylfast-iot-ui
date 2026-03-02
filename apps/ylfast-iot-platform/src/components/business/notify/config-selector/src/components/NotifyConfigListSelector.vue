<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { CommonList } from '#/components/business/common-selector';

import {
  queryNotifyConfigList,
  useNotifyConfigSelectorConfig,
} from '../config';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['selectionChange']);

const listRef = ref();

const { searchFormSchemas, tableColumns } = useNotifyConfigSelectorConfig();

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

defineExpose({ clearSelection, getSelection, setSelection });
</script>

<template>
  <CommonList
    ref="listRef"
    v-bind="props"
    id-field="id"
    :query-api="queryNotifyConfigList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @selection-change="handleSelectionChange"
  />
</template>
