<script setup lang="ts">
import type { Dayjs } from 'dayjs';

import type { TrendChartEmits, TrendChartProps } from './types';

import { computed, onMounted, ref, unref } from 'vue';

import { useElementSize } from '@vueuse/core';
import { DatePicker, Radio, Skeleton } from 'ant-design-vue';
import dayjs from 'dayjs';

import { $t } from '#/locales';

import Chart from './Chart.vue';

const props = withDefaults(defineProps<TrendChartProps>(), {
  showDateShortcuts: true,
  immediate: true,
  loading: false,
});

const emit = defineEmits<TrendChartEmits>();

const RangePicker = DatePicker.RangePicker;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

// Layout handling
const containerRef = ref<HTMLDivElement>();
const { width } = useElementSize(containerRef);
const isWide = computed(() => width.value > 720);

// Date range state
const rangeValue = ref<[Dayjs, Dayjs]>([dayjs().subtract(1, 'hour'), dayjs()]);
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
  rangeValue.value = [start, end];
  triggerFetch();
}

function handleFooterShortcut(value: string) {
  // Simulate radio change event object for reuse
  handleShortcutChange({ target: { value } });
}

function handleRangeChange(dates: any) {
  if (dates) {
    rangeValue.value = dates;
    activeShortcut.value = ''; // Clear shortcut selection on manual change
    triggerFetch();
  }
}

// Data fetching
const internalLoading = ref(false);
const chartData = ref<any>(null);

async function triggerFetch() {
  const [start, end] = unref(rangeValue);
  const params = {
    endTime: end.valueOf(),
    startTime: start.valueOf(),
  };

  emit('rangeChange', params);

  if (props.api) {
    try {
      internalLoading.value = true;
      const res = await props.api(params);
      chartData.value = res;
    } finally {
      internalLoading.value = false;
    }
  }
}

const finalOptions = computed(() => {
  if (props.optionGenerator && chartData.value) {
    return props.optionGenerator(chartData.value);
  }
  // If API returned data but no generator, and data looks like an option, use it.
  if (
    chartData.value &&
    !props.optionGenerator &&
    typeof chartData.value === 'object'
  ) {
    return chartData.value;
  }
  return props.chartOptions;
});

// Initial fetch
onMounted(() => {
  if (props.immediate) {
    triggerFetch();
  }
});

// Expose computed loading state
const isLoading = computed(() => props.loading || internalLoading.value);
</script>

<template>
  <div
    ref="containerRef"
    class="flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-300"
  >
    <!-- Header -->
    <div
      class="mb-6 flex flex-wrap items-center justify-between gap-4"
      :class="{ 'flex-col items-stretch': !isWide }"
    >
      <div class="flex items-center gap-2">
        <div class="h-4 w-1 rounded-full bg-primary"></div>
        <span class="text-base font-medium">{{ title }}</span>
      </div>

      <div
        class="flex items-center gap-2"
        :class="{ 'w-full': !isWide, 'justify-end': isWide }"
      >
        <!-- Wide Mode: Shortcuts beside Picker -->
        <RadioGroup
          v-if="isWide && showDateShortcuts"
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
          v-model:value="rangeValue"
          show-time
          class="w-full sm:w-auto"
          @change="handleRangeChange"
        >
          <!-- Narrow Mode: Shortcuts in Footer -->
          <template v-if="!isWide && showDateShortcuts" #renderExtraFooter>
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
    </div>

    <!-- Content -->
    <div class="relative h-[300px] w-full overflow-hidden">
      <div
        v-if="isLoading"
        class="absolute inset-0 z-10 flex h-full flex-col justify-between bg-card"
      >
        <div class="px-2 pt-2">
          <Skeleton active :paragraph="{ rows: 1 }" />
        </div>
        <div
          class="flex h-[180px] items-end justify-between gap-2 px-2 pb-2 opacity-50"
        >
          <Skeleton.Button
            v-for="i in 12"
            :key="i"
            active
            shape="square"
            :style="{
              width: '8%',
              height: `${Math.random() * 60 + 20}%`,
            }"
          />
        </div>
      </div>
      <Chart v-show="!isLoading" :loading="isLoading" :options="finalOptions" />
    </div>
  </div>
</template>
