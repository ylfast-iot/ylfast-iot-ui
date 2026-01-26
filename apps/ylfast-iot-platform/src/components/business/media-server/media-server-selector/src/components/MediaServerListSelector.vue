<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { Tag } from 'ant-design-vue';

import { CommonList } from '#/components/business/common-selector';

import {
  getMediaServerStateInfo,
  getProviderInfo,
  queryMediaServerList,
  useMediaServerSelectorConfig,
} from '../config';

defineProps<CommonSelectorProps>();

const emit = defineEmits(['register', 'change']);

const { searchFormSchemas, tableColumns } = useMediaServerSelectorConfig();

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
    :query-api="queryMediaServerList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @change="handleChange"
    @register="handleRegister"
  >
    <!-- Table Slots -->
    <template #provider="{ row }">
      <Tag :color="getProviderInfo(row.provider).color">
        {{ getProviderInfo(row.provider).label }}
      </Tag>
    </template>
    <template #shareCluster="{ row }">
      <Tag :color="row.shareCluster ? 'blue' : 'orange'">
        {{
          row.shareCluster
            ? $t('mediaServer.config.cluster')
            : $t('mediaServer.config.independent')
        }}
      </Tag>
    </template>
    <template #enabled="{ row }">
      <div class="flex items-center gap-2">
        <span
          class="h-2 w-2 rounded-full"
          :class="[
            getMediaServerStateInfo(row.enabled).statusColor === 'success'
              ? 'bg-emerald-500'
              : 'bg-rose-500',
          ]"
        ></span>
        <span class="text-xs">
          {{ getMediaServerStateInfo(row.enabled).label }}
        </span>
      </div>
    </template>
  </CommonList>
</template>
