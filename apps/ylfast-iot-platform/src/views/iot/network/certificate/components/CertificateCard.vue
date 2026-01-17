<script setup lang="ts">
import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { formatDate } from '@vueuse/core';
import { Popconfirm, Tooltip } from 'ant-design-vue';

import {
  CERTIFICATE_AUTH_METHOD_ENUMS,
  CERTIFICATE_FORMAT_ENUMS,
  CERTIFICATE_MODE_ENUMS,
  CERTIFICATE_TYPE_ENUMS,
} from '#/enums/certificate';

const props = defineProps<{
  row: any;
}>();

const emit = defineEmits<{
  click: [row: any];
  delete: [row: any];
  edit: [row: any];
  view: [row: any];
}>();

// Icons
const EditIcon = createIconifyIcon('lucide:edit-3');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const EyeIcon = createIconifyIcon('lucide:eye');
const CertificateIcon = createIconifyIcon('lucide:file-badge-2');
const ShieldIcon = createIconifyIcon('lucide:shield-check');
const ClockIcon = createIconifyIcon('lucide:clock');
const FileKeyIcon = createIconifyIcon('lucide:file-key');

// Formatted Time
const createTimeText = computed(() => {
  if (!props.row.createTime) return '-';
  return formatDate(new Date(props.row.createTime), 'YYYY-MM-DD');
});

// Mode Config (Server vs Client)
const modeConfig = computed(() => {
  const isServer = props.row.mode === 'server';
  const gradientStops =
    'via-white via-[15%] to-white dark:via-[#151515] dark:via-[15%] dark:to-[#151515]';

  if (isServer) {
    return {
      bg: 'bg-primary/10 backdrop-blur-md',
      text: 'text-primary',
      border: 'border-primary/30',
      dot: 'bg-primary',
      fold: 'border-primary/40',
      cardBg: `from-primary/10 ${gradientStops} dark:from-primary/10`,
      iconBg: 'bg-primary/10 text-primary',
    };
  }

  // Client
  return {
    bg: 'bg-orange-500/10 backdrop-blur-md',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
    dot: 'bg-orange-500',
    fold: 'border-orange-600/40',
    cardBg: `from-orange-500/10 ${gradientStops} dark:from-orange-500/10`,
    iconBg:
      'bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400',
  };
});

// Format Badge Info
const formatInfo = computed(() => {
  return (
    CERTIFICATE_FORMAT_ENUMS[
      props.row.format as keyof typeof CERTIFICATE_FORMAT_ENUMS
    ] || CERTIFICATE_FORMAT_ENUMS.PEM
  );
});
</script>

<template>
  <div
    class="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-slate-200 bg-white bg-gradient-to-br shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg dark:border-gray-800 dark:bg-[#151515]"
    :class="modeConfig.cardBg"
    @click="emit('click', row)"
  >
    <!-- Ribbon Status Indicator (Mode) -->
    <div class="absolute -right-1 top-3 z-20">
      <div
        class="relative flex items-center gap-1.5 rounded-l-md border-y border-l px-2.5 py-0.5 text-[10px] font-bold shadow-sm"
        :class="[modeConfig.bg, modeConfig.text, modeConfig.border]"
      >
        <span class="relative flex h-1.5 w-1.5">
          <span
            class="relative inline-flex h-1.5 w-1.5 rounded-full"
            :class="modeConfig.dot"
          ></span>
        </span>
        {{
          CERTIFICATE_MODE_ENUMS[
            row.mode as keyof typeof CERTIFICATE_MODE_ENUMS
          ]?.label
        }}

        <div
          class="absolute -bottom-[4px] right-0 h-0 w-0 border-l-[4px] border-t-[4px] border-l-transparent"
          :class="modeConfig.fold"
        ></div>
      </div>
    </div>

    <!-- Header Row -->
    <div class="flex items-center gap-3 px-4 pb-2 pt-4">
      <!-- Icon -->
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-colors"
        :class="modeConfig.iconBg"
      >
        <CertificateIcon class="h-5 w-5" stroke-width="2" />
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
          <!-- Format Badge -->
          <span
            class="shrink-0 rounded px-1.5 py-px text-[9px] font-bold tracking-wider transition-all"
            :class="[
              row.format === 'PFX'
                ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
                : row.format === 'JKS'
                  ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400',
            ]"
          >
            {{ formatInfo.label }}
          </span>
        </div>
        <p class="truncate font-mono text-[10px] text-slate-400">
          {{
            CERTIFICATE_TYPE_ENUMS[
              row.type as keyof typeof CERTIFICATE_TYPE_ENUMS
            ]?.label
          }}
        </p>
      </div>
    </div>

    <!-- Body Content -->
    <div class="relative flex flex-1 flex-col gap-2 px-4 pb-3">
      <!-- Technical Meta Row -->
      <div class="flex items-center justify-between gap-2 text-xs">
        <!-- Auth Method -->
        <div
          class="flex min-w-0 flex-1 items-center gap-1.5 text-slate-600 dark:text-gray-400"
        >
          <ShieldIcon class="size-3.5 shrink-0 text-slate-400" />
          <span>{{
            CERTIFICATE_AUTH_METHOD_ENUMS[
              row.authenticationMethod as keyof typeof CERTIFICATE_AUTH_METHOD_ENUMS
            ]?.label
          }}</span>
        </div>

        <!-- Encryption details (Placeholder or extra info) -->
        <div class="flex items-center gap-1 text-[10px] text-slate-400">
          <FileKeyIcon class="size-3" />
          <span>{{ $t('certificate.tips.configured') }}</span>
        </div>
      </div>

      <!-- Time Row -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 text-[10px] text-slate-400">
          <ClockIcon class="size-3 shrink-0 opacity-70" />
          <span>{{ createTimeText }}</span>
        </div>
      </div>

      <!-- Description Box -->
      <div class="mt-1 flex-1 rounded bg-slate-50 p-2 dark:bg-slate-800/50">
        <p
          class="line-clamp-2 text-[10px] leading-relaxed text-slate-500 dark:text-gray-400"
          :title="row.description"
        >
          {{ row.description || $t('common.noDescription') }}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="mt-auto flex h-9 cursor-default items-center divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/30 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/30"
      @click.stop
    >
      <Tooltip :title="$t('common.action.view')">
        <div
          class="group/btn flex flex-1 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:bg-white hover:text-blue-500 dark:hover:bg-gray-800"
          @click.stop="emit('view', row)"
        >
          <EyeIcon
            class="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110"
          />
        </div>
      </Tooltip>

      <Tooltip :title="$t('common.action.edit')">
        <div
          class="group/btn flex flex-1 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:bg-white hover:text-primary dark:hover:bg-gray-800"
          @click.stop="emit('edit', row)"
        >
          <EditIcon
            class="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110"
          />
        </div>
      </Tooltip>

      <Tooltip :title="$t('common.action.delete')">
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
