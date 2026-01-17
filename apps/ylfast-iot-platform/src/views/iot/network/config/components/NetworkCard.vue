<script setup lang="ts">
import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { formatDate } from '@vueuse/core';
import { Popconfirm, Tooltip } from 'ant-design-vue';

import { IotNetCompApi } from '#/api/iot/network-config';

const props = defineProps<{
  row: IotNetCompApi.IotNetComp;
  typeOptions?: any[];
}>();

const emit = defineEmits<{
  click: [row: IotNetCompApi.IotNetComp];
  delete: [row: IotNetCompApi.IotNetComp];
  edit: [row: IotNetCompApi.IotNetComp];
  toggleStatus: [row: IotNetCompApi.IotNetComp];
}>();

// Icons
const EditIcon = createIconifyIcon('lucide:edit-3');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const PowerIcon = createIconifyIcon('lucide:power');
const NetworkIcon = createIconifyIcon('lucide:network');
const FolderIcon = createIconifyIcon('lucide:folder');
const ClockIcon = createIconifyIcon('lucide:clock');
const ServerIcon = createIconifyIcon('lucide:server');
const CloudIcon = createIconifyIcon('lucide:cloud');

// Computed Properties
const isEnabled = computed(() => props.row.state?.value === 'enabled');

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

// Dynamic Type Name Label (Fetched from remote options)
const typeName = computed(() => {
  const option = props.typeOptions?.find((opt) => opt.value === props.row.type);
  return option ? option.label : props.row.type;
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
        <NetworkIcon class="h-5 w-5" stroke-width="2" />
      </div>

      <!-- Identity -->
      <div class="flex min-w-0 flex-col gap-0.5">
        <div class="flex items-center gap-2">
          <h3
            class="truncate pr-1 text-sm font-bold text-slate-900 dark:text-gray-100"
            :title="row.name"
          >
            {{ row.name }}
          </h3>
          <span
            v-if="row.addressInfo && row.addressInfo.length > 0"
            class="shrink-0 rounded px-1.5 py-px text-[9px] font-bold tracking-wider transition-all"
            :class="
              row.addressInfo?.[0]?.client
                ? 'bg-blue-100/80 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                : 'bg-orange-100/80 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
            "
          >
            {{
              row.addressInfo?.[0]?.client
                ? $t('network.client')
                : $t('network.server')
            }}
          </span>
        </div>
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
      <!-- Meta Row (Row 3: Type & Cluster Mode) -->
      <div class="flex items-center justify-between gap-2 text-xs">
        <!-- Type -->
        <div
          class="flex min-w-0 flex-1 items-center gap-1.5 text-slate-600 dark:text-gray-400"
        >
          <FolderIcon class="size-3.5 shrink-0 text-slate-400" />
          <span class="truncate" :title="typeName">
            {{ typeName }}
          </span>
        </div>

        <!-- Share Cluster Tag -->
        <span
          class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
          :class="typeTagClass"
        >
          {{
            row.shareCluster
              ? $t('network.config.cluster')
              : $t('network.config.independent')
          }}
        </span>
      </div>

      <!-- Technical Row (Row 4: Address & Time) -->
      <div class="flex items-center justify-between gap-2">
        <!-- Address Info -->
        <Tooltip v-if="row.addressInfo && row.addressInfo.length > 0">
          <template #title>
            <div class="flex flex-col gap-1 p-1">
              <div
                v-for="(addr, index) in row.addressInfo"
                :key="index"
                class="flex items-center gap-1.5 whitespace-nowrap text-[11px]"
              >
                <component
                  :is="addr.client ? CloudIcon : ServerIcon"
                  class="size-3"
                  :class="addr.client ? 'text-blue-400' : 'text-orange-400'"
                />
                <span class="font-mono">{{ addr.address }}</span>
              </div>
            </div>
          </template>
          <div
            class="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800/80"
          >
            <component
              :is="row.addressInfo?.[0]?.client ? CloudIcon : ServerIcon"
              class="size-3 shrink-0"
              :class="
                row.addressInfo?.[0]?.client
                  ? 'text-blue-500'
                  : 'text-orange-500'
              "
            />
            <span
              class="max-w-[180px] truncate font-mono text-[10px] text-slate-500 dark:text-gray-400"
            >
              {{ row.addressInfo?.[0]?.address }}
            </span>
            <span
              v-if="row.addressInfo && row.addressInfo.length > 1"
              class="ml-0.5 whitespace-nowrap text-[9px] font-bold text-primary"
            >
              +{{ row.addressInfo.length - 1 }}
            </span>
          </div>
        </Tooltip>
        <div v-else class="text-[10px] text-slate-300">-</div>

        <!-- Time -->
        <div
          class="flex shrink-0 items-center gap-1.5 text-[10px] text-slate-400"
        >
          <ClockIcon class="size-3 shrink-0 opacity-70" />
          <span class="truncate">{{ createTimeText }}</span>
        </div>
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

      <Tooltip :title="isEnabled ? $t('common.disable') : $t('common.enable')">
        <Popconfirm
          :title="
            isEnabled
              ? $t('network.action.confirmShutdown')
              : $t('network.action.confirmStart')
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
            <PowerIcon
              class="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110"
            />
          </div>
        </Popconfirm>
      </Tooltip>

      <Tooltip
        :title="isEnabled ? $t('network.tips.stopFirst') : $t('common.delete')"
      >
        <div
          v-if="isEnabled"
          class="flex flex-1 cursor-not-allowed items-center justify-center text-slate-300 dark:text-gray-600"
        >
          <TrashIcon class="h-3.5 w-3.5" />
        </div>
        <Popconfirm
          v-else
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
