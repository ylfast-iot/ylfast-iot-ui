<script setup lang="ts">
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';

import { computed, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Button, Card, Empty, RangePicker, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getMultiMeasurementValue } from '#/api/dashboard';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
}>();

const properties = computed(() => {
  if (!props.device?.tsl) return [];
  try {
    const tsl =
      typeof props.device.tsl === 'string'
        ? JSON.parse(props.device.tsl)
        : props.device.tsl;
    return (tsl.properties || []).filter((p: any) =>
      ['BOOLEAN', 'DOUBLE', 'FLOAT', 'INTEGER', 'LONG'].includes(
        p.valueType?.type,
      ),
    );
  } catch {
    return [];
  }
});

const selectedProperty = ref<string>();
const timeRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().subtract(1, 'hour'),
  dayjs(),
]);
const loading = ref(false);
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

async function handleQuery() {
  if (!selectedProperty.value) return;
  loading.value = true;
  try {
    const res = await getMultiMeasurementValue([
      {
        dashboard: 'device',
        dimension: 'history',
        group: 'property',
        measurement: 'properties',
        object: props.device.id,
        params: {
          from: timeRange.value[0].valueOf(),
          property: selectedProperty.value,
          to: timeRange.value[1].valueOf(),
        },
      },
    ]);

    if (res && res[0]?.data) {
      const seriesData = (res[0].data as any).map((item: any) => [
        item.timestamp,
        item.value,
      ]);

      const propName =
        properties.value.find((p) => p.id === selectedProperty.value)?.name ||
        selectedProperty.value;

      renderEcharts({
        grid: {
          bottom: '10%',
          left: '3%',
          right: '4%',
          top: '15%',
          containLabel: true,
        },
        tooltip: {
          trigger: 'axis',
        },
        xAxis: {
          type: 'time',
          splitLine: {
            show: false,
          },
        },
        yAxis: {
          type: 'value',
          splitLine: {
            lineStyle: {
              type: 'dashed',
            },
          },
        },
        series: [
          {
            name: propName,
            type: 'line',
            showSymbol: false,
            data: seriesData,
            smooth: true,
            areaStyle: {
              opacity: 0.1,
            },
          },
        ],
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex h-full flex-col bg-gray-50/50 p-4 dark:bg-transparent">
    <Card size="small" class="mb-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">属性:</span>
          <Select
            v-model:value="selectedProperty"
            placeholder="请选择属性"
            style="width: 200px"
          >
            <Select.Option v-for="p in properties" :key="p.id" :value="p.id">
              {{ p.name }}
            </Select.Option>
          </Select>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">时间范围:</span>
          <RangePicker v-model:value="timeRange" show-time />
        </div>

        <Button :loading="loading" type="primary" @click="handleQuery">
          查询
        </Button>
      </div>
    </Card>

    <Card class="flex-1 overflow-hidden" size="small">
      <div v-if="selectedProperty" class="h-full w-full">
        <EchartsUI ref="chartRef" height="100%" width="100%" />
      </div>
      <div v-else class="flex h-full items-center justify-center">
        <Empty description="请选择属性并点击查询以查看历史数据" />
      </div>
    </Card>
  </div>
</template>

<style scoped>
:deep(.ant-card-body) {
  height: 100%;
}
</style>
