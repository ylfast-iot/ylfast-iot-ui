<script setup lang="ts">
import type { Dayjs } from 'dayjs';

import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';
import type { YlDcFormSchema } from '#/components/yl-dc-form';
import type { AggType } from '#/enums/agg-type';
import type {
  BooleanTypeDef,
  EnumTypeDef,
  NumberTypeDef,
} from '#/types/data-type';
import type { DevicePropertyMetadata } from '#/types/metadata';

import { computed, nextTick, ref, watch } from 'vue';

import { formatDateTime } from '@vben/utils';

import { Modal, Select, Space, Tabs } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getDevicePropertyAggData,
  getPropertyDataList,
  getPropertyDataPage,
} from '#/api/iot/device/data';
import Chart from '#/components/yl-dashboard/src/yl-trend-chart/Chart.vue';
import { YlDateRangePicker } from '#/components/yl-date-range-picker';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';
import { AGG_TYPE_ENUM } from '#/enums/agg-type';
import { useUnit } from '#/hooks';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
  property: DevicePropertyMetadata; // Property Metadata
}>();

const open = defineModel<boolean>('open');

const activeTab = ref('list');
const timeRange = ref<[Dayjs, Dayjs]>([dayjs().subtract(1, 'hour'), dayjs()]);

const getSearchSchemas = (): YlDcFormSchema[] => {
  if (!props.property) return [];

  const type = props.property.valueType?.type;
  let valueComponent = 'Input';
  let valueComponentProps = {};

  if (type === 'BOOLEAN') {
    const booleanValueType = props.property.valueType as BooleanTypeDef;
    valueComponent = 'Select';
    valueComponentProps = {
      options: [
        {
          label: booleanValueType.trueText || '是',
          value: booleanValueType.trueValue ?? true,
        },
        {
          label: booleanValueType.falseText || '否',
          value: booleanValueType.falseValue ?? false,
        },
      ],
    };
  } else if (type === 'ENUM') {
    const enumValueType = props.property.valueType as EnumTypeDef;
    valueComponent = 'Select';
    valueComponentProps = {
      options: enumValueType.enums?.map((e: any) => ({
        label: e.text,
        value: e.value,
      })),
    };
  } else if (['DOUBLE', 'FLOAT', 'INTEGER', 'LONG'].includes(type)) {
    valueComponent = 'InputNumber';
  }

  return [
    {
      field: 'timestamp',
      label: '时间',
      component: 'DatePicker',
      componentProps: {
        valueFormat: 'x',
        showTime: true,
        type: 'datetime',
      },
      termTypes: ['lte', 'lt', 'gte', 'gt'],
    },
    {
      field: 'value',
      label: '原始值',
      component: valueComponent as any,
      componentProps: valueComponentProps,
      termTypes: ['eq', 'like', 'gt', 'lt', 'btw'],
    },
  ];
};

const [TableCard, gridApi] = useYlVxeTableCard<any>({
  mode: 'table',
  showSearchForm: true,
  separator: false,
  searchFormMode: 'yl-dc-form',
  ylDcFromOptions: {
    showMoreButton: false,
    storeOption: {
      mode: 'localstorage',
      conf: {
        storageKey: `device-prop-history-${props.property?.id}`,
      },
    },
    formSchemas: getSearchSchemas(),
  },
  gridOptions: {
    height: 'auto',
    columns: [
      { type: 'seq', width: 60 },
      {
        field: 'timestamp',
        title: '时间',
        width: 180,
        formatter: 'formatDateTime',
      },
      {
        field: 'formatValue',
        title: `${props.property.name}（格式化值）`,
        formatter: (params: any) => {
          return params.row.formatValue;
        },
      },
      {
        field: 'value',
        title: '原始值',
        formatter: (params: any) => {
          return params.row.value;
        },
      },
    ],
    proxyConfig: {
      enabled: true,
      ajax: {
        query: async (params: any, ...args: any[]) => {
          const { page } = params;
          if (!props.device?.id || !props.property?.id) {
            return { items: [], total: 0 };
          }

          const formValues = args[0] || {};
          const terms = [];
          if (timeRange.value && timeRange.value.length === 2) {
            terms.push({
              terms: [
                {
                  column: 'timestamp',
                  termType: 'btw',
                  value: timeRange.value.map((i) => i.valueOf()),
                },
              ],
            });
          }
          terms.push(...(formValues.terms || []));

          const res = await getPropertyDataPage(
            props.device.id,
            props.property.id,
            {
              pageIndex: page.currentPage - 1,
              pageSize: page.pageSize,
              terms,
              sorts: [{ name: 'timestamp', order: 'desc' }],
            },
          );
          return {
            items: res.data,
            total: res.total,
          };
        },
      },
      response: {
        result: 'items',
        total: 'total',
      },
    },
    pagerConfig: {
      enabled: true,
    },
    toolbarConfig: {
      search: true,
      refresh: true,
      custom: true,
    },
  },
});

function handleDateChange() {
  if (activeTab.value === 'list') {
    gridApi.reload();
  } else {
    fetchChartData();
  }
}

// --- Chart View Logic ---
const { getSymbol } = useUnit();
const chartLoading = ref(false);
const chartOption = ref<any>(null);
const interval = ref<'1d' | '1h' | '1m' | 'raw'>('raw');
const aggType = ref<AggType>('AVG');

const intervalOptions = [
  { label: '实际值', value: 'raw' },
  { label: '1分钟', value: '1m' },
  { label: '1小时', value: '1h' },
  { label: '1天', value: '1d' },
];

