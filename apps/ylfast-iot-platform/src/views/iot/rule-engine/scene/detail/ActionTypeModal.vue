<script setup lang="ts">
import type { SceneActionExecutor } from './types';

import type { RuleEngineSceneUtilsApi } from '#/api/iot/rule-engine/scene-utils';

import { computed, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { Modal } from 'ant-design-vue';

interface ActionTypeOption {
  accent: string;
  description: string;
  executor: SceneActionExecutor;
  icon: any;
  key: string;
  mode?: 'relieve' | 'trigger';
  provider: string;
  title: string;
}

const props = defineProps<{
  actionSupports: RuleEngineSceneUtilsApi.SceneActionInfo[];
  open: boolean;
  parallel: boolean;
}>();

const emit = defineEmits<{
  select: [executor: SceneActionExecutor, mode?: 'relieve' | 'trigger'];
  'update:open': [value: boolean];
}>();

const selected = ref('');

const actionRegistry: Record<
  string,
  Omit<ActionTypeOption, 'description' | 'title'> &
    Partial<Pick<ActionTypeOption, 'description' | 'title'>>
> = {
  delay: {
    accent: 'violet',
    executor: 'delay',
    icon: createIconifyIcon('lucide:timer-reset'),
    key: 'delay',
    provider: 'delay',
    title: '延迟执行',
  },
  device: {
    accent: 'indigo',
    executor: 'device',
    icon: createIconifyIcon('lucide:send'),
    key: 'device',
    provider: 'device',
    title: '设备输出',
  },
  'device-data': {
    accent: 'blue',
    executor: 'device-data',
    icon: createIconifyIcon('lucide:list-tree'),
    key: 'device-data',
    provider: 'device-data',
    title: '设备信息',
  },
  notify: {
    accent: 'sky',
    executor: 'notify',
    icon: createIconifyIcon('lucide:message-square'),
    key: 'notify',
    provider: 'notify',
    title: '消息通知',
  },
  relieve: {
    accent: 'cyan',
    executor: 'alarm',
    icon: createIconifyIcon('lucide:bell-off'),
    key: 'alarm-relieve',
    mode: 'relieve',
    provider: 'relieve',
    title: '解除告警',
  },
  trigger: {
    accent: 'amber',
    executor: 'alarm',
    icon: createIconifyIcon('lucide:bell-ring'),
    key: 'alarm-trigger',
    mode: 'trigger',
    provider: 'trigger',
    title: '触发告警',
  },
};

const actionTypes = computed<ActionTypeOption[]>(() => {
  const items: ActionTypeOption[] = [];

  props.actionSupports.forEach((support) => {
    const registered = actionRegistry[support.provider];
    if (!registered) return;
    items.push({
      ...registered,
      description: support.description || support.name,
      title: registered.title || support.name,
    });
  });

  return (
    props.parallel ? items.filter((item) => item.executor !== 'delay') : items
  ).filter(
    (item, index, list) =>
      list.findIndex((candidate) => candidate.key === item.key) === index,
  );
});

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    selected.value = actionTypes.value[0]?.key || '';
  },
);

function handleOk() {
  const item = actionTypes.value.find(
    (option) => option.key === selected.value,
  );
  if (!item) return;
  emit('select', item.executor, item.mode);
  emit('update:open', false);
}
</script>

<template>
  <Modal
    :body-style="{
      height: '60vh',
      overflowY: 'auto',
      paddingTop: '18px',
      paddingBottom: '18px',
    }"
    :open="open"
    title="动作类型"
    width="860px"
    @cancel="emit('update:open', false)"
    @ok="handleOk"
  >
    <div class="action-type-grid">
      <div
        v-for="item in actionTypes"
        :key="item.key"
        class="action-type-card"
        :class="[`accent-${item.accent}`, { active: selected === item.key }]"
        @click="selected = item.key"
      >
        <div class="action-type-icon-shell">
          <div class="action-type-icon-bg">
            <component :is="item.icon" class="action-type-icon" />
          </div>
        </div>
        <div class="action-type-content">
          <div class="action-type-title">{{ item.title }}</div>
          <div class="action-type-desc">{{ item.description }}</div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.action-type-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.action-type-card {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  min-height: 104px;
  padding: 20px 18px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d9dfea;
  border-radius: 10px;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.action-type-card:hover {
  background: #fafcff;
}

.action-type-card.active {
  background: #f8fbff;
  border-color: #1677ff;
}

.action-type-icon-shell {
  flex: 0 0 auto;
  padding-top: 2px;
}

.action-type-icon-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border: 1px solid transparent;
  border-radius: 14px;
}

.action-type-icon {
  width: 26px;
  height: 26px;
}

.action-type-content {
  min-width: 0;
  padding-top: 2px;
}

.action-type-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  color: #1f2937;
}

.action-type-desc {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: #6b7280;
}

.accent-blue .action-type-icon-bg {
  color: #1668dc;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.accent-violet .action-type-icon-bg {
  color: #6d28d9;
  background: #f5f3ff;
  border-color: #ddd6fe;
}

.accent-amber .action-type-icon-bg {
  color: #d97706;
  background: #fff7ed;
  border-color: #fed7aa;
}

.accent-cyan .action-type-icon-bg {
  color: #0891b2;
  background: #ecfeff;
  border-color: #a5f3fc;
}

.accent-indigo .action-type-icon-bg {
  color: #4338ca;
  background: #eef2ff;
  border-color: #c7d2fe;
}

.accent-sky .action-type-icon-bg {
  color: #0284c7;
  background: #f0f9ff;
  border-color: #bae6fd;
}

@media (max-width: 900px) {
  .action-type-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .action-type-grid {
    grid-template-columns: 1fr;
  }
}
</style>
