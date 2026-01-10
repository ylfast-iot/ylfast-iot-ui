<script setup lang="ts">
import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { Tag } from 'ant-design-vue';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    idField?: string;
    nameField?: string;
    placeholder?: string;
    selectedRows?: any[];
    value?: number | number[] | string | string[];
  }>(),
  {
    value: undefined,
    disabled: false,
    placeholder: '请选择',
    selectedRows: () => [],
    nameField: 'name',
    idField: 'id',
  },
);

const emit = defineEmits(['click', 'remove']);

const PlusIcon = createIconifyIcon('lucide:plus');

const displayValue = computed(() => {
  if (!props.value) return [];
  const ids = Array.isArray(props.value) ? props.value : [props.value];
  const idKey = props.idField || 'id';
  return ids.map((id) => {
    const row = props.selectedRows.find((r) => r[idKey] === id);
    return {
      id,
      name: row?.[props.nameField] || id,
    };
  });
});

function handleRemove(id: any) {
  if (props.disabled) return;
  emit('remove', id);
}
</script>

<template>
  <div
    class="flex min-h-[32px] w-full flex-wrap gap-1 rounded-md border border-border bg-background px-2 py-1 transition-colors hover:border-primary"
    :class="{ 'cursor-not-allowed opacity-60': disabled }"
    @click="emit('click')"
  >
    <template v-if="displayValue.length > 0">
      <Tag
        v-for="item in displayValue"
        :key="item.id"
        closable
        class="flex items-center"
        @close.stop="handleRemove(item.id)"
      >
        {{ item.name }}
      </Tag>
    </template>
    <span v-else class="text-sm leading-6 text-muted-foreground">
      {{ placeholder }}
    </span>
    <div class="ml-auto flex items-center">
      <PlusIcon v-if="!disabled" class="size-4 text-muted-foreground" />
    </div>
  </div>
</template>