const isNumericType = (type: string) => {
  return ['DOUBLE', 'FLOAT', 'INTEGER', 'LONG'].includes(type);
};

const aggOptions = computed(() => {
  const isNum = props.property && isNumericType(props.property.valueType?.type);
  if (!isNum) {
    return [{ label: AGG_TYPE_ENUM.COUNT.label, value: 'COUNT' }];
  }
  return Object.values(AGG_TYPE_ENUM).map((item) => ({
    label: item.label,
    value: item.value,
  }));
});

// Watchers for chart
watch(interval, (val) => {
  if (val !== 'raw') {
    const isNum =
      props.property && isNumericType(props.property.valueType?.type);
    if (!isNum && aggType.value !== 'COUNT') {
      aggType.value = 'COUNT';
    }
  }
  fetchChartData();
});

watch(aggType, () => {
  if (interval.value !== 'raw') {
    fetchChartData();
  }
});

watch(
  () => open.value,
  (val) => {
    if (val) {
      nextTick(() => {
        if (activeTab.value === 'list') {
          gridApi.reload();
        } else {
          fetchChartData();
        }
      });
    }
  },
);

watch(activeTab, (val) => {
  nextTick(() => {
    if (val === 'list') {
      gridApi.reload();
    } else {
      fetchChartData();
    }
  });
});

async function fetchChartData() {
  if (
    !open.value ||
    activeTab.value !== 'chart' ||
    !props.device?.id ||
    !props.property?.id
  )
    return;
  if (!timeRange.value || timeRange.value.length !== 2) return;

  chartLoading.value = true;
  try {
    const [start, end] = timeRange.value;
    const unit = getSymbol(
      (props.property?.valueType as NumberTypeDef)?.unit || '',
    );
    const color = '#1890ff';

    let xAxisData: string[] = [];
    let seriesData: any[] = [];

    if (interval.value === 'raw') {
      const res = await getPropertyDataList(
        props.device.id,
        props.property.id,
        {
          paging: false,
          terms: [
            {
              column: 'timestamp',
              termType: 'btw',
              value: timeRange.value.map((i) => i.valueOf()),
            },
          ],
          sorts: [{ name: 'timestamp', order: 'asc' }],
        },
      );
      xAxisData = res.map((item) => formatDateTime(item.timestamp));
      seriesData = res.map((item) => item.value);
    } else {
      const res = await getDevicePropertyAggData(props.device.id, {
        columns: [
          {
            property: props.property.id,
            alias: 'val',
            agg: aggType.value,
          },
        ],
        query: {
          interval: interval.value,
          format: 'yyyy-MM-dd HH:mm:ss',
          from: start.valueOf(),
          to: end.valueOf(),
        },
      });

      // Sort by time string (ascending)
      res.sort((a: any, b: any) => {
        const tA = a.time || '';
        const tB = b.time || '';
        return tA.localeCompare(tB);
      });

      xAxisData = res.map((item: any) => item.time);
      seriesData = res.map((item: any) => item.val);
    }

    chartOption.value = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const item = params[0];
          const val = item.value ?? '--';
          return `${item.name}<br/>${item.marker}${item.seriesName}: ${val} ${unit}`;
        },
      },
      grid: {
        left: '20',
        right: '20',
        bottom: '60',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: `{value} ${unit}`,
        },
      },
      series: [
        {
          name: props.property.name,
          type: 'line',
          smooth: true,
          showSymbol: false,
          itemStyle: { color },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${color}4D` },
                { offset: 1, color: `${color}00` },
              ],
            },
          },
          data: seriesData,
        },
      ],
    };
  } catch (error) {
    console.error(error);
  } finally {
    chartLoading.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    :title="`历史数据: ${property?.name} (${property?.id})`"
    width="1000px"
    :footer="null"
    centered
  >
    <div class="flex h-[700px] flex-col gap-4 py-4">
      <!-- Top Date Picker -->
      <div class="flex items-center gap-2 px-2">
        <YlDateRangePicker
          v-model:value="timeRange"
          @change="handleDateChange"
        />
      </div>

      <Tabs v-model:active-key="activeTab" class="flex-1 overflow-hidden">
        <Tabs.TabPane key="list" tab="列表数据" class="h-full">
          <div class="h-[550px] overflow-hidden">
            <TableCard />
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane key="chart" tab="趋势图表">
          <div class="flex flex-col gap-4">
            <!-- Chart Toolbar -->
            <div class="flex items-center gap-4 px-2 pt-2">
              <Space>
                <span class="text-sm font-medium">统计周期:</span>
                <Select
                  v-model:value="interval"
                  :options="intervalOptions"
                  style="width: 120px"
                />
              </Space>
              <Space v-if="interval !== 'raw'">
                <span class="text-sm font-medium">统计规则:</span>
                <Select
                  v-model:value="aggType"
                  :options="aggOptions"
                  style="width: 120px"
                />
              </Space>
            </div>
            <!-- Chart Container -->
            <div
              class="relative h-[500px] overflow-hidden rounded-md border border-border/50 bg-background p-4"
            >
              <Chart
                v-if="chartOption"
                :options="chartOption"
                :loading="chartLoading"
              />
              <div
                v-else-if="!chartLoading"
                class="flex h-full items-center justify-center text-muted-foreground"
              >
                暂无数据
              </div>
            </div>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  </Modal>
</template>
