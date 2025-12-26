<script setup lang="ts">
import type { Subscription } from 'rxjs';

import type { DashboardApi } from '#/api/dashboard';
import type { DashboardSystemMonitor } from '#/api/dashboard/system-monitor';

import { onMounted, onUnmounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  getSystemMonitorHistoryMeasurementValue,
  subscribeSystemMonitor,
} from '#/api/dashboard/system-monitor';
import { YlStatisticCard, YlTrendChart } from '#/components/yl-dashboard';
import { $t } from '#/locales';

// --- State ---
const loading = ref(true);
const subscription = ref<null | Subscription>(null);

const systemInfo = ref<DashboardSystemMonitor.SystemInfo>({
  cpu: { jvmUsage: 0, systemUsage: 0 },
  memory: {
    jvmHeapTotal: 0,
    jvmHeapFree: 0,
    jvmNonHeapTotal: 0,
    jvmNonHeapFree: 0,
    systemTotal: 0,
    systemFree: 0,
    jvmHeapUsage: 0,
    jvmNonHeapUsage: 0,
    systemUsage: 0,
  },
  disk: { total: 0, free: 0, usage: 0 },
});

// --- Helpers ---
const formatBytes = (mb: number) => {
  if (mb > 1024) {
    return `${(mb / 1024).toFixed(1)} G`;
  }
  return `${mb.toFixed(1)} M`;
};

const formatBytesValue = (mb: number) => {
  if (mb > 1024) {
    return (mb / 1024).toFixed(1);
  }
  return mb.toFixed(1);
};

const formatBytesUnit = (mb: number) => {
  return mb > 1024 ? 'G' : 'M';
};

// --- Lifecycle ---
onMounted(() => {
  subscription.value = subscribeSystemMonitor((message) => {
    loading.value = false;
    if (message && message.payload && message.payload.value) {
      systemInfo.value = message.payload.value;
    }
  });
});

onUnmounted(() => {
  if (subscription.value) {
    subscription.value.unsubscribe();
  }
});

// --- Thresholds for Gauge ---
const gaugeThresholds = [
  { value: 0.6, color: '#52c41a' }, // Green
  { value: 0.8, color: '#1890ff' }, // Blue
  { value: 1, color: '#f5222d' }, // Red
];

// --- Chart Adapters ---

