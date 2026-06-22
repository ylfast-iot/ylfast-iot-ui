<script setup lang="ts">
import type { SceneAction } from '#/api/iot/rule-engine/types';

import { reactive, watch } from 'vue';

import { InputNumber, Modal, Select } from 'ant-design-vue';

const props = defineProps<{
  action?: SceneAction;
  actionId: number;
  open: boolean;
}>();

const emit = defineEmits<{
  save: [value: SceneAction];
  'update:open': [value: boolean];
}>();

const form = reactive({
  time: 1,
  unit: 'minutes' as 'hours' | 'minutes' | 'seconds',
});

const unitLabelMap = {
  hours: '小时',
  minutes: '分钟',
  seconds: '秒',
};

watch(
  () => props.open,
  () => {
    form.time = props.action?.delay?.time || 1;
    form.unit = props.action?.delay?.unit || 'minutes';
  },
);

function handleOk() {
  emit('save', {
    actionId: props.action?.actionId || props.actionId,
    delay: { time: Number(form.time), unit: form.unit },
    executor: 'delay',
    options: {
      name: '延迟执行',
      summary: `${form.time}${unitLabelMap[form.unit]}后，执行后续动作`,
    },
    terms: props.action?.terms || [],
  });
  emit('update:open', false);
}
</script>

<template>
  <Modal
    :open="open"
    title="延迟执行"
    width="460px"
    :mask-closable="false"
    :body-style="{ height: '240px', paddingTop: '18px' }"
    @cancel="emit('update:open', false)"
    @ok="handleOk"
  >
    <div class="delay-form-row">
      <div class="delay-form-label">
        <span class="required-mark">*</span>
        <span>等待时间</span>
      </div>
      <div class="delay-form-content">
        <InputNumber
          v-model:value="form.time"
          :min="0.001"
          :precision="3"
          class="w-40"
          name="delayActionTime"
        />
        <Select
          v-model:value="form.unit"
          class="w-32"
          :options="[
            { label: '秒', value: 'seconds' },
            { label: '分钟', value: 'minutes' },
            { label: '小时', value: 'hours' },
          ]"
        />
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.delay-form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.delay-form-label {
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

.delay-form-content {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
