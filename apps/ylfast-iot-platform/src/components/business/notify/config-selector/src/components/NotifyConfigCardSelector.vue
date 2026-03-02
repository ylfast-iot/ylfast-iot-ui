<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { CommonCard } from '#/components/business/common-selector';

import {
  queryNotifyConfigList,
  useNotifyConfigSelectorConfig,
} from '../config';
import NotifyConfigCardItem from './NotifyConfigCardItem.vue';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['selectionChange']);

const cardRef = ref();

const { searchFormSchemas } = useNotifyConfigSelectorConfig();

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

defineExpose({ clearSelection, getSelection, setSelection });
</script>

<template>
  <CommonCard
    ref="cardRef"
    v-bind="props"
    id-field="id"
    :query-api="queryNotifyConfigList"
    :search-form-schemas="searchFormSchemas"
    @selection-change="handleSelectionChange"
  >
    <template #card-item="{ item, isSelected }">
      <NotifyConfigCardItem :is-selected="isSelected" :item="item" />
    </template>
  </CommonCard>
</template>
