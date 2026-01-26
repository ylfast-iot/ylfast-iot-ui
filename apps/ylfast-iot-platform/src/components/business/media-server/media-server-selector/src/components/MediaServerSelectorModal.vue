<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

import { CommonModal } from '#/components/business/common-selector';

import {
  getMediaServerStateInfo,
  getProviderInfo,
  queryMediaServerList,
  useMediaServerSelectorConfig,
} from '../config';
import MediaServerCardItem from './MediaServerCardItem.vue';

defineProps<CommonSelectorProps>();
const emit = defineEmits(['confirm']);

const { searchFormSchemas, tableColumns } = useMediaServerSelectorConfig();

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

function clearSelection() {
  modalRef.value?.clearSelection();
}

function setSelection(rows: any[]) {
  modalRef.value?.setSelection(rows);
}

defineExpose({ clearSelection, close, open, setSelection });
</script>

<template>
  <CommonModal
    ref="modalRef"
    id-field="id"
    :modal-title="$t('mediaServer.selectTitle')"
    name-field="name"
    :params-terms="paramsTerms"
    :query-api="queryMediaServerList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @confirm="handleConfirm"
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
  </CommonModal>
</template>
