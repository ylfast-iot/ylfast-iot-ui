<script setup lang="ts">
import type { IotGatewayApi } from '#/api/iot/gateway';
import type { ChannelType } from '#/enums/channel-type';

import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { formatDate } from '@vueuse/core';
import { Tooltip } from 'ant-design-vue';

import { CHANNEL_TYPE_ENUMS } from '#/enums/channel-type';

const props = defineProps<{
  isSelected?: boolean;
  item: IotGatewayApi.DeviceGatewayDetail;
}>();

// Icons
const CheckIcon = createIconifyIcon('lucide:check-circle-2');
const GatewayIcon = createIconifyIcon('lucide:router');
const FolderIcon = createIconifyIcon('lucide:folder');
const ClockIcon = createIconifyIcon('lucide:clock');
const NetworkIcon = createIconifyIcon('lucide:network');
const CodeIcon = createIconifyIcon('lucide:code-2');
const ServerIcon = createIconifyIcon('lucide:server');

// Computed Properties
const isEnabled = computed(() => props.item.state?.value === 'enabled');

// Formatted Time
const createTimeText = computed(() => {
  if (!props.item.createTime) return '-';
  return formatDate(new Date(props.item.createTime), 'YYYY-MM-DD');
});

// Protocol Name
const protocolName = computed(() => {
  return props.item.protocolDetail?.name || props.item.protocolId || '-';
});

// 健康状态样式
function getHealthClass(health: number) {
  if (health === 1) return 'text-green-500';
  if (health === 0) return 'text-slate-400';
  return 'text-red-500';
}

function getHealthClassLight(health: number) {
  if (health === 1) return 'text-green-400';
  if (health === 0) return 'text-slate-400';
  return 'text-red-400';
}

// Status Badge Logic
const statusBadge = computed(() => {
  const gradientStops =
    'via-white via-[15%] to-white dark:via-[#151515] dark:via-[15%] dark:to-[#151515]';

  if (isEnabled.value) {
    return {
      bg: 'bg-primary/10 backdrop-blur-md',
      border: 'border-primary/30',
      cardBg: `from-primary/10 ${gradientStops} dark:from-primary/10`,
      dot: 'bg-primary animate-pulse',
      fold: 'border-primary/40',
      label: $t('gateway.states.enabled'),
      text: 'text-primary',
    };
  }

  return {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20 backdrop-blur-md',
    border: 'border-rose-200/50 dark:border-rose-500/30',
    cardBg: `from-rose-100/40 ${gradientStops} dark:from-rose-500/10`,
    dot: 'bg-rose-500',
    fold: 'border-rose-800/20 dark:border-rose-500/40',
    label: $t('gateway.states.disabled'),
    text: 'text-rose-700 dark:text-rose-400',
  };
});

// Icon Style
const iconStyle = computed(() => {
  if (isEnabled.value) {
    return 'bg-primary/10 text-primary';
  }
  return 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
});

// Channel Type Tag Style
const channelTagClass = computed(() => {
  const c = props.item.channel;
  if (!c)
    return 'bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400';

  const enumValues = Object.values(CHANNEL_TYPE_ENUMS);
  const targetChannel = enumValues.find(
    (item) =>
      item.value === c || item.value.toLowerCase().endsWith(c.toLowerCase()),
  );

  const color = targetChannel?.color;
  if (color === 'purple')
    return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
  if (color === 'blue')
    return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
  if (color === 'green')
    return 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
  if (color === 'cyan')
    return 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400';
  if (color === 'orange')
    return 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400';

  return 'bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400';
});
</script>

