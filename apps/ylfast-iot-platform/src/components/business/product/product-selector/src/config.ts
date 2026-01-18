import type { QueryParamEntity } from '#/adapter';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { YlDcFormSchema } from '#/components/yl-dc-form';
import type { DeviceType } from '#/enums/device';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { IotDeviceProductApi as ProductApi } from '#/api/iot/device/product';
import { DEVICE_TYPE_ENUMS } from '#/enums/device';

export function useProductSelectorConfig() {
  const searchFormSchemas = computed<YlDcFormSchema[]>(() => [
    {
      field: 'id',
      label: 'ID',
      component: 'Input',
      termTypes: ['eq', 'like'],
    },
    {
      field: 'productName',
      label: $t('device.product.productName'),
      component: 'Input',
      termTypes: ['eq', 'like'],
    },
  ]);

  const tableColumns = computed<VxeGridProps['columns']>(() => [
    { field: 'id', title: 'ID', width: 180 },
    {
      field: 'productName',
      title: $t('device.product.productName'),
      minWidth: 150,
    },
    {
      field: 'productType',
      title: $t('device.product.productType'),
      width: 120,
      slots: { default: 'productType' },
    },
  ]);

  return {
    searchFormSchemas,
    tableColumns,
  };
}

export async function queryProductList(params: QueryParamEntity) {
  return await ProductApi.basicCrudApis.postQuery({
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    terms: params.terms || [],
    sorts: [{ name: 'createTime', order: 'desc' }],
  });
}

export async function queryProductListNoPaging(ids: any[]) {
  if (!ids || ids.length === 0) return [];
  const res = await ProductApi.basicCrudApis.postQueryNoPaging({
    terms: [
      {
        column: 'id',
        termType: 'in',
        value: ids.join(','),
      },
    ],
  });
  return res || [];
}

export function getDeviceTypeInfo(deviceType: any) {
  const typeValue = (deviceType?.value || deviceType) as DeviceType;
  return (
    DEVICE_TYPE_ENUMS[typeValue] || {
      color: 'default',
      label: typeValue,
    }
  );
}

export function getProductStateInfo(state: any) {
  const stateValue = state?.value === undefined ? state : state.value;

  return stateValue === 1
    ? {
        label: $t('common.enable'),
        statusColor: 'success',
        value: stateValue,
      }
    : {
        label: $t('common.disable'),
        statusColor: 'error',
        value: stateValue,
      };
}
