<script setup lang="ts">
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { IotDeviceProductApi } from '#/api/iot/device/product';
import type { DeviceMetadata } from '#/types/metadata';

import { ref, watch } from 'vue';

import { $t } from '@vben/locales';

import { Button, Card, Input, message, Popconfirm } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { IotDeviceProductApi as ProductApi } from '#/api/iot/device/product';

const props = defineProps<{
  product: IotDeviceProductApi.ProductDetail;
}>();

const emit = defineEmits(['update:product']);

function parseMetadata(tsl?: string) {
  if (!tsl) return {} as DeviceMetadata;
  try {
    return JSON.parse(tsl) as DeviceMetadata;
  } catch (error) {
    console.error(error);
    return {} as DeviceMetadata;
  }
}

const metadata = ref<DeviceMetadata>(parseMetadata(props.product.tsl));

watch(
  () => props.product.tsl,
  (tsl) => {
    metadata.value = parseMetadata(tsl);
    gridApi.reload();
  },
);

interface RowVO {
  originalId: string;
  propertyId: string;
  propertyName: string;
}

const gridOptions: VxeGridProps<RowVO> = {
  columns: [
    { type: 'checkbox', width: 50 },
    { type: 'seq', width: 50 },
    {
      field: 'propertyName',
      title: $t('device.instance.attrMapping.propertyName'),
      width: 300,
    },
    {
      field: 'propertyId',
      title: $t('device.instance.attrMapping.propertyId'),
    },
    {
      field: 'originalId',
      slots: { default: 'originalId' },
      editRender: {},
      title: $t('device.instance.attrMapping.mappingId'),
    },
  ],
  border: true,
  minHeight: 500,
  pagerConfig: {
    enabled: false,
  },
  proxyConfig: {
    ajax: {
      query: async () => {
        return loadData();
      },
    },
    response: {
      list: '',
    },
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    slots: {
      buttons: 'toolbar_buttons',
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function loadData() {
  try {
    const properties = metadata.value.properties || [];
    const mapping = metadata.value.expands?.propertyMapping || {};

    return properties.map((prop) => ({
      originalId: mapping[prop.id] || '',
      propertyId: prop.id,
      propertyName: prop.name,
    }));
  } catch (error) {
    console.error('Failed to parse TSL', error);
    return [];
  }
}

function handleBatchUnbind() {
  const records = gridApi.grid.getCheckboxRecords();
  if (records.length === 0) {
    message.warning($t('common.tip.selectData') || '请选择数据');
    return;
  }

  records.forEach((row) => {
    row.originalId = '';
  });
  handleSave();
}

async function handleSave() {
  if (!metadata.value) return;

  const { fullData } = gridApi.grid.getTableData();
  const mapping: Record<string, string> = {};

  fullData.forEach((row) => {
    // Filter null, undefined, and empty string, but allow 0
    if (
      row.originalId !== null &&
      row.originalId !== undefined &&
      row.originalId !== ''
    ) {
      mapping[row.propertyId] = row.originalId;
    }
  });

  if (!metadata.value.expands) {
    metadata.value.expands = {
      propertyGroups: [],
      propertyMapping: {},
    };
  }

  metadata.value.expands.propertyMapping = mapping;

  try {
    const updatedTsl = JSON.stringify(metadata.value);
    const updateData = {
      ...props.product,
      tsl: updatedTsl,
    };

    // Use patchSave as requested
    await ProductApi.basicCrudApis.patchSave(updateData);

    emit('update:product', updateData);
    message.success($t('common.saveSuccess'));
    // Reload grid to reflect saved state if needed, though strictly strictly not required if local state matches
    gridApi.reload();
  } catch (error) {
    console.error(error);
    message.error($t('common.saveFailed') || '保存失败');
  }
}
</script>

<template>
  <div class="flex h-full p-4">
    <!-- Left: Mapping Table -->
    <div class="flex-1 pr-4">
      <Grid>
        <template #toolbar_buttons>
          <div class="flex gap-2">
            <Popconfirm
              :title="$t('common.confirmUnbind')"
              @confirm="handleBatchUnbind"
            >
              <Button> {{ $t('common.action.batchUnbind') }} </Button>
            </Popconfirm>
            <Button type="primary" @click="handleSave">
              {{ $t('common.action.save') }}
            </Button>
          </div>
        </template>
        <template #originalId="{ row }">
          <Input
            v-model:value="row.originalId"
            :placeholder="
              $t('device.instance.attrMapping.mappingIdPlaceholder')
            "
          />
        </template>
      </Grid>
    </div>

    <!-- Right: Description -->
    <div class="w-1/3 min-w-[300px]">
      <Card :bordered="false" class="h-full bg-gray-50 dark:bg-[#1e1e1e]">
        <template #title>
          <div class="flex items-center gap-2">
            <span class="font-bold">{{
              $t('device.instance.attrMapping.helpTitle')
            }}</span>
          </div>
        </template>
        <div class="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          <p class="mb-4">
            {{ $t('device.instance.attrMapping.helpDesc') }}
          </p>
          <div class="space-y-4">
            <div>
              <div class="mb-1 font-medium text-gray-800 dark:text-gray-200">
                {{ $t('device.instance.attrMapping.propertyId') }}
              </div>
              <div class="text-xs">
                {{ $t('device.instance.attrMapping.helpPlatformId') }}
              </div>
            </div>
            <div>
              <div class="mb-1 font-medium text-gray-800 dark:text-gray-200">
                {{ $t('device.instance.attrMapping.mappingId') }}
              </div>
              <div class="text-xs">
                {{ $t('device.instance.attrMapping.helpMappingId') }}
              </div>
            </div>
            <div>
              <div class="mb-1 font-medium text-gray-800 dark:text-gray-200">
                {{ $t('device.instance.attrMapping.example') }}
              </div>
              <div class="rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
                <div class="mb-1">
                  {{ $t('device.instance.attrMapping.examplePlatform') }}:
                  temperature
                </div>
                <div>
                  {{ $t('device.instance.attrMapping.exampleDevice') }}:
                  temp_val
                </div>
                <div class="mt-1 text-blue-500">
                  {{ $t('device.instance.attrMapping.exampleConfig') }}:
                  temperature -> temp_val
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
