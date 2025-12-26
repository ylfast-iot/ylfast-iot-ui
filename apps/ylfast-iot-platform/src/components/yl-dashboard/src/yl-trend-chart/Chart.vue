<script setup lang="ts">
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { Recordable } from '#/adapter';

import { nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

interface Props {
  options: any;
  loading?: boolean;
}

const props = defineProps<Props>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts, resize } = useEcharts(chartRef);

function doRenderCharts(options: Recordable) {
  if (options) {
    renderEcharts({
      grid: {
        left: '20',
        right: '20',
        bottom: '60',
        containLabel: true,
      },
      dataZoom: [
        { type: 'inside', realtime: true },
        { type: 'slider', realtime: true, height: 30 },
      ],
      ...options,
    });
    resize();
  }
}

watch(
  () => props.options,
  (newOptions) => {
    if (newOptions) {
      nextTick(() => {
        doRenderCharts(newOptions);
      });
    }
  },
  { deep: true },
);

watch(
  () => props.loading,
  (loading) => {
    if (!loading) {
      nextTick(() => {
        if (props.options) {
          doRenderCharts(props.options);
        }
      });
    }
  },
);

onMounted(() => {
  nextTick(() => {
    if (props.options) {
      doRenderCharts(props.options);
    }
  });
});
</script>

<template>
  <EchartsUI ref="chartRef" height="100%" width="100%" />
</template>
