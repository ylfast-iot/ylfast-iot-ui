<script setup lang="ts">
import type { BaseSelectorProps } from '#/components/business/common-selector/src/types';

import { ref } from 'vue';

import { Badge, Tag } from 'ant-design-vue';

import {
  CommonModal,
  CommonTrigger,
} from '#/components/business/common-selector';
import { useSelectorEcho } from '#/components/business/common-selector/src/hooks/useSelectorEcho';

import UserCardItem from './components/UserCardItem.vue';
import {
  getUserStateInfo,
  queryUserList,
  queryUserListNoPaging,
  useUserSelectorConfig,
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

const { searchFormSchemas, tableColumns } = useUserSelectorConfig();

const modalRef = ref();

// 使用通用的回显 Hook
const { selectedRows } = useSelectorEcho({
  echoApi: queryUserListNoPaging,
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
      modal-title="选择用户"
      :multiple="multiple"
      :query-api="queryUserList"
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
        <Tag color="cyan">{{ row.type?.text || row.type }}</Tag>
      </template>
      <template #status="{ row }">
        <Badge
          :status="
            getUserStateInfo(row.status).statusColor === 'success'
              ? 'success'
              : 'error'
          "
          :text="getUserStateInfo(row.status).label"
        />
      </template>

      <!-- Card Slot -->
      <template #card-item="{ item, isSelected }">
        <UserCardItem :is-selected="isSelected" :item="item" />
      </template>
    </CommonModal>
  </div>
</template>
