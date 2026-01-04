<script setup lang="ts">
import type { TermType } from '#/adapter';
import type { YlDcFormSchema } from '#/components/yl-dc-form';
import type { DeviceEventMetadata } from '#/types/metadata';

import { computed, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { Button, Modal } from 'ant-design-vue';

import { IotDeviceInstanceApi } from '#/api';
import { getEventDataPage } from '#/api/iot/device/data';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
  event: DeviceEventMetadata;
}>();

const InfoIcon = createIconifyIcon('lucide:info');
const AlertTriangleIcon = createIconifyIcon('lucide:alert-triangle');

const detailVisible = ref(false);
const currentDetail = ref<any>({});

function handleDetail(row: any) {
  currentDetail.value = row;
  detailVisible.value = true;
}

const eventIcon = computed(() => {
  if (props.event.eventType?.type === 'ALARM') {
    return AlertTriangleIcon;
  }
  return InfoIcon;
});

const eventColor = computed(() => {
  if (props.event.eventType?.type === 'ALARM') {
    return 'text-orange-500';
  }
  return 'text-blue-500';
});

function formatEventValue(val: any, metadata: any) {
  if (val === undefined || val === null) return '--';
  const type = metadata.valueType?.type;
  if (type === 'BOOLEAN') {
    const vt = metadata.valueType;
    const isTrue = val === true || val === 'true' || val === vt.trueValue;
    return isTrue ? vt.trueText || '是' : vt.falseText || '否';
  }
  if (type === 'ENUM') {
    const vt = metadata.valueType;
    const item = vt.enums?.find((e: any) => e.value === val);
    return item?.label || item?.text || val;
  }
  return val;
}

const getSearchSchemas = (): YlDcFormSchema[] => {
  const schemas: YlDcFormSchema[] = [
    {
      field: 'createTime',
      label: '发生时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        valueFormat: 'x',
      },
      termTypes: ['btw', 'gt', 'lt', 'gte', 'lte'],
    },
  ];

  const output = props.event.output;
  if (output.type === 'OBJECT') {
    const properties = (output as any).properties || [];
    properties.forEach((p: any) => {
      const type = p.valueType?.type;
      let component = 'Input';
      let componentProps = {};
      let termTypes: TermType[] = ['eq', 'like', 'nlike'];

      if (type === 'BOOLEAN') {
        component = 'Select';
        componentProps = {
          options: [
            {
              label: p.valueType.trueText || '是',
              value: p.valueType.trueValue ?? true,
            },
            {
              label: p.valueType.falseText || '否',
              value: p.valueType.falseValue ?? false,
            },
          ],
        };
        termTypes = ['eq'];
      } else if (type === 'ENUM') {
        component = 'Select';
        componentProps = {
          options: p.valueType.enums?.map((e: any) => ({
            label: e.text,
            value: e.value,
          })),
        };
        termTypes = ['eq', 'in', 'nin'];
      } else if (['DOUBLE', 'FLOAT', 'INTEGER', 'LONG'].includes(type)) {
        component = 'InputNumber';
        termTypes = ['eq', 'gt', 'lt', 'gte', 'lte', 'btw'];
      } else if (type === 'DATE') {
        component = 'DatePicker';
        componentProps = {
          showTime: true,
          valueFormat: 'x',
        };
        termTypes = ['btw', 'gt', 'lt', 'gte', 'lte'];
      }

      schemas.push({
        field: p.id,
        label: p.name,
        component: component as any,
        componentProps,
        termTypes,
      });
    });
  } else {
    // Simple type
    const type = output.type;
    let component = 'Input';
    const componentProps = {};
    let termTypes: TermType[] = ['eq', 'like'];

    if (['DOUBLE', 'FLOAT', 'INTEGER', 'LONG'].includes(type)) {
      component = 'InputNumber';
      termTypes = ['eq', 'gt', 'lt', 'gte', 'lte', 'btw'];
    }
    schemas.push({
      field: 'value',
      label: '数据值',
      component: component as any,
      componentProps,
      termTypes,
    });
  }

  return schemas;
};

const getColumns = () => {
  const baseCols = [
    { type: 'seq', width: 60 },
    {
      field: 'createTime',
      title: '发生时间',
      width: 180,
      formatter: 'formatDateTime',
    },
  ];

  const output = props.event.output;
  if (output.type === 'OBJECT') {
    const properties = (output as any).properties || [];
    properties.forEach((p: any) => {
      baseCols.push({
        field: p.id,
        title: `${p.name} (${p.id})`,
        minWidth: 150,
        formatter: ({ row }: any) => {
          const val = row[p.id] ?? row.value?.[p.id];
          return formatEventValue(val, p);
        },
      } as any);
    });
  } else {
    baseCols.push({
      field: 'value',
      title: '数据值',
      minWidth: 150,
      formatter: ({ row }: any) => {
        const val = row.value === undefined ? '--' : row.value;
        // Construct a temporary metadata object for simple output type
        const metadata = { valueType: output };
        return formatEventValue(val, metadata);
      },
    } as any);
  }

  // Add Action Column
  baseCols.push({
    title: '操作',
    field: 'action',
    fixed: 'right',
    width: 100,
    slots: { default: 'action' },
  } as any);
  return baseCols as any[];
};

const [TableCard, gridApi] = useYlVxeTableCard<any>({
  mode: 'table',
  showSearchForm: true,
  searchFormMode: 'yl-dc-form',
  ylDcFromOptions: {
    showMoreButton: false,
    formSchemas: getSearchSchemas(),
  },
  separator: false,
  // Assuming simple history list for now.
  gridOptions: {
    columns: getColumns(),
    rowConfig: {
      keyField: 'createTime',
    },
    height: 'auto',
    proxyConfig: {
      enabled: true,
      ajax: {
        query: async ({ page }: any, ...args: any[]) => {
          if (!props.device?.id || !props.event?.id) {
            return { items: [], total: 0 };
          }
          const formValues = args[0] || {};
          const res = await getEventDataPage(props.device.id, props.event.id, {
            pageIndex: page.currentPage - 1,
            pageSize: page.pageSize,
            terms: formValues.terms || [],
            sorts: [{ name: 'createTime', order: 'desc' }],
          });
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
      search: true, // Enable search toggle
      refresh: true,
      custom: true,
    },
  },
});

watch(
  () => props.event.id,
  () => {
    if (props.event) {
      gridApi.getDcFormApi().setProps({
        formSchemas: getSearchSchemas(),
      });
      // @ts-ignore
      gridApi.setGridOptions({
        columns: getColumns(),
      });
      gridApi.reload();
    }
  },
);
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-border/50 bg-background px-6 py-3"
    >
      <div class="flex items-center gap-2">
        <component :is="eventIcon" class="size-5" :class="eventColor" />
        <span class="font-bold">{{ event.name }}</span>
        <span class="font-mono text-xs text-muted-foreground">
          ({{ event.id }})
        </span>
      </div>
    </div>

    <!-- Content -->

    <div class="flex-1 overflow-hidden p-4">
      <TableCard>
        <template #action="{ row }">
          <Button type="link" size="small" @click="handleDetail(row)">
            查看详情
          </Button>
        </template>
      </TableCard>
    </div>

    <Modal
      v-model:open="detailVisible"
      title="事件数据详情"
      :footer="null"
      width="600px"
    >
      <div
        class="max-h-[500px] overflow-auto rounded bg-slate-50 p-4 dark:bg-slate-900"
      >
        <pre class="font-mono text-xs">{{
          JSON.stringify(currentDetail, null, 2)
        }}</pre>
      </div>
    </Modal>
  </div>
</template>
