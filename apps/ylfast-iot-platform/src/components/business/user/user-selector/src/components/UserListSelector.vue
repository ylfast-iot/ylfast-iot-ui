<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { Badge, Tag } from 'ant-design-vue';

import { CommonList } from '#/components/business/common-selector';

import {
  getUserStateInfo,
  getUserTypeInfo,
  queryUserList,
  useUserSelectorConfig,
} from '../config';

defineProps<CommonSelectorProps>();

const emit = defineEmits(['register', 'change']);

const { searchFormSchemas, tableColumns } = useUserSelectorConfig();

function handleRegister(instance: any) {
  emit('register', instance);
}

function handleChange(rows: any[]) {
  emit('change', rows);
}
</script>

<template>
  <CommonList
    v-bind="$props"
    id-field="id"
    name-field="name"
    :query-api="queryUserList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @change="handleChange"
    @register="handleRegister"
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
  </CommonList>
</template>
