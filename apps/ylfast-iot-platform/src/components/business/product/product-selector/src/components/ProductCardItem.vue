<script setup lang="ts">
import type { IotDeviceProductApi } from '#/api/iot/device/product';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

defineProps<{
  isSelected?: boolean;
  item: IotDeviceProductApi.DeviceProduct;
}>();

const CheckIcon = createIconifyIcon('lucide:check-circle');
const PackageIcon = createIconifyIcon('lucide:package');
</script>

<template>
  <div
    class="group relative flex cursor-pointer items-start gap-4 rounded-lg border border-border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md dark:border-border/60 dark:bg-[#1c1e23]"
    :class="[isSelected ? '!border-primary ring-1 ring-primary/20' : '']"
  >
    <!-- Selection Checkmark -->
    <div
      v-if="isSelected"
      class="absolute -right-2 -top-2 z-10 flex size-6 items-center justify-center rounded-full bg-white shadow-sm dark:bg-[#1c1e23]"
    >
      <CheckIcon class="size-full text-primary" />
    </div>

    <!-- Left: Icon -->
    <div class="shrink-0">
      <div
        class="flex size-16 items-center justify-center rounded-lg bg-blue-50 text-blue-500 shadow-inner dark:bg-blue-500/10"
      >
        <PackageIcon class="size-8" />
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
          :title="item.productName"
        >
          {{ item.productName }}
        </span>
      </div>

      <!-- Body -->
      <div
        class="mt-2 grid grid-cols-1 gap-2 rounded-md bg-muted/20 p-2 dark:bg-muted/10"
      >
        <!-- Type -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted-foreground">{{
            $t('device.product.productType')
          }}</span>
          <Tag color="blue" class="!m-0 text-[10px]">
            {{ item.productType }}
          </Tag>
        </div>
      </div>
    </div>
  </div>
</template>
