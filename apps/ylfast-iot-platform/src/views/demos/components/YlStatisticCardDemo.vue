<script setup lang="ts">
import type { TrendDataItem } from '#/components/yl-dashboard/src/yl-statistic-card/types';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { YlStatisticCard } from '#/components/yl-dashboard';

// 模拟趋势数据
const mockTrendData = ref<TrendDataItem[]>([
  { label: '00:00', value: 120 },
  { label: '02:00', value: 180 },
  { label: '04:00', value: 150 },
  { label: '06:00', value: 230 },
  { label: '08:00', value: 350 },
  { label: '10:00', value: 420 },
  { label: '12:00', value: 380 },
  { label: '14:00', value: 450 },
  { label: '16:00', value: 520 },
  { label: '18:00', value: 480 },
  { label: '20:00', value: 390 },
  { label: '22:00', value: 280 },
]);

// 模拟仪表盘数据
const mockChartData = ref([{ name: 'CPU', value: 75 }]);
</script>

<template>
  <Page title="YlStatisticCard 演示">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <!-- 趋势图卡片 - 橙色 -->
      <YlStatisticCard
        title="今日设备消息量"
        :value="14960"
        chart-type="trend"
        :trend-data="mockTrendData"
        trend-color="#f97316"
        icon="lucide:mail"
        icon-bg-color="bg-orange-500/10"
        icon-color="text-orange-500"
      >
        <template #extra>
          <div class="flex w-full items-center justify-between text-xs">
            <div class="flex items-center gap-1">
              <span class="text-muted-foreground">当月设备消息量:</span>
              <span class="font-medium text-foreground">561202</span>
            </div>
          </div>
        </template>
      </YlStatisticCard>

      <!-- 趋势图卡片 - 紫色 -->
      <YlStatisticCard
        title="当前在线"
        :value="7"
        chart-type="trend"
        :trend-data="mockTrendData"
        trend-color="#8b5cf6"
        icon="lucide:wifi"
        icon-bg-color="bg-purple-500/10"
        icon-color="text-purple-500"
      >
        <template #extra>
          <div class="flex w-full items-center justify-between text-xs">
            <div class="flex items-center gap-1">
              <span class="text-muted-foreground">昨日在线:</span>
              <span class="font-medium text-foreground">9</span>
            </div>
          </div>
        </template>
      </YlStatisticCard>

      <!-- 仪表盘卡片 -->
      <YlStatisticCard
        title="CPU 使用率"
        :value="75"
        unit="%"
        chart-type="statistic"
        :chart-data="mockChartData"
        :max="100"
        icon="lucide:cpu"
        icon-bg-color="bg-blue-500/10"
        icon-color="text-blue-500"
      />

      <!-- 只有图标卡片 -->
      <YlStatisticCard
        title="设备总数"
        :value="1234"
        icon="lucide:cpu"
        icon-bg-color="bg-green-500/10"
        icon-color="text-green-500"
      >
        <template #extra>
          <div class="flex w-full items-center justify-between text-xs">
            <div class="flex items-center gap-1">
              <div class="size-1.5 rounded-full bg-green-500"></div>
              <span class="text-muted-foreground">在线:</span>
              <span class="font-medium text-foreground">789</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="size-1.5 rounded-full bg-gray-400"></div>
              <span class="text-muted-foreground">离线:</span>
              <span class="font-medium text-foreground">445</span>
            </div>
          </div>
        </template>
      </YlStatisticCard>
    </div>
  </Page>
</template>
