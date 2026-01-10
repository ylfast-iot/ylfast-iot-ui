<script setup lang="ts">
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

import { getDeviceStateInfo, getDeviceTypeInfo } from '../config';

defineProps<{
  isSelected?: boolean;
  item: IotDeviceInstanceApi.DeviceInstance;
}>();

const CheckIcon = createIconifyIcon('lucide:check-circle');
const CpuIcon = createIconifyIcon('lucide:cpu');
</script>

<template>
  <div
    class="group relative flex cursor-pointer items-start gap-4 rounded-lg border border-border bg-white bg-gradient-to-br p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md dark:border-border/60 dark:bg-[#1c1e23]"
    :class="[
      getDeviceStateInfo(item.deviceState).cardBg,
      isSelected ? '!border-primary ring-1 ring-primary/20' : '',
    ]"
  >
    <!-- Selection Checkmark -->
    <div
      v-if="isSelected"
      class="absolute -right-2 -top-2 z-10 flex size-6 items-center justify-center rounded-full bg-white shadow-sm dark:bg-[#1c1e23]"
    >
      <CheckIcon class="size-full text-primary" />
    </div>

    <!-- Left: Cover Image -->
    <div class="shrink-0">
      <img
        v-if="item.deviceCoverUrl"
        :alt="item.deviceName"
        :src="item.deviceCoverUrl"
        class="size-16 rounded-lg border border-gray-100 object-cover dark:border-gray-700"
      />
      <div
        v-else
        class="flex size-16 items-center justify-center rounded-lg bg-white/50 shadow-inner dark:bg-white/5"
      >
        <CpuIcon
          :class="getDeviceStateInfo(item.deviceState).iconColor"
          class="size-8"
        />
      </div>
    </div>

    <!-- Right: Content -->
    <div
      class="flex flex-1 flex-col justify-start self-stretch overflow-hidden"
    >
      <!-- Header -->
      <div class="flex items-start justify-between gap-2">
        <span
          class="line-clamp-1 text-base font-bold leading-tight text-foreground"
          :title="item.deviceName"
        >
          {{ item.deviceName }}
        </span>
        <Tag
          :color="getDeviceStateInfo(item.deviceState).statusColor"
          class="!mr-0 shrink-0 origin-right scale-90"
        >
          {{ getDeviceStateInfo(item.deviceState).label }}
        </Tag>
      </div>

      <!-- Body -->
      <div
        class="mt-2 grid grid-cols-2 gap-3 rounded-md bg-muted/20 dark:bg-muted/10"
      >
        <!-- Product -->
        <div class="flex flex-col gap-0.5 overflow-hidden">
          <span
            class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60"
          >
            {{ $t('device.instance.product') }}
          </span>
          <div class="overflow-hidden" :title="item.productName">
            <span class="truncate text-xs text-foreground/80">
              {{ item.productName || $t('common.unknown') }}
            </span>
          </div>
        </div>
        <!-- Type -->
        <div class="flex flex-col gap-0.5">
          <span
            class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60"
          >
            {{ $t('device.instance.type') }}
          </span>
          <div>
            <Tag
              :color="getDeviceTypeInfo(item.deviceType).color"
              class="!mr-0 !px-1.5 text-[10px]"
            >
              {{ getDeviceTypeInfo(item.deviceType).label }}
            </Tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
