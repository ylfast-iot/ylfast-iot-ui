<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { CommonCard } from '#/components/business/common-selector';

import { queryProtocolList, useProtocolSelectorConfig } from '../config';
import ProtocolCardItem from './ProtocolCardItem.vue';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['selectionChange']);

const cardRef = ref();

const { searchFormSchemas } = useProtocolSelectorConfig();

function handleSelectionChange(rows: any[]) {
  emit('selectionChange', rows);
}

function getSelection() {
  return cardRef.value?.getSelection();
}

function clearSelection() {
  cardRef.value?.clearSelection();
}

function setSelection(rows: any[]) {
  cardRef.value?.setSelection(rows);
}

defineExpose({ getSelection, clearSelection, setSelection });
</script>

<template>
  <CommonCard
    ref="cardRef"
    v-bind="props"
    id-field="protocolId"
    :query-api="queryProtocolList"
    :search-form-schemas="searchFormSchemas"
    @selection-change="handleSelectionChange"
  >
    <template #card-item="{ item, isSelected }">
      <ProtocolCardItem :is-selected="isSelected" :item="item" />
    </template>
  </CommonCard>
</template>
