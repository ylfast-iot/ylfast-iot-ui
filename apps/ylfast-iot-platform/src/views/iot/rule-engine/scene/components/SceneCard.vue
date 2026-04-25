<script setup lang="ts">
import type { RuleEngineSceneApi } from '#/api/iot/rule-engine/scene';

import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { formatDate } from '@vueuse/core';
import { Popconfirm, Tooltip } from 'ant-design-vue';

import { getTriggerTypeName } from '../data';

const props = defineProps<{
  row: RuleEngineSceneApi.SceneEntity;
}>();

const emit = defineEmits<{
  click: [row: RuleEngineSceneApi.SceneEntity];
  delete: [row: RuleEngineSceneApi.SceneEntity];
  edit: [row: RuleEngineSceneApi.SceneEntity];
  toggleState: [row: RuleEngineSceneApi.SceneEntity];
}>();

const isActive = computed(() => props.row.state?.value === 'started');

// Formatted Time
const createTimeText = computed(() => {
  if (!props.row.createTime) return '-';
  return formatDate(new Date(props.row.createTime), 'YYYY-MM-DD');
});

// Icons
const EditIcon = createIconifyIcon('lucide:edit-3');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const ClockIcon = createIconifyIcon('lucide:clock');
const ZapIcon = createIconifyIcon('lucide:zap'); // Scene standard icon
const PowerIcon = createIconifyIcon('lucide:power');

// Status Badge Logic
const statusBadge = computed(() => {
  const gradientStops =
    'via-white via-[15%] to-white dark:via-[#151515] dark:via-[15%] dark:to-[#151515]';

  const stateValue = props.row.state?.value;

  if (stateValue === 'disable') {
    return {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20 backdrop-blur-md',
      text: 'text-rose-700 dark:text-rose-400',
      badgeBorder: 'border-rose-200/50 dark:border-rose-500/30',
      dot: 'bg-rose-500',
      label: $t('common.disabled', '已禁用'),
      fold: 'border-rose-800/20 dark:border-rose-500/40',
      cardBg: `from-rose-50 ${gradientStops} dark:from-rose-500/10`,
      hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-500/50',
    };
  }

  // started
  return {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 backdrop-blur-md',
    text: 'text-emerald-700 dark:text-emerald-400',
    badgeBorder: 'border-emerald-200/50 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
    label: $t('common.enabled', '已启用'),
    fold: 'border-emerald-800/20 dark:border-emerald-500/40',
    cardBg: `from-emerald-50 ${gradientStops} dark:from-emerald-500/10`,
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-500/50',
  };
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
            v-if="isActive"
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
        class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-indigo-50 text-indigo-600 transition-colors dark:bg-indigo-500/10 dark:text-indigo-400"
      >
        <ZapIcon class="h-6 w-6" stroke-width="2" />
      </div>

      <!-- Identity -->
      <div class="flex min-w-0 flex-col gap-0.5">
        <h3
          class="truncate pr-16 text-sm font-bold text-slate-900 dark:text-gray-100"
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
    <div class="group/body relative flex flex-1 flex-col gap-2 px-4 pb-3">
      <!-- Meta Row -->
      <div class="flex items-center justify-between gap-2 text-xs">
        <!-- Type -->
        <span
          class="truncate rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
          :title="row.triggerType"
        >
          {{ getTriggerTypeName(row.triggerType) }}
        </span>
      </div>

      <!-- Time Row -->
      <div class="flex items-center gap-1.5 text-xs text-slate-400">
        <ClockIcon class="size-3.5 shrink-0" />
        <span class="truncate">{{ createTimeText }}</span>
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
              ? $t('scene.action.confirmDisable', '确定要禁用此场景吗？')
              : $t('scene.action.confirmEnable', '确定要启用此场景吗？')
          "
          @click.stop
          @confirm.stop="emit('toggleState', row)"
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
            ? $t('scene.tips.disableBeforeDelete', '请先禁用后再删除')
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
