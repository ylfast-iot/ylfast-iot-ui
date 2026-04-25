<script setup lang="ts">
import type { RuleEngineAlarmConfigApi } from '#/api/iot';

import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Popconfirm, Tooltip } from 'ant-design-vue';

type AlarmStateLike =
  | null
  | RuleEngineAlarmConfigApi.AlarmState
  | undefined
  | { value?: RuleEngineAlarmConfigApi.AlarmState };

const props = defineProps<{
  levelMap?: Map<number | string, string>;
  row: RuleEngineAlarmConfigApi.AlarmConfigDetail;
  targetTypeMap?: Map<number | string, string>;
}>();

const emit = defineEmits<{
  delete: [row: RuleEngineAlarmConfigApi.AlarmConfigDetail];
  edit: [row: RuleEngineAlarmConfigApi.AlarmConfigDetail];
  toggleState: [row: RuleEngineAlarmConfigApi.AlarmConfigDetail];
}>();

const EditIcon = createIconifyIcon('lucide:edit-3');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const ToggleIcon = createIconifyIcon('lucide:power');
const BellIcon = createIconifyIcon('lucide:shield-alert');
const FolderIcon = createIconifyIcon('lucide:folder');
const LayersIcon = createIconifyIcon('lucide:layers-3');
const WorkflowIcon = createIconifyIcon('lucide:workflow');

/**
 * 兼容字符串态和字典态的状态值。
 */
function resolveStateValue(state?: AlarmStateLike) {
  if (typeof state === 'string') {
    return state;
  }

  return state?.value || 'disabled';
}

const isEnabled = computed(
  () => resolveStateValue(props.row.state) === 'enabled',
);

const statusBadge = computed(() => {
  const gradientStops =
    'via-white via-[15%] to-white dark:via-[#151515] dark:via-[15%] dark:to-[#151515]';

  if (!isEnabled.value) {
    return {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20 backdrop-blur-md',
      border: 'border-rose-200/50 dark:border-rose-500/30',
      cardBg: `from-rose-100/40 ${gradientStops} dark:from-rose-500/10`,
      dot: 'bg-rose-500',
      fold: 'border-rose-800/20 dark:border-rose-500/40',
      label: $t('common.disable'),
      text: 'text-rose-700 dark:text-rose-400',
      toggleLabel: $t('common.enable'),
    };
  }

  return {
    bg: 'bg-primary/10 backdrop-blur-md',
    border: 'border-primary/30',
    cardBg: `from-primary/10 ${gradientStops} dark:from-primary/10`,
    dot: 'bg-primary',
    fold: 'border-primary/40',
    label: $t('common.enable'),
    text: 'text-primary',
    toggleLabel: $t('common.disable'),
  };
});

const iconStyle = computed(() => {
  return isEnabled.value
    ? 'bg-primary/10 text-primary'
    : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
});

const targetTypeText = computed(() => {
  return (
    props.targetTypeMap?.get(props.row.targetType) ||
    props.row.targetType ||
    '-'
  );
});

const levelText = computed(() => {
  return props.levelMap?.get(props.row.level) || props.row.level || '-';
});

const sceneNameText = computed(() => props.row.sceneName || '-');

/**
 * 获取启用状态切换确认文案。
 */
const toggleConfirmTitle = computed(() => {
  return isEnabled.value ? '确认禁用该告警配置吗？' : '确认启用该告警配置吗？';
});
</script>

<template>
  <div
    class="group relative flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white bg-gradient-to-br shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg dark:border-gray-800 dark:bg-[#151515]"
    :class="statusBadge.cardBg"
  >
    <div class="absolute -right-1 top-3 z-20">
      <div
        class="relative flex items-center gap-1.5 rounded-l-md border-y border-l px-2.5 py-0.5 text-[10px] font-bold shadow-sm"
        :class="[statusBadge.bg, statusBadge.border, statusBadge.text]"
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

    <div class="flex items-center gap-3 px-4 pb-2 pt-4">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-colors"
        :class="iconStyle"
      >
        <BellIcon class="h-5 w-5" stroke-width="2" />
      </div>

      <div class="flex min-w-0 flex-col gap-0.5">
        <div class="flex items-center gap-2">
          <h3
            class="truncate pr-1 text-sm font-bold text-slate-900 dark:text-gray-100"
            :title="row.name"
          >
            {{ row.name }}
          </h3>
          <span
            class="shrink-0 rounded px-1.5 py-px text-[9px] font-bold tracking-wider"
            :class="
              isEnabled
                ? 'bg-primary/10 text-primary'
                : 'bg-slate-200/80 text-slate-500 dark:bg-slate-700/80 dark:text-slate-300'
            "
          >
            {{ levelText }}
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

    <div class="relative flex flex-1 flex-col gap-2 px-4 pb-3">
      <div class="flex items-center justify-between gap-2 text-xs">
        <div
          class="flex min-w-0 flex-1 items-center gap-1.5 text-slate-600 dark:text-gray-400"
        >
          <FolderIcon class="size-3.5 shrink-0 text-slate-400" />
          <span class="truncate" :title="targetTypeText">
            {{ targetTypeText }}
          </span>
        </div>

        <span
          class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
          :class="
            isEnabled
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          "
        >
          {{ sceneNameText }}
        </span>
      </div>

      <div class="flex items-center justify-between gap-2">
        <div
          class="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800/80"
        >
          <WorkflowIcon class="size-3 shrink-0 text-slate-500" />
          <span
            class="max-w-[180px] truncate text-[10px] text-slate-500 dark:text-gray-400"
          >
            {{ sceneNameText }}
          </span>
        </div>

        <div
          class="flex shrink-0 items-center gap-1.5 text-[10px] text-slate-400"
        >
          <BellIcon class="size-3 shrink-0 opacity-70" />
          <span class="truncate">{{ levelText }}</span>
        </div>
      </div>

      <div class="mt-1 flex-1 rounded bg-slate-50 p-2 dark:bg-slate-800/50">
        <div class="mb-1 flex items-start gap-2">
          <LayersIcon class="mt-0.5 size-3.5 shrink-0 text-slate-400" />
          <p
            class="line-clamp-2 text-[10px] leading-relaxed text-slate-500 dark:text-gray-400"
            :title="row.description"
          >
            {{ row.description || $t('common.noDescription') }}
          </p>
        </div>
      </div>
    </div>

    <div
      class="mt-auto flex h-9 cursor-default items-center divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/30 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/30"
      @click.stop
    >
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

      <Tooltip :title="statusBadge.toggleLabel">
        <Popconfirm
          :title="toggleConfirmTitle"
          @click.stop
          @confirm.stop="emit('toggleState', row)"
        >
          <div
            class="group/btn flex flex-1 cursor-pointer items-center justify-center transition-colors hover:bg-white dark:hover:bg-gray-800"
            :class="
              isEnabled
                ? 'text-primary hover:text-primary/80'
                : 'text-slate-400 hover:text-primary'
            "
          >
            <ToggleIcon
              class="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110"
            />
          </div>
        </Popconfirm>
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
