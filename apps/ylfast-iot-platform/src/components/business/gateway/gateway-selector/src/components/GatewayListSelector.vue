<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { Tag } from 'ant-design-vue';

import { CommonList } from '#/components/business/common-selector';

import {
  getGatewayStateInfo,
  queryGatewayList,
  useGatewaySelectorConfig,
} from '../config';

defineProps<CommonSelectorProps>();

const emit = defineEmits(['register', 'change']);

const { searchFormSchemas, tableColumns } = useGatewaySelectorConfig();

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
    :query-api="queryGatewayList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @change="handleChange"
    @register="handleRegister"
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
  </CommonList>
</template>
