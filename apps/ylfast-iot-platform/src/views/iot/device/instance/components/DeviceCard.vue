<script setup lang="ts">
import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Popconfirm, Tag, Tooltip } from 'ant-design-vue';

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
const CpuIcon = createIconifyIcon('lucide:cpu');
const BoxIcon = createIconifyIcon('lucide:box');
const HashIcon = createIconifyIcon('lucide:hash');

// Computed Properties for Styles & Text
const isEnabled = computed(() => props.row.enableStatus === 1);

// Status Style Logic
const statusStyle = computed(() => {
  if (!isEnabled.value) {
    return {
      bg: 'bg-red-500/10 dark:bg-red-500/20 backdrop-blur-md',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200/50 dark:border-red-500/30',
      dot: 'bg-red-500',
      label: $t('device.instance.disable'),
      iconColor: 'text-red-400',
      cardBg:
        'from-red-50/40 via-white to-white dark:from-red-500/5 dark:via-[#151515] dark:to-[#151515]',
      blockBg: 'bg-red-100/30 dark:bg-red-500/10',
      fold: 'border-red-800/20 dark:border-red-500/40',
    };
  }

  const state = props.row.deviceState;
  switch (state) {
    case 'offline': {
      return {
        bg: 'bg-gray-200/50 dark:bg-gray-700/50 backdrop-blur-md',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-300 dark:border-gray-600',
        dot: 'bg-gray-400',
        label: $t('device.state.offline'),
        iconColor: 'text-gray-400',
        cardBg:
          'from-gray-50 via-white to-white dark:from-white/5 dark:via-[#151515] dark:to-[#151515]',
        blockBg: 'bg-gray-100 dark:bg-gray-800',
        fold: 'border-gray-400/30 dark:border-gray-600/50',
      };
    }
    case 'online': {
      return {
        bg: 'bg-green-500/10 dark:bg-green-500/20 backdrop-blur-md',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-200/50 dark:border-green-500/30',
        dot: 'bg-green-500',
        label: $t('device.state.online'),
        iconColor: 'text-green-400',
        cardBg:
          'from-green-50/40 via-white to-white dark:from-green-500/5 dark:via-[#151515] dark:to-[#151515]',
        blockBg: 'bg-green-100/30 dark:bg-green-500/10',
        fold: 'border-green-800/20 dark:border-green-500/40',
      };
    }
    case 'unActive': {
      return {
        bg: 'bg-orange-500/10 dark:bg-orange-500/20 backdrop-blur-md',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-200/50 dark:border-orange-500/30',
        dot: 'bg-orange-500',
        label: $t('device.state.unActive'),
        iconColor: 'text-orange-400',
        cardBg:
          'from-orange-50/40 via-white to-white dark:from-orange-500/5 dark:via-[#151515] dark:to-[#151515]',
        blockBg: 'bg-orange-100/30 dark:bg-orange-500/10',
        fold: 'border-orange-800/20 dark:border-orange-500/40',
      };
    }
    default: {
      return {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20 backdrop-blur-md',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200/50 dark:border-blue-500/30',
        dot: 'bg-blue-500',
        label: $t('device.state.other'),
        iconColor: 'text-blue-400',
        cardBg:
          'from-blue-50/40 via-white to-white dark:from-blue-500/5 dark:via-[#151515] dark:to-[#151515]',
        blockBg: 'bg-blue-100/30 dark:bg-blue-500/10',
        fold: 'border-blue-800/20 dark:border-blue-500/40',
      };
    }
  }
});

const deviceTypeConfig = computed(() => {
  if (!props.row.deviceType) return null;
  return DEVICE_TYPE_ENUMS[props.row.deviceType];
});
</script>

