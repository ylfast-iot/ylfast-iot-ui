<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { Tag } from 'ant-design-vue';

import { CommonSelectorContent } from '#/components/business/common-selector';

import {
  getGatewayStateInfo,
  queryGatewayList,
  useGatewaySelectorConfig,
} from '../config';
import GatewayCardItem from './GatewayCardItem.vue';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['change']);

const { searchFormSchemas, tableColumns } = useGatewaySelectorConfig();

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
    :query-api="queryGatewayList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @change="handleChange"
  >
    <!-- Table Slots -->
    <template #provider="{ row }">
      <Tag color="cyan">
        {{ row.provider }}
      </Tag>
    </template>
    <template #state="{ row }">
      <div class="flex items-center gap-2">
        <span
          class="h-2 w-2 rounded-full"
          :class="[
            getGatewayStateInfo(row.state).statusColor === 'success'
              ? 'bg-emerald-500'
              : 'bg-rose-500',
          ]"
        ></span>
        <span class="text-xs">
          {{ getGatewayStateInfo(row.state).label }}
        </span>
      </div>
    </template>

    <!-- Card Slot -->
    <template #card-item="{ item, isSelected }">
      <GatewayCardItem :is-selected="isSelected" :item="item" />
    </template>
  </CommonSelectorContent>
</template>
