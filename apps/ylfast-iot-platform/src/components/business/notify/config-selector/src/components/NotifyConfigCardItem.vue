<script setup lang="ts">
import type { IotNotifyConfigApi } from '#/api/iot/notify/config';

import { computed } from 'vue';

import { createIconifyIcon, IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { NOTIFY_PROVIDER_ENUMS, NOTIFY_TYPE_ENUMS } from '#/enums/notify';

const props = defineProps<{
  isSelected?: boolean;
  item: IotNotifyConfigApi.NotifyConfig;
}>();

const CheckIcon = createIconifyIcon('lucide:check-circle-2');

// 根据通知类型计算展示配置（图标、颜色等）
const typeConfig = computed(
  () =>
    (NOTIFY_TYPE_ENUMS as any)[props.item.type] || {
      icon: 'lucide:bell',
      color: 'blue',
      label: props.item.type,
    },
);

// 根据提供商计算展示配置
const providerConfig = computed(
  () =>
    (NOTIFY_PROVIDER_ENUMS as any)[props.item.provider] || {
      icon: typeConfig.value.icon,
      label: props.item.provider,
      color: typeConfig.value.color,
    },
);

// 计算图标容器样式
const iconStyle = computed(() => {
  const color = providerConfig.value.color || 'blue';
  return `bg-${color}-500/10 text-${color}-500 dark:bg-${color}-500/20`;
});

// 计算卡片徽标及整体配色样式
const statusBadge = computed(() => {
  const color = providerConfig.value.color || 'blue';
  const gradientStops =
    'via-white via-[15%] to-white dark:via-[#151515] dark:via-[15%] dark:to-[#151515]';

  let cardBg = '';
  switch (color) {
    case 'amber':
    case 'orange': {
      cardBg = `from-orange-500/10 ${gradientStops} dark:from-orange-500/10`;
      break;
    }
    case 'blue': {
      cardBg = `from-blue-500/10 ${gradientStops} dark:from-blue-500/10`;
      break;
    }
    case 'cyan':
    case 'sky': {
      cardBg = `from-cyan-500/10 ${gradientStops} dark:from-cyan-500/10`;
      break;
    }
    case 'emerald':
    case 'green': {
      cardBg = `from-green-500/10 ${gradientStops} dark:from-green-500/10`;
      break;
    }
    case 'gray':
    case 'slate': {
      cardBg = `from-slate-500/10 ${gradientStops} dark:from-slate-500/10`;
      break;
    }
    case 'indigo':
    case 'purple': {
      cardBg = `from-purple-500/10 ${gradientStops} dark:from-purple-500/10`;
      break;
    }
    case 'red':
    case 'rose': {
      cardBg = `from-rose-500/10 ${gradientStops} dark:from-rose-500/10`;
      break;
    }
    default: {
      cardBg = `from-primary/10 ${gradientStops} dark:from-primary/10`;
    }
  }

  return {
    bg: `bg-${color}-500/10 dark:bg-${color}-500/20 backdrop-blur-md`,
    text: `text-${color}-700 dark:text-${color}-400`,
    border: `border-${color}-200/50 dark:border-${color}-500/30`,
    dot: `bg-${color}-500`,
    fold: `border-${color}-800/20 dark:border-${color}-500/40`,
    cardBg,
  };
});
</script>

<template>
  <div
    class="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border bg-white bg-gradient-to-br shadow-sm transition-all duration-300 hover:shadow-lg dark:bg-[#151515]"
    :class="[
      isSelected
        ? 'border-primary ring-1 ring-primary/20'
        : 'border-slate-200 hover:border-primary/50 dark:border-gray-800',
      statusBadge.cardBg,
    ]"
  >
    <!-- Selection Checkmark -->
    <transition name="scale">
      <div
        v-if="isSelected"
        class="absolute left-2 top-2 z-30 flex size-5 items-center justify-center rounded-full bg-primary shadow-sm"
      >
        <CheckIcon class="size-3.5 text-white" />
      </div>
    </transition>

    <!-- Ribbon Status (Type) -->
    <div class="absolute -right-0 top-3 z-20">
      <div
        class="relative flex items-center gap-1.5 rounded-l-md border-y border-l px-2.5 py-0.5 text-[10px] font-bold shadow-sm"
        :class="[statusBadge.bg, statusBadge.text, statusBadge.border]"
      >
        <span class="relative flex h-1.5 w-1.5">
          <span
            class="relative inline-flex h-1.5 w-1.5 rounded-full"
            :class="statusBadge.dot"
          ></span>
        </span>
        {{ typeConfig.label }}
      </div>
    </div>

    <!-- Header Row -->
    <div class="flex items-center gap-3 px-4 pb-2 pt-4">
      <!-- Icon -->
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-colors"
        :class="iconStyle"
      >
        <IconifyIcon :icon="providerConfig.icon" class="h-6 w-6" />
      </div>

      <!-- Identity -->
      <div class="flex min-w-0 flex-col gap-0.5">
        <h3
          class="truncate pr-8 text-sm font-bold text-slate-900 dark:text-gray-100"
          :title="item.name"
        >
          {{ item.name }}
        </h3>
        <p class="truncate font-mono text-[9px] text-slate-400 opacity-70">
          ID: {{ item.id }}
        </p>
      </div>
    </div>

    <!-- Body Content -->
    <div class="group/body relative flex flex-1 flex-col gap-3 px-4 pb-3">
      <!-- Info Grid -->
      <div class="flex items-center justify-between gap-2 text-[10px]">
        <div class="flex flex-1 flex-col gap-0.5">
          <span class="text-slate-400">{{
            $t('notify.config.fields.type')
          }}</span>
          <span class="truncate">{{ typeConfig.label }}</span>
        </div>
        <div class="h-6 w-px shrink-0 bg-slate-100 dark:bg-gray-800"></div>
        <div class="flex flex-1 flex-col gap-0.5 pl-2">
          <span class="text-slate-400">{{
            $t('notify.config.fields.provider')
          }}</span>
          <span
            class="truncate font-mono font-medium text-slate-600 dark:text-gray-300"
            :title="providerConfig.label"
          >
            {{ providerConfig.label }}
          </span>
        </div>
      </div>

      <!-- Description Box -->
      <div class="flex-1 rounded-md bg-slate-50 p-2 dark:bg-slate-800/50">
        <p
          class="line-clamp-2 text-[10px] leading-relaxed text-slate-500 dark:text-gray-400"
          :title="item.description"
        >
          {{ item.description || $t('common.noDescription') }}
        </p>
      </div>
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
</style>
