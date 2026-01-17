<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { Tag } from 'ant-design-vue';

import { CommonSelectorContent } from '#/components/business/common-selector';

import { queryProductList, useProductSelectorConfig } from '../config';
import ProductCardItem from './ProductCardItem.vue';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['change']);

const { searchFormSchemas, tableColumns } = useProductSelectorConfig();

const contentRef = ref();

function handleChange(rows: any[]) {
  emit('change', rows);
}

function getSelection() {
  return contentRef.value?.getSelection();
}

function clearSelection() {
  contentRef.value?.clearSelection();
}

function setSelection(rows: any[]) {
  contentRef.value?.setSelection(rows);
}

function setMode(mode: 'card' | 'table') {
  contentRef.value?.setMode(mode);
}

defineExpose({ getSelection, clearSelection, setSelection, setMode });
</script>

<template>
  <CommonSelectorContent
    ref="contentRef"
    v-bind="props"
    id-field="id"
    :query-api="queryProductList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @change="handleChange"
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
  </CommonSelectorContent>
</template>
