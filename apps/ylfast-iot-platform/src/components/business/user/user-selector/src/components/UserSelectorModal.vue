<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { Badge, Tag } from 'ant-design-vue';

import { CommonModal } from '#/components/business/common-selector';

import {
  getUserStateInfo,
  getUserTypeInfo,
  queryUserList,
  useUserSelectorConfig,
} from '../config';
import UserCardItem from './UserCardItem.vue';

defineProps<CommonSelectorProps>();
const emit = defineEmits(['confirm']);

const { searchFormSchemas, tableColumns } = useUserSelectorConfig();

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
    modal-title="选择用户"
    name-field="name"
    :params-terms="paramsTerms"
    :query-api="queryUserList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @confirm="handleConfirm"
  >
    <!-- Table Slots -->
    <template #type="{ row }">
      <Tag :color="getUserTypeInfo(row.typeId).color">
        {{ getUserTypeInfo(row.typeId).label }}
      </Tag>
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
</template>