<template>
  <div
    class="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 bg-white bg-gradient-to-br shadow-sm transition-all duration-300 hover:shadow-md dark:border-gray-800 dark:bg-[#151515]"
    :class="statusStyle.cardBg"
    @click="emit('click', row)"
  >
    <!-- Ribbon Status Indicator (Advanced Ribbon Style) -->
    <div class="absolute -right-1 top-4 z-20">
      <div
        class="relative flex items-center gap-1.5 rounded-l-md border-y border-l px-3 py-1 text-[10px] font-bold shadow-sm"
        :class="[statusStyle.bg, statusStyle.text, statusStyle.border]"
      >
        <span class="relative flex h-1.5 w-1.5">
          <span
            v-if="row.deviceState === 'online' && isEnabled"
            class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            :class="statusStyle.dot"
          ></span>
          <span
            class="relative inline-flex h-1.5 w-1.5 rounded-full"
            :class="statusStyle.dot"
          ></span>
        </span>
        {{ statusStyle.label }}

        <!-- The Ribbon Fold (Triangle) -->
        <div
          class="absolute -bottom-[4px] right-0 h-0 w-0 border-l-[4px] border-t-[4px] border-l-transparent"
          :class="statusStyle.fold"
        ></div>
      </div>
    </div>

    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-black/[0.03] p-3 pb-2 dark:border-white/[0.03]"
    >
      <div class="flex items-center gap-3 overflow-hidden">
        <!-- Device Icon -->
        <div
          class="shrink-0 transition-transform duration-300 group-hover:scale-105"
        >
          <img
            v-if="row.deviceCoverUrl"
            :alt="row.deviceName"
            :src="row.deviceCoverUrl"
            class="size-10 rounded-lg border border-gray-100 object-cover dark:border-gray-700"
          />
          <div
            v-else
            class="flex size-10 items-center justify-center rounded-lg bg-white/50 shadow-inner dark:bg-white/5"
          >
            <CpuIcon :class="statusStyle.iconColor" class="size-6" />
          </div>
        </div>
        <!-- Device Name -->
        <div
          class="truncate text-sm font-bold text-gray-800 dark:text-gray-100"
          :title="row.deviceName"
        >
          {{ row.deviceName }}
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="flex flex-1 flex-col gap-2 p-3 pt-2">
      <!-- Technical Info Block -->
      <div
        class="flex flex-col gap-1.5 rounded border border-black/[0.02] p-2 dark:border-white/[0.02]"
        :class="statusStyle.blockBg"
      >
        <!-- Product & Type Row -->
        <div class="flex items-center justify-between">
          <div
            class="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300"
          >
            <BoxIcon class="size-3.5 text-gray-400" />
            <span class="truncate font-medium" :title="row.productName">{{
              row.productName || $t('common.unknown')
            }}</span>
          </div>
          <Tag
            :color="deviceTypeConfig?.color || 'blue'"
            class="mr-0 origin-right scale-90"
          >
            {{ deviceTypeConfig?.label || $t('common.unknown') }}
          </Tag>
        </div>

        <!-- ID & SN Row -->
        <div class="flex flex-col gap-0.5 text-xs text-gray-500">
          <div v-if="row.sn" class="flex items-center gap-1.5">
            <HashIcon class="size-3.5 text-gray-400 opacity-50" />
            <span class="truncate font-mono" :title="row.sn">
              SN: {{ row.sn }}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <HashIcon class="size-3.5 text-gray-400" />
            <span class="truncate font-mono" :title="row.id">
              ID: {{ row.id }}
            </span>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="px-1">
        <p
          class="line-clamp-2 h-[39px] text-xs leading-relaxed text-gray-400"
          :title="row.description"
        >
          {{ row.description || $t('common.noDescription') }}
        </p>
      </div>
    </div>

    <!-- Footer (Refined) -->
    <div
      class="flex h-10 items-center justify-between border-t border-black/[0.03] bg-white/40 px-4 backdrop-blur-sm dark:border-white/[0.03] dark:bg-black/20"
    >
      <Tooltip :title="$t('common.edit')">
        <div
          class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400"
          @click.stop="emit('edit', row)"
        >
          <EditIcon class="size-4" />
        </div>
      </Tooltip>

      <Tooltip :title="isEnabled ? $t('common.disable') : $t('common.enable')">
        <Popconfirm
          :title="
            isEnabled
              ? $t('device.instance.action.confirmDisable')
              : $t('device.instance.action.confirmEnable')
          "
          @click.stop
          @confirm.stop="emit('toggleStatus', row)"
        >
          <div
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-all"
            :class="[
              isEnabled
                ? 'text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-500/20'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700/50',
            ]"
          >
            <PowerIcon class="size-4" />
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
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
          >
            <TrashIcon class="size-4" />
          </div>
        </Popconfirm>
      </Tooltip>
    </div>
  </div>
</template>
