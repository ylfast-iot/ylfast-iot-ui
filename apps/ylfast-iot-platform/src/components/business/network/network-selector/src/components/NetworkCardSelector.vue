<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { CommonCard } from '#/components/business/common-selector';

import { queryNetworkList, useNetworkSelectorConfig } from '../config';
import NetworkCardItem from './NetworkCardItem.vue';

defineProps<CommonSelectorProps>();

const emit = defineEmits(['register', 'change']);

const { searchFormSchemas } = useNetworkSelectorConfig();

function handleRegister(instance: any) {
  emit('register', instance);
}

function handleChange(rows: any[]) {
  emit('change', rows);
}
</script>

<template>
  <CommonCard
    v-bind="$props"
    id-field="id"
    name-field="name"
    :query-api="queryNetworkList"
    :search-form-schemas="searchFormSchemas"
    @change="handleChange"
    @register="handleRegister"
  >
    <template #card-item="{ item, isSelected }">
      <NetworkCardItem :is-selected="isSelected" :item="item" />
    </template>
  </CommonCard>
</template>
