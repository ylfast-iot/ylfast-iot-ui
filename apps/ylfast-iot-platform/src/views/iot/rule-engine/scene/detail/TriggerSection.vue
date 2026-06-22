<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import type { SceneRuleModel } from './types';

import type { RuleEngineSceneUtilsApi } from '#/api/iot/rule-engine/scene-utils';
import type { DeviceTrigger, TimerTrigger } from '#/api/iot/rule-engine/types';

import { computed, ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { Button, Input, Tag } from 'ant-design-vue';

import DeviceTriggerModal from './DeviceTriggerModal.vue';
import TimerTriggerModal from './TimerTriggerModal.vue';

interface SummaryItem {
  key: string;
  label: string;
  value: string;
}

const props = defineProps<{
  scene: SceneRuleModel;
  termColumns: RuleEngineSceneUtilsApi.TermColumn[];
  triggerSupports: RuleEngineSceneUtilsApi.SceneTriggerInfo[];
}>();

const emit = defineEmits<{
  changed: [];
  'update:scene': [value: SceneRuleModel];
}>();

const TriggerIcon = createIconifyIcon('lucide:zap');
const deviceModalOpen = ref(false);
const timerModalOpen = ref(false);

const triggerName = computed(() => {
  return (
    props.triggerSupports.find(
      (item) => item.provider === props.scene.trigger.type,
    )?.name || props.scene.trigger.type
  );
});

const summaryItems = computed<SummaryItem[]>(() => {
  const triggerOptions: any = props.scene.options?.trigger || {};

  if (props.scene.trigger.type === 'manual') {
    return [{ key: 'manual', label: '触发', value: '手动触发' }];
  }

  if (props.scene.trigger.type === 'device') {
    const device = props.scene.trigger.device;
    if (!device) {
      return [
        { key: 'device', label: '触发规则', value: '未配置设备触发规则' },
      ];
    }

    const targetName =
      (device.selectorValues || [])
        .map((item: any) => item?.name || item?.value)
        .filter(Boolean)
        .join(' / ') ||
      triggerOptions.deviceName ||
      triggerOptions.selectorName ||
      device.selector ||
      '设备';

    return [
      { key: 'target', label: '设备', value: targetName },
      {
        key: 'product',
        label: '产品',
        value: triggerOptions.productName || device.productId || '-',
      },
      {
        key: 'operation',
        label: '触发',
        value: triggerOptions.triggerName || device.operation?.operator || '-',
      },
    ];
  }

  if (props.scene.trigger.type === 'timer') {
    const timer = props.scene.trigger.timer;
    if (!timer) {
      return [{ key: 'timer', label: '触发规则', value: '未配置定时规则' }];
    }
    if (timer.cron) {
      return [{ key: 'cron', label: 'Cron', value: timer.cron }];
    }
    if (timer.once?.time) {
      return [{ key: 'once', label: '单次', value: timer.once.time }];
    }
    if (timer.period) {
      return [
        {
          key: 'period',
          label: '周期',
          value: `每 ${timer.period.every} ${timer.period.unit || 'minutes'} 执行`,
        },
      ];
    }
    return [{ key: 'timer', label: '触发规则', value: '已配置定时规则' }];
  }

  return [{ key: 'trigger', label: '触发', value: triggerName.value }];
});

function saveDeviceTrigger(
  device: DeviceTrigger,
  options: Record<string, unknown>,
) {
  props.scene.trigger = { ...props.scene.trigger, device, type: 'device' };
  props.scene.options = {
    ...props.scene.options,
    trigger: options,
  };
  emit('update:scene', props.scene);
  emit('changed');
}

function saveTimerTrigger(timer: TimerTrigger) {
  props.scene.trigger = { ...props.scene.trigger, timer, type: 'timer' };
  emit('update:scene', props.scene);
  emit('changed');
}

function updateCustomConfiguration(value: string) {
  try {
    props.scene.trigger.configuration = JSON.parse(value || '{}');
    emit('update:scene', props.scene);
    emit('changed');
  } catch {
    props.scene.trigger.configuration = { raw: value };
  }
}
</script>

<template>
  <section class="trigger-section">
    <div class="section-title">
      <TriggerIcon class="size-4 text-primary" />
      <span>触发规则</span>
    </div>

    <div class="trigger-content">
      <div class="trigger-summary-row">
        <div class="trigger-summary-card">
          <div
            v-for="item in summaryItems"
            :key="item.key"
            class="trigger-summary-item"
          >
            <span class="trigger-summary-label">{{ item.label }}</span>
            <span class="trigger-summary-value">{{ item.value }}</span>
          </div>
          <Tag color="default">{{ triggerName }}</Tag>
        </div>

        <Button
          v-if="scene.trigger.type === 'device'"
          type="primary"
          @click="deviceModalOpen = true"
        >
          配置触发规则
        </Button>
        <Button
          v-else-if="scene.trigger.type === 'timer'"
          type="primary"
          @click="timerModalOpen = true"
        >
          配置触发规则
        </Button>
      </div>

      <div
        v-if="!['manual', 'device', 'timer'].includes(scene.trigger.type)"
        class="custom-config"
      >
        <Input.TextArea
          :auto-size="{ minRows: 5, maxRows: 10 }"
          :value="JSON.stringify(scene.trigger.configuration || {}, null, 2)"
          @change="
            updateCustomConfiguration(
              ($event.target as HTMLTextAreaElement).value,
            )
          "
        />
      </div>
    </div>

    <DeviceTriggerModal
      v-model:open="deviceModalOpen"
      :device="scene.trigger.device"
      @save="saveDeviceTrigger"
    />
    <TimerTriggerModal
      v-model:open="timerModalOpen"
      :timer="scene.trigger.timer"
      @save="saveTimerTrigger"
    />
  </section>
</template>

<style scoped>
.trigger-section {
  padding: 0;
  background: #fff;
}

.section-title {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
}

.trigger-content {
  padding: 0 16px 8px;
  background: #fafafa;
}

.trigger-summary-row {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
}

.trigger-summary-card {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  min-height: 40px;
}

.trigger-summary-item {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  color: #595959;
  background: #fff;
  border-radius: 17px;
}

.trigger-summary-label {
  font-size: 12px;
  color: #8c8c8c;
}

.trigger-summary-value {
  font-weight: 500;
  color: #262626;
}

.custom-config {
  padding: 4px 0 0;
}
</style>
