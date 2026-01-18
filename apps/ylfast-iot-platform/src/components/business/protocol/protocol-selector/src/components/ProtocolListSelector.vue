<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { Tag } from 'ant-design-vue';

import { CommonList } from '#/components/business/common-selector';

import {
  getProtocolTypeInfo,
  queryProtocolList,
  useProtocolSelectorConfig,
} from '../config';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['selectionChange']);

const listRef = ref();

const { searchFormSchemas, tableColumns } = useProtocolSelectorConfig();

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
    id-field="protocolId"
    :query-api="queryProtocolList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @selection-change="handleSelectionChange"
  >
    <template #protocolType="{ row }">
      <Tag :color="getProtocolTypeInfo(row.protocolType).color">
        {{ getProtocolTypeInfo(row.protocolType).label }}
      </Tag>
    </template>
  </CommonList>
</template>
