<script setup lang="ts">
import { $t } from '@vben/locales';

const props = defineProps<{
  disabled?: boolean;
  value?: string[];
}>();

const emit = defineEmits(['update:value', 'change']);

const ACCESS_OPTIONS = [
  { value: 'READ', label: 'thingModel.property.accessRead' },
  { value: 'WRITE', label: 'thingModel.property.accessWrite' },
  { value: 'REPORT', label: 'thingModel.property.accessReport' },
];

function toggleAccess(type: string) {
  if (props.disabled) return;
  const current = new Set(props.value || []);
  if (current.has(type)) {
    current.delete(type);
  } else {
    current.add(type);
  }
  const newVal = [...current];
  emit('update:value', newVal);
  emit('change', newVal);
}
</script>

<template>
  <div class="flex gap-2">
    <div
      v-for="opt in ACCESS_OPTIONS"
      :key="opt.value"
      class="flex h-8 flex-1 cursor-pointer select-none items-center justify-center rounded border px-3 text-sm transition-colors"
      :class="[
        value?.includes(opt.value)
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-gray-300 bg-white text-gray-700 hover:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200',
        disabled ? 'pointer-events-none opacity-50' : '',
      ]"
      @click="toggleAccess(opt.value)"
    >
      {{ $t(opt.label) }}
    </div>
  </div>
</template>
