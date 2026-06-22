<script setup lang="ts">
import type { TimerTrigger } from '#/api/iot/rule-engine/types';

import { reactive, watch } from 'vue';

import { Form, Input, InputNumber, Modal, Radio, Select } from 'ant-design-vue';

const props = defineProps<{
  open: boolean;
  timer?: TimerTrigger;
}>();

const emit = defineEmits<{
  save: [value: TimerTrigger];
  'update:open': [value: boolean];
}>();

const form = reactive({
  cron: '',
  every: 1,
  mode: 'cron',
  onceTime: '',
  unit: 'minutes',
});

watch(
  () => props.open,
  () => {
    const timer = props.timer || {};
    form.mode = timer.cron ? 'cron' : (timer.once ? 'once' : 'period');
    form.cron = timer.cron || '';
    form.onceTime = timer.once?.time || '';
    form.every = timer.period?.every || 1;
    form.unit = timer.period?.unit || 'minutes';
  },
);

function handleOk() {
  const timer: TimerTrigger =
    form.mode === 'cron'
      ? { cron: form.cron, trigger: 'cron' }
      : (form.mode === 'once'
        ? { once: { time: form.onceTime }, trigger: 'cron' }
        : {
            period: { every: Number(form.every || 1), unit: form.unit },
            trigger: 'cron',
          });
  emit('save', timer);
  emit('update:open', false);
}
</script>

<template>
  <Modal
    :open="open"
    title="定时触发"
    width="680px"
    :mask-closable="false"
    @cancel="emit('update:open', false)"
    @ok="handleOk"
  >
    <Form layout="vertical">
      <Form.Item label="触发模式" required>
        <Radio.Group v-model:value="form.mode" name="timerTriggerMode">
          <Radio.Button value="cron">Cron</Radio.Button>
          <Radio.Button value="period">周期</Radio.Button>
          <Radio.Button value="once">单次</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item v-if="form.mode === 'cron'" label="Cron 表达式" required>
        <Input
          v-model:value="form.cron"
          name="timerTriggerCron"
          placeholder="例如：0 0/5 * * * ?"
        />
      </Form.Item>

      <div v-if="form.mode === 'period'" class="timer-period-row">
        <div class="timer-period-label">
          <span class="required-mark">*</span>
          <span>执行周期</span>
        </div>
        <div class="timer-period-content">
          <InputNumber
            v-model:value="form.every"
            :min="1"
            class="w-32"
            name="timerTriggerEvery"
          />
          <Select
            v-model:value="form.unit"
            class="w-36"
            :options="[
              { label: '秒', value: 'seconds' },
              { label: '分钟', value: 'minutes' },
              { label: '小时', value: 'hours' },
            ]"
          />
        </div>
      </div>

      <Form.Item v-if="form.mode === 'once'" label="执行时间" required>
        <Input
          v-model:value="form.onceTime"
          name="timerTriggerOnceTime"
          placeholder="例如：2026-04-25 10:00:00"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

<style scoped>
.timer-period-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timer-period-label {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-weight: 500;
  color: #262626;
}

.required-mark {
  line-height: 1;
  color: #ff4d4f;
}

.timer-period-content {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
