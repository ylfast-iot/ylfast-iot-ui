<script setup lang="ts">
import type { IotNotifyTemplateApi } from '#/api/iot/notify/template';

import { computed } from 'vue';

import { createIconifyIcon, IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Popconfirm, Tooltip } from 'ant-design-vue';

import { NOTIFY_PROVIDER_ENUMS, NOTIFY_TYPE_ENUMS } from '#/enums/notify';

const props = defineProps<{
  row: IotNotifyTemplateApi.NotifyTemplate;
}>();

const emit = defineEmits<{
  click: [row: IotNotifyTemplateApi.NotifyTemplate];
  debug: [row: IotNotifyTemplateApi.NotifyTemplate];
  delete: [row: IotNotifyTemplateApi.NotifyTemplate];
  edit: [row: IotNotifyTemplateApi.NotifyTemplate];
  history: [row: IotNotifyTemplateApi.NotifyTemplate];
}>();

// 图标定义
const EditIcon = createIconifyIcon('lucide:edit-3');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const DebugIcon = createIconifyIcon('lucide:bug');
const HistoryIcon = createIconifyIcon('lucide:history');

// 根据通知类型计算展示配置（图标、颜色等）
const typeConfig = computed(
  () =>
    (NOTIFY_TYPE_ENUMS as any)[props.row.type] || {
      icon: 'lucide:bell',
      color: 'blue',
      label: props.row.type,
    },
);

// 根据提供商计算展示配置
const providerConfig = computed(
  () =>
    (NOTIFY_PROVIDER_ENUMS as any)[props.row.provider] || {
      icon: typeConfig.value.icon,
      label: props.row.provider,
      color: typeConfig.value.color,
    },
);

// 计算图标容器样式
const iconStyle = computed(() => {
  const color = providerConfig.value.color || 'blue';
  return `bg-${color}-500/10 text-${color}-500 dark:bg-${color}-500/20`;
});

// 计算卡片徽标及整体配色样式（用于 Tailwind 动态类名匹配）
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
    class="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-slate-200 bg-white bg-gradient-to-br shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg dark:border-gray-800 dark:bg-[#151515]"
    :class="statusBadge.cardBg"
    @click="emit('click', row)"
  >
    <!-- Ribbon Type -->
    <div class="absolute -right-1 top-3 z-20">
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

        <div
          class="absolute -bottom-[4px] right-0 h-0 w-0 border-l-[4px] border-t-[4px] border-l-transparent"
          :class="statusBadge.fold"
        ></div>
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
          :title="row.name"
        >
          {{ row.name }}
        </h3>
        <p class="truncate font-mono text-[9px] text-slate-400 opacity-70">
          ID: {{ row.id }}
        </p>
      </div>
    </div>

    <!-- Body Content -->
    <div class="group/body relative flex flex-1 flex-col gap-3 px-4 pb-3">
      <!-- Info Grid -->
      <div class="flex items-center justify-between gap-2 text-[10px]">
        <div class="flex flex-1 flex-col gap-0.5">
          <span class="text-slate-400">{{
            $t('notify.template.fields.type')
          }}</span>
          <span class="truncate">{{ typeConfig.label }}</span>
        </div>
        <div class="h-6 w-px shrink-0 bg-slate-100 dark:bg-gray-800"></div>
        <div class="flex flex-1 flex-col gap-0.5 pl-2">
          <span class="text-slate-400">{{
            $t('notify.template.fields.provider')
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
          :title="row.description"
        >
          {{ row.description || $t('common.noDescription') }}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="mt-auto flex h-9 cursor-default items-center divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/30 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/30"
      @click.stop
    >
      <Tooltip :title="$t('common.action.edit')">
        <div
          class="group/btn flex flex-1 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:bg-white hover:text-primary dark:hover:bg-gray-800"
          @click.stop="emit('edit', row)"
        >
          <EditIcon
            class="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110"
          />
        </div>
      </Tooltip>

      <Tooltip :title="$t('common.action.debug')">
        <div
          class="group/btn flex flex-1 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:bg-white hover:text-blue-500 dark:hover:bg-gray-800"
          @click.stop="emit('debug', row)"
        >
          <DebugIcon
            class="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110"
          />
        </div>
      </Tooltip>

      <Tooltip :title="$t('notify.debug.history')">
        <div
          class="group/btn flex flex-1 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:bg-white hover:text-orange-500 dark:hover:bg-gray-800"
          @click.stop="emit('history', row)"
        >
          <HistoryIcon
            class="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110"
          />
        </div>
      </Tooltip>

      <Tooltip :title="$t('common.action.delete')">
        <Popconfirm
          :title="$t('common.action.confirmDelete')"
          @click.stop
          @confirm.stop="emit('delete', row)"
        >
          <div
            class="group/btn flex flex-1 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:bg-white hover:text-rose-600 dark:hover:bg-gray-800"
          >
            <TrashIcon
              class="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110"
            />
          </div>
        </Popconfirm>
      </Tooltip>
    </div>
  </div>
</template>
