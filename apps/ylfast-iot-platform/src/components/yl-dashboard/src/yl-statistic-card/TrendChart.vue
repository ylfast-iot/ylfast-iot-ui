<script setup lang="ts">
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { TrendDataItem } from './types';

import { nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

interface Props {
  trendData: TrendDataItem[];
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  color: '#3b82f6',
});

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

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

function updateChart(isMounted: boolean = false) {
  const labels = props.trendData.map((item) => item.label);
  const values = props.trendData.map((item) => Number(item.value) || 0);

  renderEcharts(
    {
      animation: false,
      grid: {
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
      },
      series: [
        {
          areaStyle: {
            color: {
              colorStops: [
                {
                  color: getAlphaColor(props.color, 0.25),
                  offset: 0,
                },
                {
                  color: getAlphaColor(props.color, 0.02),
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
          data: values,
          itemStyle: {
            color: props.color,
          },
          lineStyle: {
            color: props.color,
            width: 2,
          },
          showSymbol: false,
          smooth: true,
          type: 'line',
        },
      ],
      tooltip: {
        axisPointer: {
          type: 'line',
        },
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}: ${data.value}`;
        },
        trigger: 'axis',
      },
      xAxis: {
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        boundaryGap: false,
        data: labels,
        type: 'category',
      },
      yAxis: {
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        show: false,
        splitLine: { show: false },
        type: 'value',
      },
    },
    isMounted,
  );
}

// Watch data change (deep)
watch(
  () => props.trendData,
  () => {
    nextTick(() => updateChart());
  },
  { deep: true },
);

// Initial render
onMounted(() => {
  nextTick(() => updateChart(true));
});
</script>

<template>
  <EchartsUI ref="chartRef" height="100%" width="100%" />
</template>
