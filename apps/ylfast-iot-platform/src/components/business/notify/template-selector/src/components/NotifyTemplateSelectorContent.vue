<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { CommonSelectorContent } from '#/components/business/common-selector';

import {
  queryNotifyTemplateList,
  useNotifyTemplateSelectorConfig,
} from '../config';
import NotifyTemplateCardItem from './NotifyTemplateCardItem.vue';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['change']);

const { searchFormSchemas, tableColumns } = useNotifyTemplateSelectorConfig();

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

defineExpose({ clearSelection, getSelection, setMode, setSelection });
</script>

<template>
  <CommonSelectorContent
    ref="contentRef"
    v-bind="props"
    id-field="id"
    :query-api="queryNotifyTemplateList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @change="handleChange"
  >
    <!-- Card Slot -->
    <template #card-item="{ item, isSelected }">
      <NotifyTemplateCardItem :is-selected="isSelected" :item="item" />
    </template>
  </CommonSelectorContent>
</template>
