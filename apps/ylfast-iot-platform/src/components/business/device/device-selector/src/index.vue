<script setup lang="ts">
import type { BaseSelectorProps } from '#/components/business/common-selector/src/types';

import { ref } from 'vue';

import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

import {
  CommonModal,
  CommonTrigger,
} from '#/components/business/common-selector';
import { useSelectorEcho } from '#/components/business/common-selector/src/hooks/useSelectorEcho';

import DeviceCardItem from './components/DeviceCardItem.vue';
import {
  getDeviceStateInfo,
  getDeviceTypeInfo,
  queryDeviceList,
  queryDeviceListNoPaging,
  useDeviceSelectorConfig,
} from './config';

const props = withDefaults(defineProps<BaseSelectorProps>(), {
  disabled: false,
  displayMode: 'table',
  hideTrigger: false,
  multiple: true,
  placeholder: undefined,
  showPager: true,
  showSearchForm: true,
  value: undefined,
});

const emit = defineEmits(['update:value', 'change', 'select']);

const { searchFormSchemas, tableColumns } = useDeviceSelectorConfig();

const modalRef = ref();

// 使用通用的回显 Hook
const { selectedRows } = useSelectorEcho({
  echoApi: queryDeviceListNoPaging,
  idField: 'id',
  multiple: props.multiple,
  value: props.value,
});

function handleOpen(options: any = {}) {
  if (props.disabled) return;
  modalRef.value?.open({
    defaultSelectedRows: selectedRows.value,
    displayMode: props.displayMode,
    multiple: props.multiple,
    showPager: props.showPager,
    showSearchForm: props.showSearchForm,
    ...options,
  });
}

function handleConfirm(val: any, records: any[]) {
  selectedRows.value = records;
  emit('update:value', val);
  emit('change', val, records);
}

function handleRemove(id: string) {
  if (props.disabled) return;
  const newValue = props.multiple
    ? (props.value as string[]).filter((v) => v !== id)
    : undefined;
  emit('update:value', newValue);
  selectedRows.value = selectedRows.value.filter((r) => r.id !== id);
}

function clearSelection() {
  selectedRows.value = [];
  modalRef.value?.clearSelection();
}

function setSelection(rows: any[]) {
  selectedRows.value = rows;
  modalRef.value?.setSelection(rows);
}

defineExpose({
  clearSelection,
  close: () => modalRef.value?.close(),
  open: handleOpen,
  setMode: (mode: any) => modalRef.value?.setMode(mode),
  setSelection,
});
</script>

<template>
  <div class="w-full">
    <slot :handle-open="handleOpen" name="trigger">
      <CommonTrigger
        v-if="!hideTrigger"
        :disabled="disabled"
        id-field="id"
        :placeholder="placeholder"
        :selected-rows="selectedRows"
        :value="value"
        name-field="deviceName"
        @click="handleOpen"
        @remove="handleRemove"
      />
    </slot>

    <CommonModal
      ref="modalRef"
      :after-fetch="afterFetch"
      :before-fetch="beforeFetch"
      :default-selected-rows="selectedRows"
      :display-mode="displayMode"
      :modal-title="$t('device.instance.selector.title')"
      :multiple="multiple"
      :query-api="queryDeviceList"
      :search-form-schemas="searchFormSchemas"
      :show-pager="showPager"
      :show-search-form="showSearchForm"
      :table-columns="tableColumns"
      id-field="id"
      name-field="deviceName"
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
  </div>
</template>
