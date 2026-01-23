<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { onMounted, ref } from 'vue';

import { getPluginTypes } from '#/api/iot/plugin';
import { CommonCard } from '#/components/business/common-selector';

import { queryPluginList, usePluginSelectorConfig } from '../config';
import PluginCardItem from './PluginCardItem.vue';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['selectionChange']);

const cardRef = ref();

const { searchFormSchemas } = usePluginSelectorConfig();

// Plugin type mapping for display names
const pluginTypeMap = ref<Map<string, string>>(new Map());

onMounted(async () => {
  try {
    const types = await getPluginTypes();
    types.forEach((t) => {
      pluginTypeMap.value.set(t.id || t.value, t.name || t.text);
    });
  } catch (error) {
    console.error('Failed to load plugin types for card selector:', error);
  }
});

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
    :query-api="queryPluginList"
    :search-form-schemas="searchFormSchemas"
    @selection-change="handleSelectionChange"
  >
    <template #card-item="{ item, isSelected }">
      <PluginCardItem
        :is-selected="isSelected"
        :item="item"
        :type-map="pluginTypeMap"
      />
    </template>
  </CommonCard>
</template>
