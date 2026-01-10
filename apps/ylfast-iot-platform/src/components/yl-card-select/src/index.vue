<script setup lang="ts">
import { createIconifyIcon } from '@vben/icons';

interface Option {
  label: string;
  value: number | string;
  icon?: string; // Iconify icon name
  color?: string; // Color theme (e.g., 'blue', 'purple')
  description?: string;
}

const props = defineProps<{
  columns?: number;
  disabled?: boolean;
  options: Option[];
  value?: number | string;
}>();

const emit = defineEmits(['update:value', 'change']);

// Icons
const CheckCircleIcon = createIconifyIcon('lucide:check-circle-2');
const DefaultIcon = createIconifyIcon('lucide:box');

function handleSelect(opt: Option) {
  if (props.disabled) return;
  if (props.value !== opt.value) {
    emit('update:value', opt.value);
    emit('change', opt.value);
  }
}

// Color Styles Map
const colorMap: Record<string, any> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/30',
    activeBorder: 'border-blue-500 dark:border-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-500',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    border: 'border-purple-200 dark:border-purple-500/30',
    activeBorder: 'border-purple-500 dark:border-purple-400',
    text: 'text-purple-600 dark:text-purple-400',
    icon: 'text-purple-500',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-500/10',
    border: 'border-cyan-200 dark:border-cyan-500/30',
    activeBorder: 'border-cyan-500 dark:border-cyan-400',
    text: 'text-cyan-600 dark:text-cyan-400',
    icon: 'text-cyan-500',
  },
  default: {
    bg: 'bg-gray-50 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    activeBorder: 'border-primary',
    text: 'text-gray-700 dark:text-gray-300',
    icon: 'text-gray-500',
  },
};

function getStyle(opt: Option, isActive: boolean) {
  const color = opt.color || 'default';
  const theme = colorMap[color] || colorMap.default;

  if (isActive) {
    return [theme.bg, theme.activeBorder, 'ring-1 ring-primary/20'];
  }
  return [
    'bg-white dark:bg-[#151515]',
    theme.border,
    'hover:border-primary/50',
  ];
}

function getIconStyle(opt: Option) {
  const color = opt.color || 'default';
  const theme = colorMap[color] || colorMap.default;
  return theme.icon;
}
</script>

<template>
  <div class="grid w-full gap-3" :class="`grid-cols-${columns || 3}`">
    <div
      v-for="opt in options"
      :key="opt.value"
      class="group relative flex items-center gap-3 rounded-lg border p-3 transition-all duration-200"
      :class="[
        getStyle(opt, value === opt.value),
        disabled
          ? 'cursor-not-allowed opacity-60 grayscale-[0.5]'
          : 'cursor-pointer select-none',
      ]"
      @click="handleSelect(opt)"
    >
      <!-- Icon Box -->
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-white/5"
      >
        <component
          :is="opt.icon ? createIconifyIcon(opt.icon) : DefaultIcon"
          class="size-6"
          :class="getIconStyle(opt)"
        />
      </div>
      <!-- Text Info -->
      <div class="flex flex-col overflow-hidden">
        <span
          class="truncate text-sm font-medium"
          :class="
            value === opt.value
              ? 'text-primary'
              : 'text-gray-700 dark:text-gray-200'
          "
        >
          {{ opt.label }}
        </span>
        <span v-if="opt.description" class="truncate text-xs text-gray-400">
          {{ opt.description }}
        </span>
      </div>

      <!-- Refined Selection Icon (Floating Circle Check) -->
      <div v-if="value === opt.value" class="absolute right-2 top-2">
        <CheckCircleIcon class="size-4 text-primary" />
      </div>
    </div>
  </div>
</template>
