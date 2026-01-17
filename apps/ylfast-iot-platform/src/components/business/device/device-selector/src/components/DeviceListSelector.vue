<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { Tag } from 'ant-design-vue';

import { CommonList } from '#/components/business/common-selector';

import {
  getDeviceStateInfo,
  getDeviceTypeInfo,
  queryDeviceList,
  useDeviceSelectorConfig,
} from '../config';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['selectionChange']);

const { searchFormSchemas, tableColumns } = useDeviceSelectorConfig();

const listRef = ref();

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

defineExpose({ clearSelection, getSelection, setSelection });
</script>

<template>
  <CommonList
    ref="listRef"
    v-bind="props"
    id-field="id"
    :query-api="queryDeviceList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @selection-change="handleSelectionChange"
  >
    <template #deviceType="{ row }">
      <Tag :color="getDeviceTypeInfo(row.deviceType).color">
        {{ getDeviceTypeInfo(row.deviceType).label }}
      </Tag>
    </template>
    <template #deviceState="{ row }">
      <div class="flex items-center gap-2">
        <span
          class="h-2 w-2 rounded-full"
          :class="getDeviceStateInfo(row.deviceState).dotClass"
        ></span>
        <span class="text-xs">
          {{ getDeviceStateInfo(row.deviceState).label }}
        </span>
      </div>
    </template>
  </CommonList>
</template>
