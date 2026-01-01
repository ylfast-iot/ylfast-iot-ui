<script setup lang="ts">
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
}>();

const gridOptions: VxeGridProps<any> = {
  columns: [
    { type: 'seq', width: 60 },
    { field: 'propertyId', title: '物模型属性ID', width: 150 },
    { field: 'propertyName', title: '属性名称', width: 150 },
    { field: 'originalId', title: '原始标识/寄存器地址', width: 200 },
    { field: 'dataType', title: '原始数据类型', width: 120 },
    { field: 'description', title: '说明' },
  ],
  data: [], // Placeholder
};

const [Grid] = useVbenVxeGrid({ gridOptions });
</script>

<template>
  <div class="flex h-full flex-col gap-4 p-4">
    <div class="flex items-center justify-between">
      <div class="text-sm font-bold text-gray-500">属性映射列表</div>
      <div class="text-xs italic text-gray-400">
        映射设备原始数据到物模型属性
      </div>
    </div>
    <Grid class="flex-1" />
  </div>
</template>
