<script setup lang="ts">
import { createIconifyIcon, IconifyIcon } from '@vben/icons';

interface Option {
  label: string;
  value: number | string;
  icon?: string;
  color?: string;
}

const props = defineProps<{
  disabled?: boolean;
  options: Option[];
  value?: number | string;
}>();

const emit = defineEmits<{
  change: [number | string];
  'update:value': [number | string];
}>();

function handleSelect(option: Option) {
  if (props.disabled) {
    return;
  }
  if (props.value === option.value) {
    return;
  }
  emit('update:value', option.value);
  emit('change', option.value);
}

const CheckIcon = createIconifyIcon('lucide:check');

const activeClass =
  'border-primary ring-primary/20 bg-primary/[0.03] scale-105 border-1';
const inactiveClass =
  'border-slate-100 hover:border-primary/30 bg-white dark:bg-[#1b1b1b] dark:border-gray-800';

function getIconColorClass(option: Option) {
  const color = option.color || 'blue';
  return `text-${color}-500 dark:text-${color}-400`;
}

function getBgColorClass(option: Option) {
  const color = option.color || 'blue';
  return `bg-${color}-500/10 dark:bg-${color}-500/20`;
}
</script>

<template>
  <div class="flex flex-wrap gap-5 p-2">
    <div
      v-for="option in options"
      :key="option.value"
      class="group relative flex w-24 cursor-pointer flex-col items-center gap-2 rounded-sm border p-3 transition-all duration-300"
      :class="value === option.value ? activeClass : inactiveClass"
      @click="handleSelect(option)"
    >
      <!-- Icon Container -->
      <div
        class="flex h-12 w-12 items-center justify-center rounded-sm transition-all duration-300 group-hover:scale-110"
        :class="[getBgColorClass(option), getIconColorClass(option)]"
      >
        <IconifyIcon :icon="option.icon || 'lucide:box'" class="h-7 w-7" />
      </div>

      <!-- Label -->
      <span
        class="w-full truncate text-center text-[10px] font-bold text-slate-600 transition-colors group-hover:text-primary dark:text-gray-300"
      >
        {{ option.label }}
      </span>

      <!-- Selection Indicator -->
      <div
        v-if="value === option.value"
        class="absolute -right-1.5 -top-1.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-md ring-2 ring-white dark:ring-[#1a1a1a]"
      >
        <CheckIcon class="h-3 w-3" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.flex-wrap {
  display: flex;
  flex-wrap: wrap;
}
</style>
