<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

import { CommonModal } from '#/components/business/common-selector';

import {
  getDeviceStateInfo,
  getDeviceTypeInfo,
  queryDeviceList,
  useDeviceSelectorConfig,
} from '../config';
import DeviceCardItem from './DeviceCardItem.vue';

defineProps<CommonSelectorProps>();
const emit = defineEmits(['confirm']);

const { searchFormSchemas, tableColumns } = useDeviceSelectorConfig();

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

defineExpose({ close, open });
</script>

<template>
  <CommonModal
    ref="modalRef"
    id-field="id"
    :modal-title="$t('device.instance.selector.title')"
    name-field="deviceName"
    :params-terms="paramsTerms"
    :query-api="queryDeviceList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @confirm="handleConfirm"
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
  </CommonModal>
</template>
