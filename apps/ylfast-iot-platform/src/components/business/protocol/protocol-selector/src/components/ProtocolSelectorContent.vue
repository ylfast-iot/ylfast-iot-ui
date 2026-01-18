<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { Tag } from 'ant-design-vue';

import { CommonSelectorContent } from '#/components/business/common-selector';

import {
  getProtocolTypeInfo,
  queryProtocolList,
  useProtocolSelectorConfig,
} from '../config';
import ProtocolCardItem from './ProtocolCardItem.vue';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['change']);

const { searchFormSchemas, tableColumns } = useProtocolSelectorConfig();

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
    id-field="protocolId"
    :query-api="queryProtocolList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @change="handleChange"
  >
    <!-- Table Slots -->
    <template #protocolType="{ row }">
      <Tag :color="getProtocolTypeInfo(row.protocolType).color">
        {{ getProtocolTypeInfo(row.protocolType).label }}
      </Tag>
    </template>

    <!-- Card Slot -->
    <template #card-item="{ item, isSelected }">
      <ProtocolCardItem :is-selected="isSelected" :item="item" />
    </template>
  </CommonSelectorContent>
</template>
