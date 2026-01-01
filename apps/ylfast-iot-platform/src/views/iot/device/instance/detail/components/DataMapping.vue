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
    { field: 'channelId', title: '通道/节点ID', width: 150 },
    { field: 'pointId', title: '测点标识', width: 150 },
    { field: 'mappingPropertyId', title: '对应物模型属性', width: 150 },
    { field: 'interval', title: '采集间隔(ms)', width: 120 },
    { field: 'status', title: '状态', width: 100 },
  ],
  data: [], // Placeholder
};

const [Grid] = useVbenVxeGrid({ gridOptions });
</script>

<template>
  <div class="flex h-full flex-col gap-4 p-4">
    <div class="flex items-center justify-between">
      <div class="text-sm font-bold text-gray-500">数采映射配置</div>
      <div class="text-xs italic text-gray-400">
        配置网关或数采软件的测点映射关系
      </div>
    </div>
    <Grid class="flex-1" />
  </div>
</template>
