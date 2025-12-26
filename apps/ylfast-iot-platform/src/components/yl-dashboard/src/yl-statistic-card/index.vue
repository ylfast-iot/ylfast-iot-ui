<script setup lang="ts">
import type { StatisticCardProps } from './types';

import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { Skeleton } from 'ant-design-vue';

import StatisticChart from './StatisticChart.vue';

const props = withDefaults(defineProps<StatisticCardProps>(), {
  loading: false,
  unit: '',
  variant: 'default',
  min: 0,
  max: 100,
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'error': {
      return 'bg-red-500/10 border-red-500/20 text-red-600';
    }
    case 'primary': {
      return 'bg-primary/10 border-primary/20 text-primary';
    }
    case 'success': {
      return 'bg-green-500/10 border-green-500/20 text-green-600';
    }
    case 'warning': {
      return 'bg-orange-500/10 border-orange-500/20 text-orange-600';
    }
    default: {
      return 'bg-card border-border text-foreground hover:shadow-md transition-shadow duration-300';
    }
  }
});

const MainIcon = computed(() => {
  return props.icon ? createIconifyIcon(props.icon) : null;
});

const TrendIcon = computed(() => {
  if (props.trend === 'up') {
    return createIconifyIcon('lucide:trending-up');
  }
  if (props.trend === 'down') {
    return createIconifyIcon('lucide:trending-down');
  }
  return createIconifyIcon('lucide:minus');
});

const trendColor = computed(() => {
  if (props.trend === 'up') {
    return 'text-green-500';
  }
  if (props.trend === 'down') {
    return 'text-red-500';
  }
  return 'text-muted-foreground';
});
</script>

<template>
  <div
    :class="variantClasses"
    class="relative flex min-h-[140px] flex-col justify-between overflow-hidden rounded-xl border p-5"
  >
    <template v-if="loading">
      <div class="flex items-start justify-between">
        <div class="space-y-2">
          <Skeleton.Button active size="small" style="width: 80px" />
          <Skeleton.Button active size="large" style="width: 120px" />
        </div>
        <div
          v-if="chartData"
          class="flex h-[100px] w-[140px] items-center justify-center"
        >
          <Skeleton.Avatar active :size="90" shape="circle" />
        </div>
        <Skeleton.Avatar v-else active shape="circle" size="large" />
      </div>
      <div class="mt-4">
        <Skeleton.Input active size="small" style="width: 100%" />
      </div>
    </template>

    <template v-else>
      <div class="flex items-start justify-between">
        <div class="relative z-10 flex flex-col gap-1 overflow-hidden">
          <span class="text-base font-medium text-muted-foreground">{{
            title
          }}</span>
          <div class="mt-2 flex items-baseline gap-1">
            <span class="text-4xl font-medium tracking-tight">{{ value }}</span>
            <span v-if="unit" class="text-sm text-muted-foreground">{{
              unit
            }}</span>
          </div>
        </div>

        <!-- Right Side: Gauge Chart -->
        <div
          v-if="chartData && chartData.length > 0"
          class="h-[100px] w-[140px] flex-shrink-0"
        >
          <StatisticChart
            :chart-data="chartData"
            :min="min"
            :max="max"
            :thresholds="thresholds"
            :unit="unit"
          />
        </div>

        <!-- Fallback Icon -->
        <div
          v-else-if="MainIcon"
          :class="iconBgColor || 'bg-background/80'"
          class="flex size-10 items-center justify-center rounded-lg"
        >
          <component
            :is="MainIcon"
            :class="iconColor || 'text-foreground'"
            class="size-5"
          />
        </div>
      </div>

      <div class="relative z-10 mt-2 flex items-center justify-between">
        <div v-if="trend || trendValue" class="flex items-center gap-1 text-xs">
          <span
            :class="trendColor"
            class="flex items-center gap-0.5 font-medium"
          >
            <component :is="TrendIcon" v-if="trend" class="size-3.5" />
            {{ trendValue }}
          </span>
          <span class="text-muted-foreground">较上周</span>
        </div>

        <div
          v-if="footerLabel || footerValue"
          class="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <div class="size-1.5 rounded-full bg-primary"></div>
          <span>{{ footerLabel }}</span>
          <div class="h-3 w-0.5 rounded-full bg-border"></div>
          <span class="font-medium text-foreground">{{ footerValue }}</span>
        </div>
      </div>
    </template>
  </div>
</template>
