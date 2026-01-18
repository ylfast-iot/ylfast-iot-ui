<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { Badge, Tag } from 'ant-design-vue';

import { CommonSelectorContent } from '#/components/business/common-selector';

import {
  getUserStateInfo,
  getUserTypeInfo,
  queryUserList,
  useUserSelectorConfig,
} from '../config';
import UserCardItem from './UserCardItem.vue';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['change']);

const { searchFormSchemas, tableColumns } = useUserSelectorConfig();

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
    v-bind="props"
    id-field="id"
    name-field="name"
    :query-api="queryUserList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @change="handleChange"
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
  </CommonSelectorContent>
</template>
