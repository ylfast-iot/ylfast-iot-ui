<script setup lang="ts">
import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

interface Props {
  item: any;
  isSelected: boolean;
  typeMap?: Map<string, string>;
}

const props = defineProps<Props>();

const CheckIcon = createIconifyIcon('lucide:check-circle-2');
const PlugIcon = createIconifyIcon('lucide:plug');
const ServerIcon = createIconifyIcon('lucide:server');
const CpuIcon = createIconifyIcon('lucide:cpu');
const PlayIcon = createIconifyIcon('lucide:play-circle');
const BellIcon = createIconifyIcon('lucide:bell');
const DatabaseIcon = createIconifyIcon('lucide:database');

// Type Icon based on plugin type
const TypeIcon = computed(() => {
  switch (props.item.type) {
    case 'data-collector': {
      return DatabaseIcon;
    }
    case 'device-gateway': {
      return ServerIcon;
    }
    case 'media': {
      return PlayIcon;
    }
    case 'notify': {
      return BellIcon;
    }
    case 'rule-engine': {
      return CpuIcon;
    }
    default: {
      return PlugIcon;
    }
  }
});

const typeLabel = computed(() => {
  if (!props.item.type) return '-';
  return props.typeMap?.get(props.item.type) || props.item.type;
});
</script>

<template>
  <div
    class="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 p-4 transition-all duration-300 ease-in-out"
    :class="[
      isSelected
        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/20'
        : 'border-border bg-card hover:border-primary/50 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none',
    ]"
  >
    <!-- Selection Checkmark -->
    <transition name="scale">
      <div
        v-if="isSelected"
        class="absolute right-2 top-2 z-20 flex size-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/20 dark:bg-[#1c1e23]"
      >
        <CheckIcon class="size-full text-primary" />
      </div>
    </transition>

    <!-- Header Section -->
    <div class="flex items-center gap-4">
      <div
        class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20"
      >
        <component :is="TypeIcon" class="size-6" />
      </div>

      <div class="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <span
          class="truncate text-base font-bold tracking-tight text-foreground transition-colors duration-300"
          :title="item.name"
        >
          {{ item.name }}
        </span>
        <span
          class="text-[10px] font-medium uppercase text-muted-foreground opacity-70"
        >
          ID: {{ item.id }}
        </span>
      </div>
    </div>

    <!-- Details/Status Section -->
    <div class="mt-4 flex flex-col gap-2.5 border-t border-border pt-3">
      <div class="flex items-center justify-between">
        <span
          class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60"
        >
          {{ $t('plugin.type') }}
        </span>
        <div
          class="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary ring-1 ring-inset ring-primary/10"
        >
          {{ typeLabel }}
        </div>
      </div>

      <p
        class="line-clamp-2 text-xs leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground/80"
        :title="item.description"
      >
        {{ item.description || $t('common.noDescription') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

.border-primary {
  box-shadow: 0 0 15px -3px hsl(var(--primary), 0.2);
}
</style>
