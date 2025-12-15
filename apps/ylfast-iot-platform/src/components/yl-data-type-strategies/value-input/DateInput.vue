<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { DateTypeDef } from '#/types/data-type';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { DatePicker, TimePicker } from 'ant-design-vue';

import { getComponentProps, isDisabled } from '#/utils/config-metadata';

const props = defineProps<{
  prop: ConfigPropertyMetadata;
  value: any;
}>();
const emit = defineEmits(['update:value', 'change']);
const RangePicker = DatePicker.RangePicker;
const TimeRangePicker = TimePicker.RangePicker;

const typeDef = computed(() => props.prop.type as DateTypeDef);

const innerValue = computed({
  get: () => {
    const val = props.value;
    if (val === null || val === undefined) return undefined;

    if (isRange.value) {
      // RangePicker expects an array. If we have a single value (string/number), it's invalid.
      return Array.isArray(val) ? val : [];
    } else {
      // DatePicker expects a single value. If we have an array, it's invalid.
      return Array.isArray(val) ? undefined : val;
    }
  },
  set: (val) => {
    let finalVal = val;
    // When valueType is LONG, AntDV returns string 'x' (e.g. "1678888888888").
    // We need to convert it back to number for storage.
    if (valueType.value === 'LONG' && val) {
      finalVal = Array.isArray(val)
        ? val.map((v) => (v ? Number(v) : v))
        : Number(val);
    }
    emit('update:value', finalVal);
    emit('change', finalVal);
  },
});

const isRange = computed(() => typeDef.value.date?.isRange === true);
const mode = computed(() => typeDef.value.date?.mode || 'datetime');
const valueType = computed(() => typeDef.value.date?.valueType || 'STRING');
const format = computed(() => {
  const fmt = typeDef.value.date?.format;
  return !fmt || fmt === 'timestamp' ? 'YYYY-MM-DD HH:mm:ss' : fmt;
});

// AntDV DatePicker 'picker' prop: 'date' | 'week' | 'month' | 'quarter' | 'year'
// Our modes: 'datetime' | 'date' | 'time' | 'month' | 'year' | 'decade'
const picker = computed(() => {
  if (mode.value === 'datetime' || mode.value === 'time') return 'date'; // 'time' uses TimePicker, 'datetime' uses date+showTime
  if (mode.value === 'decade') return 'year'; // Fallback for decade
  return mode.value as any;
});

const showTime = computed(() => mode.value === 'datetime');

const valueFormat = computed(() => {
  if (valueType.value === 'LONG') return 'x'; // Timestamp in ms
  return format.value;
});

const componentIs = computed(() => {
  if (mode.value === 'time') {
    return isRange.value ? TimeRangePicker : TimePicker;
  }
  return isRange.value ? RangePicker : DatePicker;
});
</script>

<template>
  <component
    :is="componentIs"
    v-model:value="innerValue"
    class="w-full"
    :placeholder="
      isRange
        ? [
            $t('ylConfigMetadataForm.startTime'),
            $t('ylConfigMetadataForm.endTime'),
          ]
        : `${$t('ylConfigMetadataForm.pleaseSelect')}${prop.name}`
    "
    :value-format="valueFormat"
    :format="format"
    :show-time="showTime"
    :picker="mode !== 'time' ? picker : undefined"
    :disabled="isDisabled(prop)"
    allow-clear
    v-bind="getComponentProps(prop)"
  />
</template>
