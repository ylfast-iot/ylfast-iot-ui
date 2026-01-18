<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { Tag } from 'ant-design-vue';

import { CommonList } from '#/components/business/common-selector';

import {
  getNetworkStateInfo,
  getNetworkTypeInfo,
  queryNetworkList,
  useNetworkSelectorConfig,
} from '../config';

defineProps<CommonSelectorProps>();

const emit = defineEmits(['register', 'change']);

const { searchFormSchemas, tableColumns } = useNetworkSelectorConfig();

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
    :query-api="queryNetworkList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @change="handleChange"
    @register="handleRegister"
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
  </CommonList>
</template>