<template>
  <div
    class="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-white bg-gradient-to-br shadow-sm transition-all duration-300 dark:bg-[#151515]"
    :class="[
      statusBadge.cardBg,
      isSelected
        ? 'border-primary ring-1 ring-primary/20'
        : 'border-slate-200 hover:border-primary/50 hover:shadow-lg dark:border-gray-800',
    ]"
  >
    <!-- Selection Checkmark -->
    <transition name="scale">
      <div
        v-if="isSelected"
        class="absolute right-2 top-10 z-20 flex size-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/20 dark:bg-[#1c1e23]"
      >
        <CheckIcon class="size-full text-primary" />
      </div>
    </transition>

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

    <!-- Header Row -->
    <div class="flex items-center gap-3 px-4 pb-2 pt-4">
      <!-- Icon -->
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-colors"
        :class="iconStyle"
      >
        <GatewayIcon class="h-5 w-5" stroke-width="2" focusable="false" />
      </div>

      <!-- Identity -->
      <div class="flex min-w-0 flex-col gap-0.5">
        <div class="flex items-center gap-2">
          <h3
            class="truncate pr-1 text-sm font-bold text-slate-900 dark:text-gray-100"
            :title="item.name"
          >
            {{ item.name }}
          </h3>
        </div>
        <p
          class="truncate font-mono text-[10px] text-slate-400"
          :title="item.id"
        >
          ID: {{ item.id }}
        </p>
      </div>
    </div>

    <!-- Body Content -->
    <div class="relative flex flex-1 flex-col gap-2 px-4 pb-3">
      <!-- Row 1: Provider & Channel Type -->
      <div class="flex items-center justify-between gap-2 text-xs">
        <div
          class="flex min-w-0 flex-1 items-center gap-1.5 text-slate-600 dark:text-gray-400"
        >
          <FolderIcon
            class="size-3.5 shrink-0 text-slate-400"
            focusable="false"
          />
          <span class="truncate" :title="item.channelInfo?.name">
            {{ item.channelInfo?.name || '-' }}
          </span>
        </div>
        <span
          class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
          :class="channelTagClass"
        >
          {{ CHANNEL_TYPE_ENUMS[item.channel as ChannelType]?.text || '-' }}
        </span>
      </div>

      <!-- Row 2: Protocol & Transport -->
      <div class="flex items-center justify-between gap-2 text-xs">
        <!-- Protocol -->
        <div
          class="flex min-w-0 flex-1 items-center gap-1.5 text-slate-600 dark:text-gray-400"
        >
          <CodeIcon
            class="size-3.5 shrink-0 text-indigo-400"
            focusable="false"
          />
          <span class="truncate" :title="protocolName">
            {{ protocolName }}
          </span>
        </div>
        <!-- Transport -->
        <div
          class="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800/80"
        >
          <NetworkIcon
            class="size-3 shrink-0 text-slate-500"
            focusable="false"
          />
          <span class="font-mono text-[10px] text-slate-500 dark:text-gray-400">
            {{ item.transport || '-' }}
          </span>
        </div>
      </div>

      <!-- Row 3: Channel Addresses & Time -->
      <div class="flex items-center justify-between gap-2">
        <!-- Address Info -->
        <Tooltip
          v-if="
            item.channelInfo?.addresses && item.channelInfo.addresses.length > 0
          "
        >
          <template #title>
            <div class="flex flex-col gap-1 p-1">
              <div
                v-for="(addr, index) in item.channelInfo.addresses"
                :key="index"
                class="flex items-center gap-1.5 whitespace-nowrap text-[11px]"
              >
                <ServerIcon
                  class="size-3"
                  :class="getHealthClassLight(addr.health)"
                  focusable="false"
                />
                <span class="font-mono">{{ addr.address }}</span>
              </div>
            </div>
          </template>
          <div
            class="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800/80"
          >
            <ServerIcon
              class="size-3 shrink-0"
              :class="
                getHealthClass(item.channelInfo?.addresses?.[0]?.health ?? 0)
              "
              focusable="false"
            />
            <span
              class="max-w-[150px] truncate font-mono text-[10px] text-slate-500 dark:text-gray-400"
            >
              {{ item.channelInfo.addresses[0]?.address }}
            </span>
            <span
              v-if="item.channelInfo.addresses.length > 1"
              class="ml-0.5 whitespace-nowrap text-[9px] font-bold text-primary"
            >
              +{{ item.channelInfo.addresses.length - 1 }}
            </span>
          </div>
        </Tooltip>
        <div v-else class="flex-1">
          <span class="text-[10px] text-slate-300">-</span>
        </div>

        <!-- Time -->
        <div
          class="flex shrink-0 items-center gap-1.5 text-[10px] text-slate-400"
        >
          <ClockIcon class="size-3 shrink-0 opacity-70" focusable="false" />
          <span class="truncate">{{ createTimeText }}</span>
        </div>
      </div>

      <!-- Description Box -->
      <div class="mt-1 flex-1 rounded bg-slate-50 p-2 dark:bg-slate-800/50">
        <p
          class="line-clamp-2 min-h-[2.5em] text-[10px] leading-relaxed text-slate-500 dark:text-gray-400"
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
