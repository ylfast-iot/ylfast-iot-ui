<script setup lang="ts">
import type { TrendDataItem } from '#/components/yl-dashboard/src/yl-statistic-card/types';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import dayjs from 'dayjs';

import { IotDeviceInstanceApi, IotDeviceProductApi } from '#/api';
import {
  getDeviceMessageQuantityMonitorMeasurementValue,
  getDeviceOnlineCountMonitorMeasurementValue,
} from '#/api/dashboard/device-monitor';
import { YlStatisticCard, YlTrendChart } from '#/components/yl-dashboard';

// ==================== 响应式状态 ====================
const loading = ref(true);

// 产品统计数据
const productStats = ref({
  disabled: 0,
  enabled: 0,
  total: 0,
});

// 设备统计数据
const deviceStats = ref({
  offline: 0,
  online: 0,
  total: 0,
});

// 设备在线数据
const onlineData = ref({
  todayOnline: 0,
  yesterdayOnline: 0,
});

// 设备消息统计数据
const messageStats = ref({
  thisMonth: 0,
  today: 0,
  yesterday: 0,
});

// 趋势数据
const messageTrendData = ref<TrendDataItem[]>([]);
const onlineTrendData = ref<TrendDataItem[]>([]);

// ==================== 时间工具函数 ====================
function getTimeRange(type: 'thisMonth' | 'today' | 'yesterday') {
  const now = dayjs();
  switch (type) {
    case 'thisMonth': {
      return {
        from: now.startOf('month').valueOf(),
        to: now.valueOf(),
      };
    }
    case 'today': {
      return {
        from: now.startOf('day').valueOf(),
        to: now.valueOf(),
      };
    }
    case 'yesterday': {
      const yesterday = now.subtract(1, 'day');
      return {
        from: yesterday.startOf('day').valueOf(),
        to: yesterday.endOf('day').valueOf(),
      };
    }
  }
}

// ==================== 数据获取函数 ====================

/** 获取产品统计数据 */
async function fetchProductStats() {
  try {
    const [total, enabled, disabled] = await Promise.all([
      IotDeviceProductApi.basicCrudApis.postCount({ terms: [] }),
      IotDeviceProductApi.basicCrudApis.postCount({
        terms: [{ column: 'state', termType: 'eq', value: 1 }],
      }),
      IotDeviceProductApi.basicCrudApis.postCount({
        terms: [{ column: 'state', termType: 'eq', value: 0 }],
      }),
    ]);
    productStats.value = { disabled, enabled, total };
  } catch (error) {
    console.error('Failed to fetch product stats:', error);
  }
}

/** 获取设备统计数据 */
async function fetchDeviceStats() {
  try {
    const [total, online, offline] = await Promise.all([
      IotDeviceInstanceApi.basicCrudApis.postCount({ terms: [] }),
      IotDeviceInstanceApi.basicCrudApis.postCount({
        terms: [{ column: 'deviceState', termType: 'eq', value: 'online' }],
      }),
      IotDeviceInstanceApi.basicCrudApis.postCount({
        terms: [{ column: 'deviceState', termType: 'eq', value: 'offline' }],
      }),
    ]);
    deviceStats.value = { offline, online, total };
  } catch (error) {
    console.error('Failed to fetch device stats:', error);
  }
}

/** 获取设备在线数据 */
async function fetchOnlineData() {
  try {
    const todayRange = getTimeRange('today');
    const yesterdayRange = getTimeRange('yesterday');

    const [todayCount, yesterdayCount] = await Promise.all([
      getDeviceOnlineCountMonitorMeasurementValue({
        from: todayRange.from,
        time: '1h',
        limit: 24,
        to: todayRange.to,
      }),
      getDeviceOnlineCountMonitorMeasurementValue({
        from: yesterdayRange.from,
        time: '1h',
        limit: 24,
        to: yesterdayRange.to,
      }),
    ]);
    const todayTrend = todayCount;

    onlineData.value = {
      todayOnline: (todayCount[0]?.data?.value as unknown as number) || 0,
      yesterdayOnline:
        (yesterdayCount[0]?.data?.value as unknown as number) || 0,
    };

    // 处理在线趋势数据
    const todayTrendPoints = todayTrend
      .filter((r) => r.group === 'aggOnline')
      .map((r) => r.data);
    onlineTrendData.value =
      todayTrendPoints.length > 0
        ? todayTrendPoints
            .filter((p) => p && p.timeString)
            .map((p) => ({
              label: p.timeString ? dayjs(p.timeString).format('HH:mm') : '',
              value: p.value || 0,
              timestamp: p.timestamp || 0,
            }))
            .sort((a, b) => a.timestamp - b.timestamp)
        : [];
  } catch (error) {
    console.error('Failed to fetch online data:', error);
  }
}

