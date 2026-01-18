<script setup lang="ts">
import { ref } from 'vue';

import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

import { CommonModal } from '#/components/business/common-selector';

import {
  getProtocolTypeInfo,
  queryProtocolList,
  useProtocolSelectorConfig,
} from '../config';
import ProtocolCardItem from './ProtocolCardItem.vue';

const emit = defineEmits(['confirm']);

const { searchFormSchemas, tableColumns } = useProtocolSelectorConfig();

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

defineExpose({ open, close });
</script>

<template>
  <CommonModal
    ref="modalRef"
    id-field="protocolId"
    :modal-title="$t('protocol.selectTitle', '选择协议')"
    name-field="protocolName"
    :query-api="queryProtocolList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @confirm="handleConfirm"
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
  </CommonModal>
</template>
