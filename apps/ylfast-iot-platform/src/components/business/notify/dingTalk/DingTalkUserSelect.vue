<script setup lang="ts">
import {
  getDingTalkAllUsers,
  getDingTalkDepartmentUsers,
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
    :fetch-all-api="getDingTalkAllUsers"
    :fetch-by-dept-api="getDingTalkDepartmentUsers"
    label-field="name"
    value-field="id"
    @update:value="emit('update:value', $event)"
    @change="emit('change', $event)"
  />
</template>
