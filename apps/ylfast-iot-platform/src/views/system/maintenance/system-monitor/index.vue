<script setup lang="ts">
import type { Subscription } from 'rxjs';

import type { DashboardApi } from '#/api/dashboard';
import type { DashboardSystemMonitor } from '#/api/dashboard/system-monitor';
import type { SystemClusterMonitorApi } from '#/api/system/monitor/cluster';

import { computed, onMounted, onUnmounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import { Select } from 'ant-design-vue';

import {
  getSystemMonitorHistoryMeasurementValue,
  subscribeSystemMonitor,
} from '#/api/dashboard/system-monitor';
import { getClusterNodes } from '#/api/system/monitor/cluster';
import { YlStatisticCard, YlTrendChart } from '#/components/yl-dashboard';
import { $t } from '#/locales';

// const NetworkIcon = createIconifyIcon('lucide:network');
// const ActivityIcon = createIconifyIcon('lucide:activity');
const ServerIcon = createIconifyIcon('lucide:server');

// --- State ---
const loading = ref(true);
const subscription = ref<null | Subscription>(null);

const serverId = ref<string>();
const clusterNodes = ref<SystemClusterMonitorApi.ClusterNodeInfo[]>([]);

const currentNode = computed(() => {
  return clusterNodes.value.find((n) => n.serverId === serverId.value);
});

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

const formatBytesValue = (mb: number, total?: number) => {
  if ((total && total > 1024) || mb > 1024) {
    return (mb / 1024).toFixed(1);
  }
  return mb.toFixed(1);
};

const formatBytesUnit = (mb: number, total?: number) => {
  return (total && total > 1024) || mb > 1024 ? 'G' : 'M';
};

const getChartMax = (total: number) => {
  if (!total) return 100;
  return total > 1024
    ? Number((total / 1024).toFixed(1))
    : Number(total.toFixed(1));
};

const getChartValue = (used: number, total: number) => {
  const safeUsed = Math.max(0, used);
  if (!total) return 0;
  return total > 1024
    ? Number((safeUsed / 1024).toFixed(1))
    : Number(safeUsed.toFixed(1));
};

// --- Lifecycle ---
const initSubscription = () => {
  if (subscription.value) {
    subscription.value.unsubscribe();
  }
  loading.value = true;
  subscription.value = subscribeSystemMonitor((message) => {
    loading.value = false;
    if (message && message.payload && message.payload.value) {
      systemInfo.value = message.payload.value;
    }
  }, serverId.value);
};

onMounted(async () => {
  const result = await getClusterNodes();
  clusterNodes.value = result.nodes || [];
  if (result.local && result.local.serverId) {
    serverId.value = result.local.serverId;
  }
  initSubscription();
});

const onServerChange = () => {
  initSubscription();
};

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
  const _data = data
    .map((item) => item.data)
    .sort((a, b) => a.timestamp - b.timestamp);
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
    from: startTime,
    to: endTime,
    serverId: serverId.value,
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
    from: startTime,
    to: endTime,
    serverId: serverId.value,
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
  <Page :description="$t('dashboard.systemMonitor.description')">
    <template #title>
      <div class="flex items-center gap-4">
        <span class="text-xl font-bold tracking-tight">{{
          $t('dashboard.systemMonitor.title')
        }}</span>
        <transition name="fade-slide">
          <div
            v-if="currentNode"
            class="flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs shadow-sm shadow-primary/5"
          >
            <div class="relative flex h-2 w-2">
              <span
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
              ></span>
              <span
                class="relative inline-flex h-2 w-2 rounded-full bg-primary"
              ></span>
            </div>
            <div class="h-3.5 w-px bg-primary/20"></div>
            <div class="flex items-center gap-1.5 font-mono">
              <span class="font-medium italic text-foreground/40">NODE:</span>
              <span class="font-bold text-primary">
                {{ currentNode.host }}:{{ currentNode.port }}
              </span>
            </div>
          </div>
        </transition>
      </div>
    </template>
    <template #extra>
      <div
        class="flex items-center gap-2 overflow-hidden rounded-xl border border-border bg-card/60 px-2 py-1 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:shadow-md"
      >
        <div
          class="group flex h-8 items-center gap-2 rounded-lg bg-muted/50 px-2.5 text-muted-foreground"
        >
          <ServerIcon
            class="size-4 transition-colors group-hover:text-primary"
          />
          <span
            class="text-xs font-bold uppercase tracking-wider transition-colors group-hover:text-primary"
          >
            {{ $t('dashboard.systemMonitor.clusterNode') }}
          </span>
        </div>
        <div class="h-4 w-px bg-border/50"></div>
        <Select
          v-model:value="serverId"
          :placeholder="$t('dashboard.systemMonitor.selectNode')"
          class="w-44"
          :bordered="false"
          @change="onServerChange"
          dropdown-class-name="premium-select-dropdown"
        >
          <Select.Option
            v-for="node in clusterNodes"
            :key="node.serverId"
            :value="node.serverId"
          >
            <span class="font-mono text-xs font-bold">{{ node.serverId }}</span>
          </Select.Option>
        </Select>
      </div>
    </template>
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
            systemInfo.memory.jvmHeapTotal,
          )
        "
        :unit="
          formatBytesUnit(
            systemInfo.memory.jvmHeapTotal - systemInfo.memory.jvmHeapFree,
            systemInfo.memory.jvmHeapTotal,
          )
        "
        :max="getChartMax(systemInfo.memory.jvmHeapTotal)"
        :chart-data="[
          {
            value: getChartValue(
              systemInfo.memory.jvmHeapTotal - systemInfo.memory.jvmHeapFree,
              systemInfo.memory.jvmHeapTotal,
            ),
            name: 'JVM',
          },
        ]"
        :thresholds="gaugeThresholds"
        :loading="loading"
        :footer-label="$t('dashboard.systemMonitor.jvm.total')"
        :footer-value="formatBytes(systemInfo.memory.jvmHeapTotal)"
      />

      <!-- Disk Usage -->
      <YlStatisticCard
        :title="$t('dashboard.systemMonitor.disk.title')"
        :value="
          formatBytesValue(
            systemInfo.disk.total - systemInfo.disk.free,
            systemInfo.disk.total,
          )
        "
        :unit="
          formatBytesUnit(
            systemInfo.disk.total - systemInfo.disk.free,
            systemInfo.disk.total,
          )
        "
        :max="getChartMax(systemInfo.disk.total)"
        :chart-data="[
          {
            value: getChartValue(
              systemInfo.disk.total - systemInfo.disk.free,
              systemInfo.disk.total,
            ),
            name: 'Disk',
          },
        ]"
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
            systemInfo.memory.systemTotal,
          )
        "
        :unit="
          formatBytesUnit(
            systemInfo.memory.systemTotal - systemInfo.memory.systemFree,
            systemInfo.memory.systemTotal,
          )
        "
        :max="getChartMax(systemInfo.memory.systemTotal)"
        :chart-data="[
          {
            value: getChartValue(
              systemInfo.memory.systemTotal - systemInfo.memory.systemFree,
              systemInfo.memory.systemTotal,
            ),
            name: 'Mem',
          },
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
        class="h-[350px]"
        :key="serverId"
        :title="$t('dashboard.systemMonitor.cpu.trendTitle')"
        :api="getCpuTrend"
        :option-generator="cpuOptionGenerator"
        :loading="loading"
      />

      <!-- JVM Trend -->
      <YlTrendChart
        class="h-[350px]"
        :key="serverId"
        :title="$t('dashboard.systemMonitor.jvm.trendTitle')"
        :api="getJvmTrend"
        :option-generator="jvmOptionGenerator"
        :loading="loading"
      />
    </div>
  </Page>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

:deep(.ant-select-selector) {
  background-color: transparent !important;
}

:deep(.premium-select-dropdown) {
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 10%);
}
</style>
