<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { onMounted, ref } from 'vue';

import { Tag } from 'ant-design-vue';

import { getPluginTypes } from '#/api/iot/plugin';
import { CommonList } from '#/components/business/common-selector';

import { queryPluginList, usePluginSelectorConfig } from '../config';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['selectionChange']);

const listRef = ref();

const { searchFormSchemas, tableColumns } = usePluginSelectorConfig();

// Plugin type mapping for display names
const pluginTypeMap = ref<Map<string, string>>(new Map());

onMounted(async () => {
  try {
    const types = await getPluginTypes();
    types.forEach((t) => {
      pluginTypeMap.value.set(t.id || t.value, t.name || t.text);
    });
  } catch (error) {
    console.error('Failed to load plugin types for list selector:', error);
  }
});

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
    id-field="id"
    :query-api="queryPluginList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @selection-change="handleSelectionChange"
  >
    <template #type="{ row }">
      <Tag
        class="rounded-md border-0 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
      >
        {{ pluginTypeMap.get(row.type) || row.type }}
      </Tag>
    </template>
  </CommonList>
</template>
