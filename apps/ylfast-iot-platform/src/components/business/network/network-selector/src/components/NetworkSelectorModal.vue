<script setup lang="ts">
import { ref } from 'vue';

import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

import { CommonModal } from '#/components/business/common-selector';

import {
  getNetworkStateInfo,
  getNetworkTypeInfo,
  queryNetworkList,
  useNetworkSelectorConfig,
} from '../config';
import NetworkCardItem from './NetworkCardItem.vue';

const emit = defineEmits(['confirm']);

const { searchFormSchemas, tableColumns } = useNetworkSelectorConfig();

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
    :modal-title="$t('network.selectTitle')"
    name-field="name"
    :query-api="queryNetworkList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @confirm="handleConfirm"
  >
    <!-- Table Slots -->
    <template #type="{ row }">
      <Tag :color="getNetworkTypeInfo(row.type).color">
        {{ getNetworkTypeInfo(row.type).label }}
      </Tag>
    </template>
    <template #address="{ row }">
      <span
        v-if="row.addressInfo && row.addressInfo.length > 0"
        class="font-mono text-xs"
      >
        {{ row.addressInfo[0]?.address }}
      </span>
      <span v-else class="text-xs italic text-muted-foreground/40">-</span>
    </template>
    <template #state="{ row }">
      <div class="flex items-center gap-2">
        <span
          class="h-2 w-2 rounded-full"
          :class="[
            getNetworkStateInfo(row.state).statusColor === 'success'
              ? 'bg-emerald-500'
              : 'bg-rose-500',
          ]"
        ></span>
        <span class="text-xs">
          {{ getNetworkStateInfo(row.state).label }}
        </span>
      </div>
    </template>

    <!-- Card Slot -->
    <template #card-item="{ item, isSelected }">
      <NetworkCardItem :is-selected="isSelected" :item="item" />
    </template>
  </CommonModal>
</template>
