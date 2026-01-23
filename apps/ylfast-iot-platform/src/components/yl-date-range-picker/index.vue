<script setup lang="ts">
import type { Dayjs } from 'dayjs';

import { computed, ref } from 'vue';

import { DatePicker, Radio } from 'ant-design-vue';
import dayjs from 'dayjs';

import { $t } from '#/locales';

const props = withDefaults(
  defineProps<{
    align?: 'center' | 'end' | 'start';
    isWide?: boolean;
    showShortcuts?: boolean;
  }>(),
  {
    align: 'end',
    isWide: false,
    showShortcuts: true,
  },
);

const emit = defineEmits<{
  (e: 'change', dates: [Dayjs, Dayjs]): void;
}>();

const modelValue = defineModel<[Dayjs, Dayjs]>('value', { required: true });

const RangePicker = DatePicker.RangePicker;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const alignClass = computed(() => {
  if (props.align === 'start')
    return props.isWide ? 'justify-start' : 'items-start';
  if (props.align === 'center')
    return props.isWide ? 'justify-center' : 'items-center';
  return props.isWide ? 'justify-end' : 'items-end';
});

// Shortcuts state
const activeShortcut = ref<string>('1h');

// Shortcuts definition
const shortcuts = computed(() => [
  { label: $t('dashboard.chart.shortcuts.1h'), value: '1h' },
  { label: $t('dashboard.chart.shortcuts.24h'), value: '24h' },
  { label: $t('dashboard.chart.shortcuts.7d'), value: '7d' },
  { label: $t('dashboard.chart.shortcuts.1m'), value: '1m' },
]);

function handleShortcutChange(e: any) {
  const value = e.target.value;
  activeShortcut.value = value;
  const end = dayjs();
  let start = dayjs();

  switch (value) {
    case '1h': {
      start = end.subtract(1, 'hour');
      break;
    }
    case '1m': {
      start = end.subtract(1, 'month');
      break;
    }
    case '7d': {
      start = end.subtract(7, 'day');
      break;
    }
    case '24h': {
      start = end.subtract(24, 'hour');
      break;
    }
  }
  modelValue.value = [start, end];
  emit('change', [start, end]);
}

function handleFooterShortcut(value: string) {
  handleShortcutChange({ target: { value } });
}

function handleRangeChange(dates: any) {
  if (dates) {
    modelValue.value = dates;
    activeShortcut.value = ''; // Clear shortcut selection on manual change
    emit('change', dates);
  }
}
</script>

<template>
  <div class="flex items-center gap-2" :class="[alignClass]">
    <!-- Wide Mode: Shortcuts beside Picker -->
    <RadioGroup
      v-if="isWide && props.showShortcuts"
      v-model:value="activeShortcut"
      button-style="solid"
      @change="handleShortcutChange"
    >
      <RadioButton
        v-for="item in shortcuts"
        :key="item.value"
        :value="item.value"
      >
        {{ item.label }}
      </RadioButton>
    </RadioGroup>

    <!-- Date Picker -->
    <RangePicker
      v-model:value="modelValue"
      show-time
      class="w-full sm:w-auto"
      @change="handleRangeChange"
    >
      <!-- Narrow Mode: Shortcuts in Footer -->
      <template v-if="!isWide && props.showShortcuts" #renderExtraFooter>
        <div class="flex flex-wrap gap-2 p-2">
          <a
            v-for="item in shortcuts"
            :key="item.value"
            class="rounded bg-accent px-3 py-1 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
            :class="{
              'bg-primary text-primary-foreground':
                activeShortcut === item.value,
            }"
            @click="handleFooterShortcut(item.value)"
          >
            {{ item.label }}
          </a>
        </div>
      </template>
    </RangePicker>
  </div>
</template>
