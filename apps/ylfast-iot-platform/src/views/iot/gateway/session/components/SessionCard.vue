<script setup lang="ts">
import type { IotGatewayApi } from '#/api/iot/gateway';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { formatDate, useClipboard } from '@vueuse/core';
import { Button, message, Popconfirm, Tag, Tooltip } from 'ant-design-vue';

interface Props {
  item: IotGatewayApi.DeviceSessionInfo;
}

defineProps<Props>();

const emit = defineEmits<{
  remove: [item: IotGatewayApi.DeviceSessionInfo];
}>();

const DeviceIcon = createIconifyIcon('lucide:activity');
const AddressIcon = createIconifyIcon('lucide:hash');
const ServerIcon = createIconifyIcon('lucide:server');
const ParentIcon = createIconifyIcon('lucide:git-pull-request');
const ClockIcon = createIconifyIcon('lucide:timer');
const MessageIcon = createIconifyIcon('lucide:message-square');
const CopyIcon = createIconifyIcon('lucide:copy');
const DeleteIcon = createIconifyIcon('lucide:trash-2');

const { copy, copied } = useClipboard();

// 复制 ID
function handleCopy(id: string) {
  copy(id);
  if (copied.value) {
    message.success($t('common.copySuccess'));
  }
}
</script>

<template>
  <div
    class="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg dark:border-gray-800 dark:bg-[#151515]"
  >
    <!-- Card Header & Status -->
    <div class="mb-4 flex items-start justify-between">
      <div class="flex min-w-0 items-center gap-4">
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:scale-105 group-hover:bg-primary group-hover:text-white"
        >
          <DeviceIcon class="size-6" />
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <div class="flex items-center gap-2">
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
            >
              {{ $t('gateway.session.sessionId') }}
            </span>
            <Tooltip :title="$t('gateway.session.copyId')">
              <Button
                type="text"
                size="small"
                class="h-5 w-5 p-0 text-slate-300 transition-colors hover:text-primary"
                @click="handleCopy(item.deviceId)"
              >
                <CopyIcon class="size-3" />
              </Button>
            </Tooltip>
          </div>
          <h4
            class="m-0 truncate text-sm font-black text-slate-800 dark:text-gray-100"
            :title="item.deviceId"
          >
            {{ item.deviceId }}
          </h4>
        </div>
      </div>

      <!-- Remove Button -->
      <Popconfirm
        :title="$t('gateway.session.confirmRemove')"
        @confirm="emit('remove', item)"
        placement="leftTop"
      >
        <Button
          type="text"
          size="small"
          danger
          class="absolute right-3 top-3 translate-x-1 opacity-0 transition-all hover:bg-rose-50 group-hover:translate-x-0 group-hover:opacity-100 dark:hover:bg-rose-900/10"
        >
          <template #icon>
            <DeleteIcon class="size-4" />
          </template>
        </Button>
      </Popconfirm>
    </div>

    <!-- Technical Grid -->
    <div
      class="grid grid-cols-2 gap-4 rounded-xl bg-slate-50/80 p-3 dark:bg-gray-800/40"
    >
      <!-- Node Info -->
      <div class="flex flex-col gap-1 overflow-hidden">
        <span class="text-[9px] font-bold uppercase text-slate-400">
          {{ $t('gateway.session.serverId') }}
        </span>
        <div class="flex min-w-0 items-center gap-1.5">
          <ServerIcon class="size-3 shrink-0 text-indigo-400" />
          <span
            class="truncate font-mono text-[11px] text-slate-600 dark:text-gray-300"
          >
            {{ item.serverId || '-' }}
          </span>
        </div>
      </div>

      <!-- Protocol Info -->
      <div class="flex flex-col gap-1">
        <span class="text-[9px] font-bold uppercase text-slate-400">
          {{ $t('gateway.transport') }}
        </span>
        <div class="flex items-center gap-1.5">
          <Tag
            color="blue"
            class="m-0 h-4 border-none px-2 py-0 text-[9px] font-bold leading-4"
          >
            {{ item.transport }}
          </Tag>
        </div>
      </div>

      <!-- Address Info -->
      <div class="col-span-2 flex flex-col gap-1 overflow-hidden">
        <span class="text-[9px] font-bold uppercase text-slate-400">
          {{ $t('gateway.session.address') }}
        </span>
        <div class="flex min-w-0 items-center gap-2">
          <AddressIcon class="size-3 shrink-0 text-teal-400" />
          <span
            class="truncate font-mono text-[11px] text-slate-600 dark:text-gray-300"
          >
            {{ item.address || '-' }}
          </span>
        </div>
      </div>

      <!-- Pending Messages -->
      <div class="flex flex-col gap-1">
        <span class="text-[9px] font-bold uppercase text-slate-400">
          {{ $t('gateway.session.pendingMessages') }}
        </span>
        <div class="flex items-center gap-2">
          <MessageIcon class="size-3 shrink-0 text-amber-500" />
          <span
            class="font-mono text-[11px] font-bold"
            :class="
              item.pendingMessages
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-400'
            "
          >
            {{ item.pendingMessages || 0 }}
          </span>
        </div>
      </div>

      <!-- Parent Device (Conditional) -->
      <div
        v-if="item.parentDeviceId"
        class="flex flex-col gap-1 overflow-hidden"
      >
        <span class="text-[9px] font-bold uppercase text-slate-400">
          {{ $t('gateway.session.parentDeviceId') }}
        </span>
        <div class="flex min-w-0 items-center gap-2">
          <ParentIcon class="size-3 shrink-0 text-indigo-400" />
          <span class="truncate font-mono text-[11px] font-bold text-primary">
            {{ item.parentDeviceId }}
          </span>
        </div>
      </div>
    </div>

    <!-- Timeline Tracker -->
    <div class="mt-4 flex items-stretch gap-3 pl-1">
      <div class="flex flex-col items-center gap-0.5 pt-1">
        <div class="size-1.5 rounded-full bg-slate-300"></div>
        <div class="w-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
        <div class="size-1.5 animate-pulse rounded-full bg-primary"></div>
      </div>
      <div class="flex flex-1 flex-col gap-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-[10px]">
            <ClockIcon class="size-3 text-slate-400" />
            <span class="text-slate-500">{{
              $t('gateway.session.connectTime')
            }}</span>
          </div>
          <span class="font-mono text-[10px] text-slate-400">
            {{
              item.connectTime
                ? formatDate(new Date(item.connectTime), 'MM-DD HH:mm:ss')
                : '-'
            }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-[10px]">
            <ClockIcon class="size-3 text-primary opacity-70" />
            <span class="font-bold text-primary">{{
              $t('gateway.session.lastCommTime')
            }}</span>
          </div>
          <span class="font-mono text-[10px] font-bold text-primary">
            {{
              item.lastCommTime
                ? formatDate(new Date(item.lastCommTime), 'MM-DD HH:mm:ss')
                : '-'
            }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
