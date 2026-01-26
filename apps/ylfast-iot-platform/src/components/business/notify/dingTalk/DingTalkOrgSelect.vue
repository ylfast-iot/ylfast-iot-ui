<script setup lang="ts">
import {
  getDingTalkDepartments,
  getDingTalkDepartmentsTree,
} from '#/api/iot/notify/template';

import BaseCorpOrgSelect from '../BaseCorpOrgSelect.vue';

defineProps<{
  configId?: string;
  formModel?: any;
  isTree?: boolean | string;
  value?: any;
}>();

const emit = defineEmits(['update:value', 'change']);
</script>

<template>
  <BaseCorpOrgSelect
    v-bind="$props"
    :fetch-tree-api="getDingTalkDepartmentsTree"
    :fetch-list-api="getDingTalkDepartments"
    label-field="name"
    value-field="id"
    @update:value="emit('update:value', $event)"
    @change="emit('change', $event)"
  />
</template>
