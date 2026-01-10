<script setup lang="ts">
import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { formatDate } from '@vueuse/core';
import { Popconfirm, Tooltip } from 'ant-design-vue';

import { IotDeviceInstanceApi } from '#/api/iot/device/instance';
import { DEVICE_TYPE_ENUMS } from '#/enums/device';

const props = defineProps<{
  row: IotDeviceInstanceApi.DeviceInstance;
}>();

const emit = defineEmits<{
  click: [row: IotDeviceInstanceApi.DeviceInstance];
  delete: [row: IotDeviceInstanceApi.DeviceInstance];
  edit: [row: IotDeviceInstanceApi.DeviceInstance];
  toggleStatus: [row: IotDeviceInstanceApi.DeviceInstance];
}>();

// Icons
const EditIcon = createIconifyIcon('lucide:edit-3');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const PowerIcon = createIconifyIcon('lucide:power');
const RouterIcon = createIconifyIcon('lucide:router');
const BoxIcon = createIconifyIcon('lucide:box');
const ClockIcon = createIconifyIcon('lucide:clock');
const EyeIcon = createIconifyIcon('lucide:eye');

// Computed Properties
// isActive: true if state value is NOT unActive.
const isActive = computed(() => props.row.deviceState?.value !== 'unActive');
const isOnline = computed(() => props.row.deviceState?.value === 'online');

// Formatted Time
const createTimeText = computed(() => {
  if (!props.row.createTime) return '-';
  return formatDate(new Date(props.row.createTime), 'YYYY-MM-DD');
});

// Status Badge Logic
const statusBadge = computed(() => {
  const gradientStops =
    'via-white via-[15%] to-white dark:via-[#151515] dark:via-[15%] dark:to-[#151515]';

  const stateValue = props.row.deviceState?.value;

  if (stateValue === 'unActive') {
    return {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20 backdrop-blur-md',
      text: 'text-rose-700 dark:text-rose-400',
      badgeBorder: 'border-rose-200/50 dark:border-rose-500/30',
      dot: 'bg-rose-500',
      label: $t('device.instance.disable'),
      fold: 'border-rose-800/20 dark:border-rose-500/40',
      cardBg: `from-rose-50 ${gradientStops} dark:from-rose-500/10`,
      hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-500/50',
    };
  }

  switch (stateValue) {
    case 'online': {
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 backdrop-blur-md',
        text: 'text-emerald-700 dark:text-emerald-400',
        badgeBorder: 'border-emerald-200/50 dark:border-emerald-500/30',
        dot: 'bg-emerald-500',
        label: $t('device.state.online'),
        fold: 'border-emerald-800/20 dark:border-emerald-500/40',
        cardBg: `from-emerald-50 ${gradientStops} dark:from-emerald-500/10`,
        hoverBorder:
          'hover:border-emerald-300 dark:hover:border-emerald-500/50',
      };
    }
    default: {
      return {
        bg: 'bg-slate-200/50 dark:bg-slate-700/50 backdrop-blur-md',
        text: 'text-slate-600 dark:text-slate-400',
        badgeBorder: 'border-slate-300 dark:border-slate-600',
        dot: 'bg-slate-400',
        label: $t('device.state.offline'),
        fold: 'border-slate-400/30 dark:border-slate-600/50',
        cardBg: `from-slate-50 ${gradientStops} dark:from-slate-500/10`,
        hoverBorder: 'hover:border-slate-400 dark:hover:border-slate-500/50',
      };
    }
  }
});

const deviceTypeConfig = computed(() => {
  if (!props.row.deviceType) return null;
  return DEVICE_TYPE_ENUMS[props.row.deviceType.value];
});

