<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { CommonCard } from '#/components/business/common-selector';

import { queryProductList, useProductSelectorConfig } from '../config';
import ProductCardItem from './ProductCardItem.vue';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['selectionChange']);

const { searchFormSchemas } = useProductSelectorConfig();

const cardRef = ref();

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
    id-field="id"
    :query-api="queryProductList"
    :search-form-schemas="searchFormSchemas"
    @selection-change="handleSelectionChange"
  >
    <template #card-item="{ item, isSelected }">
      <ProductCardItem :is-selected="isSelected" :item="item" />
    </template>
  </CommonCard>
</template>
