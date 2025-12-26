<script setup lang="ts">
import type { EchartsUIType } from '@vben/plugins/echarts';

import { nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

interface Props {
  chartData: Array<{ name: string; value: number }>;
  min?: number;
  max?: number;
  thresholds?: Array<{ color: string; value: number }>;
  unit?: string;
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  thresholds: () => [],
  unit: '',
});

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

function updateChart(isMounted: boolean = false) {
  const value = props.chartData[0]?.value || 0;

  let axisLineColors: any[] = [];

  axisLineColors =
    props.thresholds && props.thresholds.length > 0
      ? props.thresholds.map((t) => [t.value, t.color])
      : [
          [0.25, 'rgba(36, 178, 118, 1)'],
          [
            0.4,
            {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(66, 147, 255, 1)' },
                { offset: 1, color: 'rgba(36, 178, 118, 1)' },
              ],
            },
          ],
          [
            0.5,
            {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(250, 178, 71, 1)' },
                { offset: 1, color: 'rgba(66, 147, 255, 1)' },
              ],
            },
          ],
          [
            1,
            {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(250, 178, 71, 1)' },
                { offset: 1, color: 'rgba(247, 111, 93, 1)' },
              ],
            },
          ],
        ];

  renderEcharts(
    {
      series: [
        {
          type: 'gauge',
          center: ['50%', '67%'],
          startAngle: 200,
          endAngle: -20,
          min: props.min,
          max: props.max,
          splitNumber: 5,
          radius: '85%',
          itemStyle: { color: '#FFAB91' },
          progress: { show: false },
          pointer: {
            show: true,
            length: '75%',
            width: 4,
            itemStyle: { color: 'auto' },
          },
          axisLine: {
            roundCap: false,
            lineStyle: { width: 10, color: axisLineColors },
          },
          axisTick: {
            distance: -20,
            lineStyle: { color: 'rgba(0,0,0,0.15)', width: 1 },
          },
          splitLine: {
            distance: -22,
            length: 9,
            lineStyle: { color: '#000', width: 1 },
          },
          axisLabel: {
            distance: -18,
            color: 'inherit',
            fontSize: 12,
            width: 30,
            padding: [6, 10, 0, 10],
            formatter: (val: number) => `${Math.round(val)}${props.unit || ''}`,
          },
          anchor: {
            show: true,
            showAbove: true,
            size: 16,
            itemStyle: {
              borderWidth: 3,
              borderColor: '#fff',
              color: 'auto',
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.25)',
            },
          },
          detail: { show: false },
          data: [{ value }],
        },
      ],
    },
    isMounted,
  );
}

// Watch data change (deep)
watch(
  () => props.chartData,
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