/** 获取设备消息统计数据 */
async function fetchMessageStats() {
  try {
    const todayRange = getTimeRange('today');

    const results = await getDeviceMessageQuantityMonitorMeasurementValue([
      {
        group: 'oneday',
        params: {
          format: 'yyyy-MM-dd',
          from: 'now-1d',
          time: '1d',
        },
      },
      {
        group: 'yesterday',
        params: {
          format: 'yyyy-MM-dd',
          from: getTimeRange('yesterday').from,
          time: '1d',
          to: getTimeRange('yesterday').to,
        },
      },
      {
        group: 'thisMonth',
        params: {
          format: 'yyyy-MM',
          from: 'now-1M',
          limit: 1,
          time: '1M',
        },
      },
      {
        group: 'today',
        params: {
          format: 'yyyy-MM-dd HH:mm:ss',
          from: todayRange.from,
          limit: 24,
          time: '1h',
          to: todayRange.to,
        },
      },
    ]);

    const todayMsgValue = results.find((r) => r.group === 'oneday')?.data
      ?.value;
    const yesterdayMsgValue = results.find((r) => r.group === 'yesterday')?.data
      ?.value;
    const thisMonthValue = results.find((r) => r.group === 'thisMonth')?.data
      ?.value;
    messageStats.value = {
      thisMonth: typeof thisMonthValue === 'number' ? thisMonthValue : 0,
      today: typeof todayMsgValue === 'number' ? todayMsgValue : 0,
      yesterday: typeof yesterdayMsgValue === 'number' ? yesterdayMsgValue : 0,
    };

    // 处理24小时趋势数据
    const todayTrendPoints = results
      .filter((r) => r.group === 'today')
      .map((r) => r.data);
    messageTrendData.value =
      todayTrendPoints.length > 0
        ? todayTrendPoints
            .filter((p) => p && p.timeString)
            .map((p) => ({
              label: p.timeString ? dayjs(p.timeString).format('HH:mm') : '',
              value: p.value || 0,
              timestamp: p.timestamp || 0,
            }))
            .sort((a, b) => b.timestamp - a.timestamp)
        : [];
  } catch (error) {
    console.error('Failed to fetch message stats:', error);
  }
}

/** 加载所有数据 */
async function loadAllData() {
  loading.value = true;
  try {
    await Promise.all([
      fetchProductStats(),
      fetchDeviceStats(),
      fetchOnlineData(),
      fetchMessageStats(),
    ]);
  } finally {
    loading.value = false;
  }
}

// ==================== 趋势图配置 ====================

/** 趋势图 API 调用 */
async function fetchTrendData(params: { endTime: number; startTime: number }) {
  // 根据时间范围动态设置 format 和 time
  const diffMs = params.endTime - params.startTime;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  let format: string;
  let time: string;
  let limit: number;

  if (diffMs <= 1000 * 60 * 60) {
    // 1小时内 - 按分钟显示
    format = 'HH:mm';
    time = '1m';
    limit = 60;
  } else if (diffDays <= 1) {
    // 1天内 - 按小时显示
    format = 'HH:mm';
    time = '1h';
    limit = 24;
  } else if (diffDays <= 7) {
    // 1周内 - 按天显示
    format = 'MM-dd';
    time = '1d';
    limit = 7;
  } else if (diffDays <= 30) {
    // 1月内 - 按天显示
    format = 'MM-dd';
    time = '1d';
    limit = 30;
  } else {
    // 超过1月 - 按周显示
    format = 'yyyy-MM-dd';
    time = '7d';
    limit = 12;
  }

  const results = await getDeviceMessageQuantityMonitorMeasurementValue([
    {
      group: 'device_msg',
      params: {
        format,
        from: params.startTime,
        limit,
        time,
        to: params.endTime,
      },
    },
  ]);
  return results;
}

/** 获取带透明度的颜色 */
function getAlphaColor(color: string | undefined, alpha: number) {
  if (!color) return 'rgba(0,0,0,0)';
  if (color.startsWith('#')) {
    const opacity = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0');
    return `${color}${opacity}`;
  }
  if (color.includes('hsl')) {
    return color.replace('hsl', 'hsla').replace(')', `, ${alpha})`);
  }
  if (color.includes('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }
  return color;
}

/** 趋势图 ECharts 配置生成器 */
function trendOptionGenerator(data: any) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      series: [],
      xAxis: { data: [], type: 'category' },
      yAxis: { type: 'value' },
    };
  }

  // 提取数据点。入参是类似 [{ group: '...', data: { value, timeString, timestamp } }, ...] 的数组
  const points = data
    .filter((item) => item.data && item.data.timeString)
    .map((item) => ({
      timestamp: item.data.timestamp || 0,
      timeString: item.data.timeString,
      value: item.data.value || 0,
    }));

  // 按时间戳倒序排序 (由于后端返回的最新数据 timestamp 为 0，倒序即为时间上的升序)
  points.sort((a, b) => b.timestamp - a.timestamp);

  const xAxisData = points.map((p) => p.timeString);
  const seriesData = points.map((p) => Number(p.value) || 0);

  return {
    animation: false,
    grid: {
      bottom: '18%',
      containLabel: true,
      left: '0%',
      right: '1%',
      top: '3%',
    },
    series: [
      {
        areaStyle: {
          color: {
            colorStops: [
              {
                color: getAlphaColor('#3b82f6', 0.25),
                offset: 0,
              },
              {
                color: getAlphaColor('#3b82f6', 0.02),
                offset: 1,
              },
            ],
            type: 'linear',
            x: 0,
            x2: 0,
            y: 0,
            y2: 1,
          },
        },
        data: seriesData,
        itemStyle: {
          color: '#3b82f6',
        },
        lineStyle: {
          color: '#3b82f6',
          width: 2,
        },
        name: $t('device.dashboard.message.title'),
        smooth: true,
        type: 'line',
      },
    ],
    tooltip: {
      axisPointer: {
        type: 'cross',
      },
      trigger: 'axis',
    },
    xAxis: {
      boundaryGap: false,
      data: xAxisData,
      type: 'category',
    },
    yAxis: {
      splitNumber: 10,
      type: 'value',
    },
  };
}

