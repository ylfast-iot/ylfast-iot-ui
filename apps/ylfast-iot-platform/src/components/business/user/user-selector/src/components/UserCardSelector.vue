<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { CommonCard } from '#/components/business/common-selector';

import { queryUserList, useUserSelectorConfig } from '../config';
import UserCardItem from './UserCardItem.vue';

defineProps<CommonSelectorProps>();

const emit = defineEmits(['register', 'change']);

const { searchFormSchemas } = useUserSelectorConfig();

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
    :query-api="queryUserList"
    :search-form-schemas="searchFormSchemas"
    @change="handleChange"
    @register="handleRegister"
  >
    <template #card-item="{ item, isSelected }">
      <UserCardItem :is-selected="isSelected" :item="item" />
    </template>
  </CommonCard>
</template>
