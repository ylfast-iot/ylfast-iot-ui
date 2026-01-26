<script setup lang="ts">
import type { Dayjs } from 'dayjs';

import type { TrendChartEmits, TrendChartProps } from './types';

import { computed, onMounted, ref, unref } from 'vue';

import { useElementSize } from '@vueuse/core';
import { Skeleton } from 'ant-design-vue';
import dayjs from 'dayjs';

import { YlDateRangePicker } from '#/components/yl-date-range-picker';

import Chart from './Chart.vue';

const props = withDefaults(defineProps<TrendChartProps>(), {
  showDateShortcuts: true,
  immediate: true,
  loading: false,
});

const emit = defineEmits<TrendChartEmits>();

// Layout handling
const containerRef = ref<HTMLDivElement>();
const { width } = useElementSize(containerRef);
const isWide = computed(() => width.value > 1020);

// Date range state
const rangeValue = ref<[Dayjs, Dayjs]>([dayjs().subtract(1, 'hour'), dayjs()]);

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
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <div class="h-4 w-1 rounded-full bg-primary"></div>
        <span class="text-base font-medium">{{ title }}</span>
      </div>

      <div class="flex items-center gap-2" :class="{ 'justify-end': isWide }">
        <YlDateRangePicker
          v-model:value="rangeValue"
          :is-wide="isWide"
          :show-shortcuts="showDateShortcuts"
          class="w-full sm:w-auto"
          @change="triggerFetch"
        />
      </div>
    </div>

    <!-- Content -->
    <div class="relative flex w-full flex-1 overflow-hidden">
      <div v-if="isLoading" class="flex h-full flex-col justify-between">
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
              width: '6%',
              height: `${Math.random() * 60 + 20}%`,
            }"
          />
        </div>
      </div>
      <Chart v-else :loading="isLoading" :options="finalOptions" />
    </div>
  </div>
</template>
