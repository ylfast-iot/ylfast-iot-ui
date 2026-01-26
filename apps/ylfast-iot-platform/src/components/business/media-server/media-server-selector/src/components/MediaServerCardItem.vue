<script setup lang="ts">
import type { IotMediaServerApi } from '#/api/iot/media-server';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { getMediaServerStateInfo, getProviderInfo } from '../config';

defineProps<{
  isSelected?: boolean;
  item: IotMediaServerApi.IotMediaServerConfig;
}>();

const CheckIcon = createIconifyIcon('lucide:check-circle-2');
const VideoIcon = createIconifyIcon('lucide:video');
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
        <VideoIcon class="size-6" />
      </div>

      <div class="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <span
          class="truncate text-base font-bold tracking-tight text-foreground transition-colors duration-300"
          :title="item.name"
        >
          {{ item.name }}
        </span>
        <span
          class="text-[10px] font-medium uppercase text-muted-foreground opacity-70"
        >
          ID: {{ item.id }}
        </span>
      </div>
    </div>

    <!-- Details Section -->
    <div class="mt-4 flex flex-col gap-2.5">
      <!-- State/Status -->
      <div class="flex items-center justify-between">
        <span class="text-xs text-muted-foreground">{{
          $t('common.status')
        }}</span>
        <div
          class="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset"
          :class="[
            getMediaServerStateInfo(item.enabled).statusColor === 'success'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-700/10 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-700 ring-rose-700/10 dark:bg-rose-500/10 dark:text-rose-400',
          ]"
        >
          <div
            class="size-1.5 rounded-full"
            :class="[
              getMediaServerStateInfo(item.enabled).statusColor === 'success'
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                : 'bg-rose-500',
            ]"
          ></div>
          {{ getMediaServerStateInfo(item.enabled).label }}
        </div>
      </div>

      <!-- Info Grid -->
      <div class="grid grid-cols-2 gap-3 border-t border-border pt-3">
        <!-- Provider -->
        <div class="flex flex-col gap-1">
          <span
            class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60"
          >
            {{ $t('mediaServer.provider') }}
          </span>
          <span
            class="truncate text-xs font-bold text-muted-foreground transition-colors group-hover:text-primary"
          >
            {{ getProviderInfo(item.provider).label }}
          </span>
        </div>
        <!-- Cluster Mode -->
        <div class="flex flex-col items-end gap-1">
          <span
            class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60"
          >
            {{ $t('mediaServer.config.mode') }}
          </span>
          <span class="truncate text-xs font-bold text-muted-foreground">
            {{
              item.shareCluster
                ? $t('mediaServer.config.cluster')
                : $t('mediaServer.config.independent')
            }}
          </span>
        </div>
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

.border-primary {
  box-shadow: 0 0 15px -3px hsl(var(--primary), 0.2);
}
</style>
