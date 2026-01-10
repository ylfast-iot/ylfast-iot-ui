<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { Tag } from 'ant-design-vue';

import { CommonSelectorContent } from '#/components/business/common-selector';

import {
  getDeviceStateInfo,
  getDeviceTypeInfo,
  queryDeviceList,
  searchFormSchemas,
  tableColumns,
} from '../config';
import DeviceCardItem from './DeviceCardItem.vue';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['change']);

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
    :query-api="queryDeviceList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @change="handleChange"
  >
    <!-- Table Slots -->
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

    <!-- Card Slot -->
    <template #card-item="{ item, isSelected }">
      <DeviceCardItem :is-selected="isSelected" :item="item" />
    </template>
  </CommonSelectorContent>
</template>
