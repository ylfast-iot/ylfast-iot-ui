<script setup lang="ts">
import { ref } from 'vue';

import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

import { CommonModal } from '#/components/business/common-selector';

import { queryProductList, searchFormSchemas, tableColumns } from '../config';
import ProductCardItem from './ProductCardItem.vue';

const emit = defineEmits(['confirm']);

const modalRef = ref();

function open(options: any = {}) {
  modalRef.value?.open(options);
}

function close() {
  modalRef.value?.close();
}

function handleConfirm(val: any, records: any[]) {
  emit('confirm', val, records);
}

defineExpose({ open, close });
</script>

<template>
  <CommonModal
    ref="modalRef"
    id-field="id"
    :modal-title="$t('device.product.selectorTitle', '选择产品')"
    name-field="productName"
    :query-api="queryProductList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
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
</template>
