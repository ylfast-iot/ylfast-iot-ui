<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

import { CommonModal } from '#/components/business/common-selector';

import {
  getGatewayStateInfo,
  queryGatewayList,
  useGatewaySelectorConfig,
} from '../config';
import GatewayCardItem from './GatewayCardItem.vue';

defineProps<CommonSelectorProps>();
const emit = defineEmits(['confirm']);

const { searchFormSchemas, tableColumns } = useGatewaySelectorConfig();

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
    :modal-title="$t('gateway.selectTitle') || '选择网关'"
    name-field="name"
    :params-terms="paramsTerms"
    :query-api="queryGatewayList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @confirm="handleConfirm"
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
  </CommonModal>
</template>
