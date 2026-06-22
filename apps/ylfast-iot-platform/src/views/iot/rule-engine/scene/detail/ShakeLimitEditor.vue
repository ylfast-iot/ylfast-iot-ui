<script setup lang="ts">
import type { ShakeLimit } from '#/api/iot/rule-engine/types';

import { computed } from 'vue';

import { InputNumber, RadioGroup, Switch } from 'ant-design-vue';

const props = defineProps<{
  value?: ShakeLimit;
}>();

const emit = defineEmits<{
  changed: [];
  'update:value': [value: ShakeLimit];
}>();

const model = computed<ShakeLimit>(() => ({
  alarmFirst: false,
  enabled: false,
  threshold: 1,
  time: 1,
  ...props.value,
}));

const alarmFirst = computed<boolean>({
  get() {
    return !!model.value.alarmFirst;
  },
  set(value) {
    emitValue({
      alarmFirst: value,
      outputFirst: value,
    });
  },
});

function emitValue(patch: Partial<ShakeLimit>) {
  emit('update:value', {
    ...model.value,
    ...patch,
  });
  emit('changed');
}

function updateEnabled(enabled: boolean) {
  emitValue({
    enabled,
    ...(enabled
      ? {}
      : {
          alarmFirst: false,
          outputFirst: true,
          threshold: model.value.threshold || 1,
          time: model.value.time || 1,
        }),
  });
}
</script>

<template>
  <div class="shake-limit-row">
    <div class="shake-limit-label">执行</div>
    <Switch
      :checked="!!model.enabled"
      checked-children="开启防抖"
      un-checked-children="关闭防抖"
      size="small"
      @update:checked="updateEnabled"
    />

    <template v-if="model.enabled">
      <InputNumber
        :min="1"
        name="sceneShakeLimitTime"
        :precision="0"
        :value="model.time"
        class="shake-limit-number"
        size="small"
        @update:value="emitValue({ time: Number($event || 1) })"
      />
      <span class="shake-limit-text">秒内发送</span>
      <InputNumber
        :max="100"
        :min="1"
        name="sceneShakeLimitThreshold"
        :precision="0"
        :value="model.threshold"
        class="shake-limit-number"
        size="small"
        @update:value="emitValue({ threshold: Number($event || 1) })"
      />
      <span class="shake-limit-text">次及以上时，处理</span>
      <RadioGroup
        name="sceneShakeLimitStrategy"
        :options="[
          { label: '第一次', value: true },
          { label: '最后一次', value: false },
        ]"
        :value="alarmFirst"
        option-type="button"
        size="small"
        @update:value="alarmFirst = !!$event"
      />
    </template>
  </div>
</template>

<style scoped>
.shake-limit-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
  min-height: 32px;
  padding: 0 0 14px;
}

.shake-limit-label {
  display: inline-flex;
  align-items: center;
  font-weight: 600;
  color: #262626;
}

.shake-limit-number {
  width: 54px;
}

.shake-limit-text {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  color: #595959;
}

.shake-limit-row :deep(.ant-switch),
.shake-limit-row :deep(.ant-input-number),
.shake-limit-row :deep(.ant-radio-group) {
  vertical-align: middle;
}

.shake-limit-row :deep(.ant-input-number-handler-wrap) {
  display: none;
}

.shake-limit-row :deep(.ant-radio-button-wrapper) {
  padding-inline: 14px;
}
</style>
