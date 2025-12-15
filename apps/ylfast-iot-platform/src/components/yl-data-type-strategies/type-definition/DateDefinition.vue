<script setup lang="ts">
import type { DateTypeDef } from '#/types/data-type';

import { computed, watch } from 'vue';

import { $t } from '@vben/locales';

import { AutoComplete, Form, FormItem, Select, Switch } from 'ant-design-vue';

const props = defineProps<{
  value: DateTypeDef;
}>();

const emit = defineEmits(['update:value', 'change']);

const model = computed({
  get: () => {
    const val = props.value;
    // Ensure date object exists
    if (!val.date) {
      val.date = {
        format: 'YYYY-MM-DD HH:mm:ss',
        mode: 'datetime',
        isRange: false,
        valueType: 'STRING',
      };
    }
    return val;
  },
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

const modeOptions = computed(() => [
  {
    label: $t('dataType.strategies.date.modes.datetime'),
    value: 'datetime',
  },
  { label: $t('dataType.strategies.date.modes.date'), value: 'date' },
  { label: $t('dataType.strategies.date.modes.time'), value: 'time' },
  { label: $t('dataType.strategies.date.modes.month'), value: 'month' },
  { label: $t('dataType.strategies.date.modes.year'), value: 'year' },
  { label: $t('dataType.strategies.date.modes.decade'), value: 'decade' },
]);

const valueTypeOptions = computed(() => [
  { label: $t('dataType.strategies.date.types.string'), value: 'STRING' },
  { label: $t('dataType.strategies.date.types.timestamp'), value: 'LONG' },
]);

const formatOptionsMap: Record<string, { label: string; value: string }[]> = {
  datetime: [
    { value: 'YYYY-MM-DD HH:mm:ss', label: 'YYYY-MM-DD HH:mm:ss' },
    { value: 'YYYY/MM/DD HH:mm:ss', label: 'YYYY/MM/DD HH:mm:ss' },
  ],
  date: [
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD' },
  ],
  time: [
    { value: 'HH:mm:ss', label: 'HH:mm:ss' },
    { value: 'HH:mm', label: 'HH:mm' },
  ],
  month: [
    { value: 'YYYY-MM', label: 'YYYY-MM' },
    { value: 'YYYY/MM', label: 'YYYY/MM' },
  ],
  year: [{ value: 'YYYY', label: 'YYYY' }],
  decade: [{ value: 'YYYY', label: 'YYYY' }],
};

const formatOptions = computed(() => {
  return formatOptionsMap[model.value.date.mode] || [];
});

watch(
  () => model.value.date.valueType,
  (val) => {
    if (val === 'LONG') {
      model.value.date.format = 'timestamp';
    } else if (model.value.date.format === 'timestamp') {
      // Restore default based on current mode
      const options = formatOptionsMap[model.value.date.mode];
      model.value.date.format = options?.[0]?.value || 'YYYY-MM-DD HH:mm:ss';
    }
  },
);

watch(
  () => model.value.date.mode,
  (newMode) => {
    // When mode changes, if not using LONG storage, reset format to the first valid option for that mode
    if (model.value.date.valueType !== 'LONG') {
      const options = formatOptionsMap[newMode];
      if (options && options.length > 0) {
        model.value.date.format = options[0].value;
      }
    }
  },
);
</script>

<template>
  <Form layout="vertical" :model="model">
    <FormItem :label="$t('dataType.strategies.date.displayMode')">
      <Select
        v-model:value="model.date.mode"
        :options="modeOptions"
        :placeholder="$t('dataType.strategies.date.placeholders.mode')"
      />
    </FormItem>
    <FormItem :label="$t('dataType.strategies.date.storageType')">
      <Select
        v-model:value="model.date.valueType"
        :options="valueTypeOptions"
        :placeholder="$t('dataType.strategies.date.placeholders.type')"
      />
    </FormItem>

    <FormItem
      v-if="model.date.valueType !== 'LONG'"
      :label="$t('dataType.strategies.date.format')"
    >
      <AutoComplete
        v-model:value="model.date.format"
        :options="formatOptions"
        :placeholder="$t('dataType.strategies.date.placeholders.format')"
        allow-clear
      />
    </FormItem>
    <FormItem :label="$t('dataType.strategies.date.rangeSelection')">
      <Switch
        v-model:checked="model.date.isRange"
        :checked-children="$t('dataType.strategies.boolean.defaultYes')"
        :un-checked-children="$t('dataType.strategies.boolean.defaultNo')"
      />
    </FormItem>
  </Form>
</template>
