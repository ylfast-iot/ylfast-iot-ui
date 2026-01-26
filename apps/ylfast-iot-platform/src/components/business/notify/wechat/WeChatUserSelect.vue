<script setup lang="ts">
import {
  getWeChatAllUsers,
  getWeChatDepartmentUsers,
} from '#/api/iot/notify/template';

import BaseCorpUserSelect from '../BaseCorpUserSelect.vue';

defineProps<{
  configId?: string;
  departmentId?: string;
  formModel?: any;
  value?: any;
}>();

const emit = defineEmits(['update:value', 'change']);
</script>

<template>
  <BaseCorpUserSelect
    v-bind="$props"
    :fetch-all-api="getWeChatAllUsers"
    :fetch-by-dept-api="getWeChatDepartmentUsers"
    label-field="name"
    value-field="id"
    @update:value="emit('update:value', $event)"
    @change="emit('change', $event)"
  />
</template>
