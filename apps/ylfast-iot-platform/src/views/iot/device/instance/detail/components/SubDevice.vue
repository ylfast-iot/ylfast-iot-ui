<script setup lang="ts">
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDeviceDetailsPage } from '#/api/iot/device/instance';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
}>();

const gridOptions: VxeGridProps<IotDeviceInstanceApi.DeviceDetail> = {
  columns: [
    { type: 'seq', width: 60 },
    { field: 'id', title: '设备ID', width: 180 },
    { field: 'deviceName', title: '设备名称' },
    { field: 'productName', title: '所属产品' },
    {
      field: 'deviceState',
      title: '状态',
      width: 100,
      slots: { default: 'state' },
    },
    {
      field: 'createTime',
      title: '添加时间',
      width: 180,
      formatter: 'formatDateTime',
    },
  ],
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        return await getDeviceDetailsPage({
          pageIndex: page.currentPage - 1,
          pageSize: page.pageSize,
          terms: [
            {
              column: 'parentDeviceId',
              value: props.device.id,
            },
          ],
        });
      },
    },
  },
};

const [Grid] = useVbenVxeGrid({ gridOptions });
</script>

<template>
  <div class="h-full p-4">
    <Grid>
      <template #state="{ row }">
        <div class="flex items-center gap-2">
          <span
            class="h-2 w-2 rounded-full"
            :class="
              row.deviceState === 'online' ? 'bg-green-500' : 'bg-gray-400'
            "
          ></span>
          <span>{{ row.deviceState === 'online' ? '在线' : '离线' }}</span>
        </div>
      </template>
    </Grid>
  </div>
</template>
