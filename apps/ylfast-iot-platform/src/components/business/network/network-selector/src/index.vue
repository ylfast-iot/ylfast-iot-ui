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

import NetworkCardItem from './components/NetworkCardItem.vue';
import {
  getNetworkStateInfo,
  getNetworkTypeInfo,
  queryNetworkList,
  queryNetworkListNoPaging,
  useNetworkSelectorConfig,
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

const { searchFormSchemas, tableColumns } = useNetworkSelectorConfig();

const modalRef = ref();

// 使用通用的回显 Hook
const { selectedRows } = useSelectorEcho({
  echoApi: queryNetworkListNoPaging,
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
    paramsTerms: props.paramsTerms,
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
        name-field="name"
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
      :modal-title="$t('network.selectTitle')"
      :multiple="multiple"
      :params-terms="paramsTerms"
      :query-api="queryNetworkList"
      :search-form-schemas="searchFormSchemas"
      :show-pager="showPager"
      :show-search-form="showSearchForm"
      :table-columns="tableColumns"
      id-field="id"
      name-field="name"
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
  </div>
</template>
