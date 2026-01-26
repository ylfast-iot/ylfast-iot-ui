<script setup lang="ts">
import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { formatDate } from '@vueuse/core';
import { Popconfirm, Tooltip } from 'ant-design-vue';

import { IotMediaServerApi } from '#/api/iot/media-server';

const props = defineProps<{
  loading?: boolean;
  providerOptions?: any[];
  row: IotMediaServerApi.IotMediaServerConfig;
}>();

const emit = defineEmits<{
  click: [row: IotMediaServerApi.IotMediaServerConfig];
  delete: [row: IotMediaServerApi.IotMediaServerConfig];
  edit: [row: IotMediaServerApi.IotMediaServerConfig];
  toggleStatus: [row: IotMediaServerApi.IotMediaServerConfig];
}>();

// Icons
const EditIcon = createIconifyIcon('lucide:edit-3');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const PowerIcon = createIconifyIcon('lucide:power');
const VideoIcon = createIconifyIcon('lucide:video');
const FolderIcon = createIconifyIcon('lucide:folder');
const ClockIcon = createIconifyIcon('lucide:clock');
const LoadingIcon = createIconifyIcon('lucide:loader-2');

// Computed Properties
const isEnabled = computed(() => !!props.row.enabled);

// Formatted Time
const createTimeText = computed(() => {
  if (!props.row.createTime) return '-';
  return formatDate(new Date(props.row.createTime), 'YYYY-MM-DD');
});

// Status Badge Logic
const statusBadge = computed(() => {
  const gradientStops =
    'via-white via-[15%] to-white dark:via-[#151515] dark:via-[15%] dark:to-[#151515]';

  if (!isEnabled.value) {
    return {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20 backdrop-blur-md',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-200/50 dark:border-rose-500/30',
      dot: 'bg-rose-500',
      label: $t('common.disable'),
      fold: 'border-rose-800/20 dark:border-rose-500/40',
      cardBg: `from-rose-100/40 ${gradientStops} dark:from-rose-500/10`,
    };
  }

  // Enabled (Using Primary Theme Color)
  return {
    bg: 'bg-primary/10 backdrop-blur-md',
    text: 'text-primary',
    border: 'border-primary/30',
    dot: 'bg-primary',
    label: $t('common.enable'),
    fold: 'border-primary/40',
    cardBg: `from-primary/10 ${gradientStops} dark:from-primary/10`,
  };
});

// Icon Style
const iconStyle = computed(() => {
  return isEnabled.value
    ? 'bg-primary/10 text-primary'
    : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
});

// Type Tag Style
const typeTagClass = computed(() => {
  return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
});

// Dynamic Provider Label (Fetched from remote options)
const providerName = computed(() => {
  const option = props.providerOptions?.find(
    (opt) => opt.value === props.row.provider,
  );
  return option ? option.label : props.row.provider;
});
</script>

<template>
  <div
    class="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-slate-200 bg-white bg-gradient-to-br shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg dark:border-gray-800 dark:bg-[#151515]"
    :class="statusBadge.cardBg"
    @click="emit('click', row)"
  >
    <!-- Ribbon Status Indicator -->
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
        {{ statusBadge.label }}

        <div
          class="absolute -bottom-[4px] right-0 h-0 w-0 border-l-[4px] border-t-[4px] border-l-transparent"
          :class="statusBadge.fold"
        ></div>
      </div>
    </div>

    <!-- Header Row (Compact) -->
    <div class="flex items-center gap-3 px-4 pb-2 pt-4">
      <!-- Icon -->
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-colors"
        :class="iconStyle"
      >
        <VideoIcon class="h-5 w-5" stroke-width="2" />
      </div>

      <!-- Identity -->
      <div class="flex min-w-0 flex-col gap-0.5">
        <h3
          class="truncate pr-1 text-sm font-bold text-slate-900 dark:text-gray-100"
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
    <div class="relative flex flex-1 flex-col gap-2 px-4 pb-3">
      <!-- Meta Row (Provider & Cluster Mode) -->
      <div class="flex items-center justify-between gap-2 text-xs">
        <!-- Provider -->
        <div
          class="flex min-w-0 flex-1 items-center gap-1.5 text-slate-600 dark:text-gray-400"
        >
          <FolderIcon class="size-3.5 shrink-0 text-slate-400" />
          <span class="truncate" :title="providerName">
            {{ providerName }}
          </span>
        </div>

        <!-- Share Cluster Tag -->
        <span
          class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
          :class="typeTagClass"
        >
          {{
            row.shareCluster
              ? $t('mediaServer.config.cluster')
              : $t('mediaServer.config.independent')
          }}
        </span>
      </div>

      <!-- Footer Info Row (Time) -->
      <div class="flex items-center justify-end gap-2">
        <div
          class="flex shrink-0 items-center gap-1.5 text-[10px] text-slate-400"
        >
          <ClockIcon class="size-3 shrink-0 opacity-70" />
          <span class="truncate">{{ createTimeText }}</span>
        </div>
      </div>

      <!-- Description Box (Reuse provider as description if no description field?) -->
      <!-- The entity doesn't have a description field in Java, but BasicEntity might? -->
      <!-- NetComp had it. Let's assume it doesn't for now or use name. -->
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

      <Tooltip :title="isEnabled ? $t('common.disable') : $t('common.enable')">
        <Popconfirm
          :title="
            isEnabled
              ? $t('mediaServer.action.shutdown')
              : $t('mediaServer.action.start')
          "
          @click.stop
          @confirm.stop="emit('toggleStatus', row)"
        >
          <div
            class="group/btn flex flex-1 cursor-pointer items-center justify-center transition-colors hover:bg-white dark:hover:bg-gray-800"
            :class="
              isEnabled
                ? 'text-primary hover:text-primary/80'
                : 'text-slate-400 hover:text-primary'
            "
          >
            <component
              :is="loading ? LoadingIcon : PowerIcon"
              class="h-3.5 w-3.5 transition-transform"
              :class="{
                'group-hover/btn:scale-110': !loading,
                'animate-spin': loading,
              }"
            />
          </div>
        </Popconfirm>
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