// Generic generator for trend chart options
const generateTrendOption = (
  data: DashboardApi.DashboardMeasurementResponse<DashboardSystemMonitor.SystemFlatMeasurementValue>[],
  name: string,
  color: string,
  unit: string,
  valueKey:
    | ((data: DashboardSystemMonitor.SystemFlatInfo) => any)
    | keyof DashboardSystemMonitor.SystemFlatInfo,
) => {
  const _data = data.map((item) => item.data);
  const list = Array.isArray(_data) ? _data : [];

  const xAxisData = list.map((item) => item.timeString);

  const seriesData = list.map((item) =>
    typeof valueKey === 'function'
      ? valueKey(item.value as unknown as DashboardSystemMonitor.SystemFlatInfo)
      : (item.value as unknown as DashboardSystemMonitor.SystemFlatInfo)[
          valueKey
        ],
  );

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const item = params[0];
        return `${item.name}<br/>${item.marker}${item.seriesName}: ${item.value} ${unit || ''}`;
      },
    },

    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: `{value} ${unit || ''}`,
      },
    },
    series: [
      {
        name,
        type: 'line',
        smooth: true,
        symbol: 'none',
        itemStyle: { color },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${color}4D` }, // 30% opacity
              { offset: 1, color: `${color}00` }, // 0% opacity
            ],
          },
        },
        data: seriesData,
      },
    ],
  };
};

// CPU Trend API
const getCpuTrend = async ({
  startTime,
  endTime,
}: {
  endTime: number;
  startTime: number;
}) => {
  return await getSystemMonitorHistoryMeasurementValue('cpu', {
    form: startTime,
    to: endTime,
  });
};

const cpuOptionGenerator = (data: any) => {
  return generateTrendOption(
    data,
    $t('dashboard.systemMonitor.cpu.title'),
    '#007bff',
    '%',
    'cpuSystemUsage',
  );
};

// JVM Memory Trend API
const getJvmTrend = async ({
  startTime,
  endTime,
}: {
  endTime: number;
  startTime: number;
}) => {
  return await getSystemMonitorHistoryMeasurementValue('jvm', {
    form: startTime,
    to: endTime,
  });
};
const jvmOptionGenerator = (
  data: DashboardApi.DashboardMeasurementResponse<DashboardSystemMonitor.SystemFlatMeasurementValue>[],
) => {
  return generateTrendOption(
    data,
    $t('dashboard.systemMonitor.jvm.usageRate'),
    '#1890ff',
    '%',
    (val) =>
      (
        ((val.memoryJvmHeapTotal - val.memoryJvmHeapFree) /
          val.memoryJvmHeapTotal) *
        100
      ).toFixed(2),
  );
};
</script>

<template>
  <Page
    :title="$t('dashboard.systemMonitor.title')"
    :description="$t('dashboard.systemMonitor.description')"
  >
    <!-- Top: Statistic Cards -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <!-- CPU Usage -->
      <YlStatisticCard
        :title="$t('dashboard.systemMonitor.cpu.title')"
        :value="systemInfo.cpu.systemUsage?.toFixed(1) || 0"
        unit="%"
        :chart-data="[{ value: systemInfo.cpu.systemUsage || 0, name: 'CPU' }]"
        :thresholds="gaugeThresholds"
        :loading="loading"
        :footer-label="$t('dashboard.systemMonitor.cpu.jvmCpu')"
        :footer-value="`${systemInfo.cpu.jvmUsage?.toFixed(1) || 0}%`"
      />

      <!-- JVM Memory -->
      <YlStatisticCard
        :title="$t('dashboard.systemMonitor.jvm.title')"
        :value="
          formatBytesValue(
            systemInfo.memory.jvmHeapTotal - systemInfo.memory.jvmHeapFree,
          )
        "
        :unit="
          formatBytesUnit(
            systemInfo.memory.jvmHeapTotal - systemInfo.memory.jvmHeapFree,
          )
        "
        :chart-data="[
          { value: systemInfo.memory.jvmHeapUsage || 0, name: 'JVM' },
        ]"
        :thresholds="gaugeThresholds"
        :loading="loading"
        :footer-label="$t('dashboard.systemMonitor.jvm.total')"
        :footer-value="formatBytes(systemInfo.memory.jvmHeapTotal)"
      />

      <!-- Disk Usage -->
      <YlStatisticCard
        :title="$t('dashboard.systemMonitor.disk.title')"
        :value="formatBytesValue(systemInfo.disk.total - systemInfo.disk.free)"
        :unit="formatBytesUnit(systemInfo.disk.total - systemInfo.disk.free)"
        :chart-data="[{ value: systemInfo.disk.usage || 0, name: 'Disk' }]"
        :thresholds="gaugeThresholds"
        :loading="loading"
        :footer-label="$t('dashboard.systemMonitor.disk.total')"
        :footer-value="formatBytes(systemInfo.disk.total)"
      />

      <!-- System Memory -->
      <YlStatisticCard
        :title="$t('dashboard.systemMonitor.memory.title')"
        :value="
          formatBytesValue(
            systemInfo.memory.systemTotal - systemInfo.memory.systemFree,
          )
        "
        :unit="
          formatBytesUnit(
            systemInfo.memory.systemTotal - systemInfo.memory.systemFree,
          )
        "
        :chart-data="[
          { value: systemInfo.memory.systemUsage || 0, name: 'Mem' },
        ]"
        :thresholds="gaugeThresholds"
        :loading="loading"
        :footer-label="$t('dashboard.systemMonitor.memory.total')"
        :footer-value="formatBytes(systemInfo.memory.systemTotal)"
      />
    </div>

    <!-- Bottom: Trend Charts -->
    <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <!-- CPU Trend -->
      <YlTrendChart
        :title="$t('dashboard.systemMonitor.cpu.trendTitle')"
        :api="getCpuTrend"
        :option-generator="cpuOptionGenerator"
        :loading="loading"
      />

      <!-- JVM Trend -->
      <YlTrendChart
        :title="$t('dashboard.systemMonitor.jvm.trendTitle')"
        :api="getJvmTrend"
        :option-generator="jvmOptionGenerator"
        :loading="loading"
      />
    </div>
  </Page>
</template>

<style scoped>
/* Add any specific styles if necessary, but Tailwind should cover it */
</style>
