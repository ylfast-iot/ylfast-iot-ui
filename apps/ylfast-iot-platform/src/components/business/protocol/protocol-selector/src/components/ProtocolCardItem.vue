<script setup lang="ts">
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { getProtocolTypeInfo } from '../config';

interface Props {
  item: any;
  isSelected: boolean;
}

const props = defineProps<Props>();

const typeInfo = getProtocolTypeInfo(props.item.protocolType);
const TypeIcon = createIconifyIcon(typeInfo.icon);
const CheckIcon = createIconifyIcon('lucide:check-circle-2');
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
        <TypeIcon class="size-6" />
      </div>

      <div class="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <span
          class="truncate text-base font-bold tracking-tight text-foreground transition-colors duration-300"
          :title="item.protocolName"
        >
          {{ item.protocolName }}
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
          {{ $t('protocol.type') }}
        </span>
        <div
          class="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset"
          :class="[
            typeInfo.color === 'blue'
              ? 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-500/10 dark:text-blue-400'
              : typeInfo.color === 'green'
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-700/10 dark:bg-emerald-500/10 dark:text-emerald-400'
                : typeInfo.color === 'orange'
                  ? 'bg-orange-50 text-orange-700 ring-orange-700/10 dark:bg-orange-500/10 dark:text-orange-400'
                  : 'bg-gray-50 text-gray-700 ring-gray-700/10 dark:bg-gray-500/10 dark:text-gray-400',
          ]"
        >
          {{ typeInfo.label }}
        </div>
      </div>

      <p
        class="line-clamp-2 text-xs leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground/80"
      >
        {{ item.protocolDescription || '这个协议暂时没有详细的场景描述...' }}
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

/* Custom shadow and glow effects */
.border-primary {
  box-shadow: 0 0 15px -3px hsl(var(--primary), 0.2);
}
</style>
