<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { Tag } from 'ant-design-vue';

import { CommonSelectorContent } from '#/components/business/common-selector';

import {
  getMediaServerStateInfo,
  getProviderInfo,
  queryMediaServerList,
  useMediaServerSelectorConfig,
} from '../config';
import MediaServerCardItem from './MediaServerCardItem.vue';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['change']);

const { searchFormSchemas, tableColumns } = useMediaServerSelectorConfig();

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
    :query-api="queryMediaServerList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @change="handleChange"
  >
    <!-- Table Slots -->
    <template #provider="{ row }">
      <Tag :color="getProviderInfo(row.provider).color">
        {{ getProviderInfo(row.provider).label }}
      </Tag>
    </template>
    <template #shareCluster="{ row }">
      <Tag :color="row.shareCluster ? 'blue' : 'orange'">
        {{
          row.shareCluster
            ? $t('mediaServer.config.cluster')
            : $t('mediaServer.config.independent')
        }}
      </Tag>
    </template>
    <template #enabled="{ row }">
      <div class="flex items-center gap-2">
        <span
          class="h-2 w-2 rounded-full"
          :class="[
            getMediaServerStateInfo(row.enabled).statusColor === 'success'
              ? 'bg-emerald-500'
              : 'bg-rose-500',
          ]"
        ></span>
        <span class="text-xs">
          {{ getMediaServerStateInfo(row.enabled).label }}
        </span>
      </div>
    </template>

    <!-- Card Slot -->
    <template #card-item="{ item, isSelected }">
      <MediaServerCardItem :is-selected="isSelected" :item="item" />
    </template>
  </CommonSelectorContent>
</template>
