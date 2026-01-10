<script setup lang="ts">
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { ref } from 'vue';

import { JsonViewer } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Button, Modal, Tag } from 'ant-design-vue';

import { DeviceDataApi, getDeviceLogs } from '#/api/iot/device/data';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';
import { useDict } from '#/hooks';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
}>();

const { getDictItem } = useDict('device-log-type');

const detailVisible = ref(false);
const currentLog = ref<DeviceDataApi.DeviceLogData | null>(null);

const formattedContent = ref({});

const schemas: YlDcFormSchema[] = [
  {
    label: $t('device.instance.logs.time'),
    field: 'timestamp',
    component: 'DatePicker',
    componentProps: {
      showTime: true,
      valueFormat: 'x',
      type: 'datetimerange',
    },
    termTypes: ['btw'],
  },
  {
    label: $t('device.instance.logs.type'),
    field: 'type',
    component: 'ApiSelect',
    componentProps: {
      api: getDictItem,
    },
    termTypes: ['eq', 'in'],
  },
  {
    label: $t('device.instance.logs.content'),
    field: 'content',
    component: 'Input',
    termTypes: ['like'],
  },
];

const gridQuery = async (params: any, ...args: any[]) => {
  const { page } = params;
  const formValues = args[0] || {};
  const { terms = [] } = formValues;

  const res = await getDeviceLogs(props.device.id, {
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    terms: [...terms],
    sorts: [{ name: 'timestamp', order: 'desc' }],
  });

  return {
    // API signature says it returns DeviceLogData[], but usually logs are paged.
    // If it's not paged, I'll need to adjust.
    // Wait, the API definition in data.ts says returns DeviceLogData[]:
    // export const getDeviceLogs = (deviceId: string, params: QueryParamEntity) => {
    //   return requestClient.post<DeviceDataApi.DeviceLogData[]>(...)
    // }
    // However, QueryParamEntity usually implies paging.
    // If it returns an array directly, total is array length.
    items: Array.isArray(res) ? res : (res as any).data || [],
    total: Array.isArray(res) ? res.length : (res as any).total || 0,
  };
};

const [TableCard] = useYlVxeTableCard<DeviceDataApi.DeviceLogData>({
  tableTitle: $t('device.instance.tab.logs'),
  showSearchForm: true,
  searchFormMode: 'yl-dc-form',
  ylDcFromOptions: {
    formSchemas: schemas,
  },
  mode: 'table',
  gridOptions: {
    columns: [
      { type: 'seq', width: 60 },
      {
        field: 'timestamp',
        title: $t('device.instance.logs.time'),
        width: 180,
        formatter: 'formatDateTime',
      },
      {
        field: 'type',
        title: $t('device.instance.logs.type'),
        width: 160,
        slots: { default: 'type' },
      },
      {
        field: 'content',
        title: $t('device.instance.logs.content'),
        minWidth: 200,
        slots: { default: 'content' },
      },
      {
        title: $t('common.action.label'),
        width: 100,
        fixed: 'right',
        slots: { default: 'action' },
      },
    ],
    proxyConfig: {
      enabled: true,
      ajax: {
        query: gridQuery,
      },
      response: {
        result: 'items',
        total: 'total',
      },
    },
    height: 'auto',
    border: true,
    stripe: true,
  },
  separator: false,
});

function showDetail(row: DeviceDataApi.DeviceLogData) {
  currentLog.value = row;
  try {
    formattedContent.value = JSON.parse(row.content);
    if (typeof formattedContent.value === 'string') {
      formattedContent.value = JSON.parse(formattedContent.value);
    }
  } catch {
    formattedContent.value = {
      content: row.content,
    };
  }
  detailVisible.value = true;
}
</script>

<template>
  <div class="h-full p-4">
    <TableCard>
      <template #type="{ row }">
        <Tag color="blue">{{ row.type?.text }}</Tag>
      </template>
      <template #content="{ row }">
        <div
          class="cursor-pointer truncate hover:text-primary"
          @click="showDetail(row)"
        >
          {{ row.content }}
        </div>
      </template>
      <template #action="{ row }">
        <Button
          type="link"
          size="small"
          class="text-primary"
          @click="showDetail(row)"
        >
          {{ $t('common.action.view') }}
        </Button>
      </template>
    </TableCard>

    <Modal
      v-model:open="detailVisible"
      :title="$t('device.instance.logs.detail')"
      :footer="null"
      :width="800"
      :body-style="{
        height: '600px',
        overflow: 'auto',
      }"
      centered
    >
      <JsonViewer
        v-model:value="formattedContent"
        :expand-depth="5"
        :expand-icon="true"
      />
    </Modal>
  </div>
</template>