// ==================== 计算属性 ====================

// ==================== 生命周期 ====================
onMounted(() => {
  loadAllData();
});
</script>

<template>
  <Page>
    <!-- 统计卡片区域 -->
    <div class="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      <!-- 产品统计卡片 -->
      <YlStatisticCard
        :loading="loading"
        :title="$t('device.dashboard.product.title')"
        :value="productStats.total"
        icon="lucide:package"
        icon-bg-color="bg-blue-500/10"
        icon-color="text-blue-500"
      >
        <template #extra>
          <div class="flex w-full items-center justify-between text-xs">
            <div class="flex items-center gap-1">
              <div class="size-1.5 rounded-full bg-green-500"></div>
              <span class="text-muted-foreground">
                {{ $t('device.dashboard.product.enabled') }}:
              </span>
              <span class="font-medium text-foreground">
                {{ productStats.enabled }}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <div class="size-1.5 rounded-full bg-red-500"></div>
              <span class="text-muted-foreground">
                {{ $t('device.dashboard.product.disabled') }}:
              </span>
              <span class="font-medium text-foreground">{{
                productStats.disabled
              }}</span>
            </div>
          </div>
        </template>
      </YlStatisticCard>

      <!-- 设备统计卡片 -->
      <YlStatisticCard
        :loading="loading"
        :title="$t('device.dashboard.device.title')"
        :value="deviceStats.total"
        icon="lucide:cpu"
        icon-bg-color="bg-green-500/10"
        icon-color="text-green-500"
      >
        <template #extra>
          <div class="flex w-full items-center justify-between text-xs">
            <div class="flex items-center gap-1">
              <div class="size-1.5 rounded-full bg-green-500"></div>
              <span class="text-muted-foreground">
                {{ $t('device.dashboard.device.online') }}:
              </span>
              <span class="font-medium text-foreground">{{
                deviceStats.online
              }}</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="size-1.5 rounded-full bg-gray-400"></div>
              <span class="text-muted-foreground">
                {{ $t('device.dashboard.device.offline') }}:
              </span>
              <span class="font-medium text-foreground">{{
                deviceStats.offline
              }}</span>
            </div>
          </div>
        </template>
      </YlStatisticCard>

      <!-- 设备今日在线卡片 -->
      <YlStatisticCard
        :loading="loading"
        :title="$t('device.dashboard.onlineData.todayOnline')"
        :value="onlineData.todayOnline"
        chart-type="trend"
        :trend-data="onlineTrendData"
        trend-color="#8b5cf6"
      >
        <template #extra>
          <div class="flex w-full items-center justify-between text-xs">
            <div class="flex items-center gap-1">
              <div class="size-1.5 rounded-full bg-purple-500"></div>
              <span class="text-muted-foreground">
                {{ $t('device.dashboard.onlineData.yesterdayOnline') }}:
              </span>
              <span class="font-medium text-foreground">{{
                onlineData.yesterdayOnline
              }}</span>
            </div>
          </div>
        </template>
      </YlStatisticCard>

      <!-- 设备消息统计卡片 -->
      <YlStatisticCard
        :loading="loading"
        :title="$t('device.dashboard.message.today')"
        :value="messageStats.today"
        chart-type="trend"
        :trend-data="messageTrendData"
        trend-color="#f97316"
      >
        <template #extra>
          <div class="flex w-full items-center justify-between text-xs">
            <div class="flex items-center gap-1">
              <div class="size-1.5 rounded-full bg-orange-400"></div>
              <span class="text-muted-foreground">
                {{ $t('device.dashboard.message.yesterday') }}:
              </span>
              <span class="font-medium text-foreground">{{
                messageStats.yesterday
              }}</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="size-1.5 rounded-full bg-orange-600"></div>
              <span class="text-muted-foreground">
                {{ $t('device.dashboard.message.thisMonth') }}:
              </span>
              <span class="font-medium text-foreground">{{
                messageStats.thisMonth
              }}</span>
            </div>
          </div>
        </template>
      </YlStatisticCard>
    </div>

    <!-- 趋势图区域 -->
    <YlTrendChart
      :api="fetchTrendData"
      :option-generator="trendOptionGenerator"
      :show-date-shortcuts="true"
      :title="$t('device.dashboard.trend.title')"
    />
  </Page>
</template>
