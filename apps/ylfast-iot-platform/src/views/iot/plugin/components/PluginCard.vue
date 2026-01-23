<script setup lang="ts">
import type { IotPluginApi } from '#/api/iot/plugin';

import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { formatDate } from '@vueuse/core';
import { Popconfirm, Tooltip } from 'ant-design-vue';

const props = defineProps<{
  row: IotPluginApi.PluginDriver;
  typeMap?: Map<string, string>;
}>();

const emit = defineEmits<{
  click: [row: IotPluginApi.PluginDriver];
  delete: [row: IotPluginApi.PluginDriver];
  edit: [row: IotPluginApi.PluginDriver];
}>();

// Get type label
const typeLabel = computed(() => {
  if (!props.row.type) return '-';
  return props.typeMap?.get(props.row.type) || props.row.type;
});

// Icons
const EditIcon = createIconifyIcon('lucide:edit-3');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const ClockIcon = createIconifyIcon('lucide:clock');
const PlugIcon = createIconifyIcon('lucide:plug');
const ServerIcon = createIconifyIcon('lucide:server');
const CpuIcon = createIconifyIcon('lucide:cpu');
const PlayIcon = createIconifyIcon('lucide:play-circle');
const BellIcon = createIconifyIcon('lucide:bell');
const DatabaseIcon = createIconifyIcon('lucide:database');

// Type Icon based on plugin type
const TypeIcon = computed(() => {
  switch (props.row.type) {
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

// Formatted Time
const createTimeText = computed(() => {
  if (!props.row.createTime) return '-';
  return formatDate(new Date(props.row.createTime), 'YYYY-MM-DD');
});

// Card Style (using primary color)
const gradientStops =
  'via-white via-[15%] to-white dark:via-[#151515] dark:via-[15%] dark:to-[#151515]';

const cardBg = `from-primary/10 ${gradientStops} dark:from-primary/10`;

// Version display
const versionText = computed(() => {
  return props.row.version || '-';
});
</script>

<template>
  <div
    class="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-slate-200 bg-white bg-gradient-to-br shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg dark:border-gray-800 dark:bg-[#151515]"
    :class="cardBg"
    @click="emit('click', row)"
  >
    <!-- Header Row (Compact) -->
    <div class="flex items-center gap-3 px-4 pb-2 pt-4">
      <!-- Icon -->
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary transition-colors"
      >
        <component :is="TypeIcon" class="h-5 w-5" stroke-width="2" />
      </div>

      <!-- Identity -->
      <div class="flex min-w-0 flex-col gap-0.5">
        <h3
          class="truncate pr-8 text-sm font-bold text-slate-900 dark:text-gray-100"
          :title="row.name"
        >
          {{ row.name }}
        </h3>
        <p
          class="truncate font-mono text-[10px] text-slate-400"
          :title="row.id"
        >
          ID: {{ row.id }}
        </p>
      </div>
    </div>

    <!-- Body Content (Compact) -->
    <div class="group/body relative flex flex-1 flex-col gap-2 px-4 pb-3">
      <!-- Meta Row -->
      <div class="flex items-center justify-between gap-2 text-xs">
        <!-- Type -->
        <span
          class="truncate rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
          :title="row.type"
        >
          {{ typeLabel }}
        </span>
        <!-- Version -->
        <div class="flex items-center gap-1 text-slate-500 dark:text-gray-500">
          <span class="text-[10px]">v{{ versionText }}</span>
        </div>
      </div>

      <!-- Time Row -->
      <div class="flex items-center gap-1.5 text-xs text-slate-400">
        <ClockIcon class="size-3.5 shrink-0" />
        <span class="truncate">{{ createTimeText }}</span>
      </div>

      <!-- Description Box -->
      <div class="mt-1 flex-1 rounded bg-slate-50 p-2 dark:bg-slate-800/50">
        <p
          class="line-clamp-1 text-[10px] leading-relaxed text-slate-500 dark:text-gray-400"
          :title="row.description"
        >
          {{ row.description || $t('common.noDescription') }}
        </p>
      </div>
    </div>

    <!-- Footer (Compact) -->
    <div
      class="mt-auto flex h-9 cursor-default items-center divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/30 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/30"
      @click.stop
    >
      <Tooltip :title="$t('common.edit')">
        <div
          class="group/btn flex flex-1 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:bg-white hover:text-primary dark:hover:bg-gray-800"
          @click.stop="emit('edit', row)"
        >
          <EditIcon
            class="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110"
          />
        </div>
      </Tooltip>

      <Tooltip :title="$t('common.delete')">
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
