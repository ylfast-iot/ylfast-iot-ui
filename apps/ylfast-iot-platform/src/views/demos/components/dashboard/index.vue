<script setup lang="ts">
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { YlStatisticCard, YlTrendChart } from '#/components/yl-dashboard';

const loading = ref(false);

const toggleLoading = () => {
  loading.value = !loading.value;
};

// 仪表盘数据 (通常只需要一个值)
const cpuData = [{ value: 78, name: 'CPU' }];

// 模拟流量/内存数据 (0-4G)
const memoryData = [{ value: 3.2, name: 'Traffic' }];

// 自定义阈值颜色 (仿图片: 绿->蓝->橙)
const customThresholds = [
  { value: 0.25, color: '#00b578' },
  { value: 0.4, color: '#007bff' },
  { value: 1, color: '#ff8f1f' },
];

// 模拟趋势图 API
const getVisitTrend = async (_params: {
  endTime: number;
  startTime: number;
}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const xAxis = [
        '00:00',
        '04:00',
        '08:00',
        '12:00',
        '16:00',
        '20:00',
        '24:00',
      ];
      const data = xAxis.map(() => Math.floor(Math.random() * 2000 + 1000));

      resolve({
        tooltip: { trigger: 'axis' },

        xAxis: { type: 'category', boundaryGap: false, data: xAxis },
        yAxis: { type: 'value' },
        series: [
          {
            name: '访问量',
            type: 'line',
            smooth: true,
            itemStyle: { color: '#007bff' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(0,123,255,0.3)' },
                  { offset: 1, color: 'rgba(0,123,255,0)' },
                ],
              },
            },
            data,
          },
        ],
      });
    }, 1000);
  });
};
</script>

<template>
  <Page
    title="看板组件演示"
    description="展示 yl-dashboard 模块下的通用业务组件"
  >
    <div class="mb-4">
      <button class="btn btn-primary btn-sm" @click="toggleLoading">
        切换 Loading 状态
      </button>
    </div>

    <!-- 统计卡片 Section -->
    <div class="mb-4 text-lg font-bold">统计卡片</div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <!-- 基础卡片 -->
      <YlStatisticCard
        title="总设备数"
        :value="12450"
        unit="台"
        icon="lucide:cpu"
        :loading="loading"
      />

      <!-- 趋势上升 -->
      <YlStatisticCard
        title="今日活跃"
        :value="8432"
        unit="次"
        icon="lucide:activity"
        icon-bg-color="bg-blue-500/10"
        icon-color="text-blue-500"
        trend="up"
        trend-value="12%"
        :loading="loading"
      />

      <!-- 带仪表盘图表卡片 (CPU) -->
      <YlStatisticCard
        title="CPU使用率"
        value="78"
        unit="%"
        :chart-data="cpuData"
        trend="flat"
        trend-value="0%"
        :loading="loading"
        footer-label="核心数"
        footer-value="8"
      />

      <!-- 带仪表盘图表卡片 (流量仿真 - 3.2G / 4G) -->
      <YlStatisticCard
        title="实时流量"
        value="3.2"
        unit="G"
        :min="0"
        :max="4"
        :chart-data="memoryData"
        :thresholds="customThresholds"
        :loading="loading"
        footer-label="峰值"
        footer-value="4G"
      />
    </div>

    <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <!-- 趋势下降 -->
      <YlStatisticCard
        title="异常告警"
        :value="23"
        unit="个"
        icon="lucide:alert-triangle"
        icon-bg-color="bg-red-500/10"
        icon-color="text-red-500"
        trend="down"
        trend-value="5%"
        variant="error"
        :loading="loading"
      />
      <!-- Primary Variant -->
      <YlStatisticCard
        title="项目总数"
        :value="128"
        icon="lucide:briefcase"
        variant="primary"
        :loading="loading"
      />

      <!-- Success Variant -->
      <YlStatisticCard
        title="完成率"
        value="98.5"
        unit="%"
        icon="lucide:check-circle"
        variant="success"
        :loading="loading"
      />
    </div>

    <!-- 趋势图表 Section -->
    <div class="my-4 mt-8 text-lg font-bold">趋势图表</div>
    <div class="flex flex-col gap-4">
      <!-- 宽屏/Full 演示 -->
      <YlTrendChart
        title="系统访问趋势 (API模拟)"
        :api="getVisitTrend"
        :loading="loading"
      />

      <!-- 窄屏布局测试 (Force grid) -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <YlTrendChart
          title="设备消息量 (响应式测试)"
          :api="getVisitTrend"
          :loading="loading"
        />
      </div>
    </div>
  </Page>
</template>