// Map Ant Design colors to Tailwind classes
const typeTagClass = computed(() => {
  const color = deviceTypeConfig.value?.color;
  switch (color) {
    case 'blue': {
      return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case 'cyan': {
      return 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400';
    }
    case 'green': {
      return 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
    }
    case 'orange': {
      return 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400';
    }
    case 'purple': {
      return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
    }
    default: {
      return 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  }
});

// Icon Style
const iconStyle = computed(() => {
  return isOnline.value
    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
    : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
});
</script>

<template>
  <div
    class="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-slate-200 bg-white bg-gradient-to-br shadow-sm transition-all duration-300 hover:shadow-lg dark:border-slate-800 dark:bg-[#151515]"
    :class="[statusBadge.cardBg, statusBadge.hoverBorder]"
    @click="emit('click', row)"
  >
    <!-- Ribbon Status Indicator -->
    <div class="absolute -right-1 top-3 z-20">
      <div
        class="relative flex items-center gap-1.5 rounded-l-md border-y border-l px-2.5 py-0.5 text-[10px] font-bold shadow-sm"
        :class="[statusBadge.bg, statusBadge.text, statusBadge.badgeBorder]"
      >
        <span class="relative flex h-1.5 w-1.5">
          <span
            v-if="row.deviceState?.value === 'online' && isActive"
            class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            :class="statusBadge.dot"
          ></span>
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
        class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-colors"
        :class="iconStyle"
      >
        <img
          v-if="row.deviceCoverUrl"
          :src="row.deviceCoverUrl"
          :alt="row.deviceName"
          class="h-full w-full object-cover"
        />
        <RouterIcon v-else class="h-6 w-6" stroke-width="2" />
      </div>

      <!-- Identity -->
      <div class="flex min-w-0 flex-col gap-0.5">
        <h3
          class="truncate pr-8 text-sm font-bold text-slate-900 dark:text-gray-100"
          :title="row.deviceName"
        >
          {{ row.deviceName }}
        </h3>
        <p
          class="truncate font-mono text-[10px] text-slate-400"
          :title="row.id"
        >
          ID: {{ row.id }}
        </p>
      </div>
    </div>

    <!-- Info Body -->
    <div class="group/body relative flex flex-1 flex-col gap-2 px-4 pb-3">
      <!-- Detail Mask -->
      <div
        class="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/body:opacity-100"
      >
        <div
          class="absolute inset-0 bg-white/60 backdrop-blur-[1px] dark:bg-black/60"
        ></div>
        <EyeIcon
          class="relative z-20 size-7 text-primary/80 transition-transform duration-300 group-hover/body:scale-110"
          stroke-width="1.5"
        />
      </div>

      <!-- Meta Row -->
      <div class="flex items-center justify-between gap-2 text-xs">
        <!-- Product -->
        <div
          class="flex min-w-0 items-center gap-1.5 text-slate-600 dark:text-gray-400"
        >
          <BoxIcon class="size-3.5 shrink-0 text-slate-400" />
          <span class="truncate" :title="row.productName">
            {{ row.productName || $t('common.unknown') }}
          </span>
        </div>

        <!-- Type Tag -->
        <span
          v-if="deviceTypeConfig"
          class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
          :class="typeTagClass"
        >
          {{ deviceTypeConfig.label }}
        </span>
      </div>

      <!-- Time Row -->
      <div class="flex items-center gap-1.5 text-xs text-slate-400">
        <ClockIcon class="size-3.5 shrink-0" />
        <span class="truncate">{{ createTimeText }}</span>
      </div>

      <!-- Description Box -->
      <div class="mt-1 rounded bg-slate-50 p-2 dark:bg-slate-800/50">
        <p
          class="line-clamp-1 text-[10px] leading-relaxed text-slate-500 dark:text-gray-400"
          :title="row.description"
        >
          {{ row.description || $t('common.noDescription') }}
        </p>
      </div>
    </div>

    <!-- Action Footer -->
    <div
      class="mt-auto flex h-9 cursor-default items-center divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/30 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/30"
      @click.stop
    >
      <Tooltip :title="$t('common.edit')">
        <div
          class="group/btn flex flex-1 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:bg-white hover:text-indigo-600 dark:hover:bg-gray-800"
          @click.stop="emit('edit', row)"
        >
          <EditIcon
            class="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110"
          />
        </div>
      </Tooltip>

      <!-- Toggle Status (Power) -->
      <Tooltip :title="isActive ? $t('common.disable') : $t('common.enable')">
        <Popconfirm
          :title="
            isActive
              ? $t('device.instance.action.confirmDisable')
              : $t('device.instance.action.confirmEnable')
          "
          @click.stop
          @confirm.stop="emit('toggleStatus', row)"
        >
          <div
            class="group/btn flex flex-1 cursor-pointer items-center justify-center transition-colors hover:bg-white dark:hover:bg-gray-800"
            :class="
              isActive
                ? 'text-emerald-500 hover:text-emerald-700'
                : 'text-slate-400 hover:text-emerald-600'
            "
          >
            <PowerIcon
              class="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110"
            />
          </div>
        </Popconfirm>
      </Tooltip>

      <Tooltip
        :title="
          isActive
            ? $t('device.instance.tips.disableBeforeDelete')
            : $t('common.delete')
        "
      >
        <div
          v-if="isActive"
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
