import type { QueryParamEntity } from '#/adapter';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { IotDeviceProductApi as ProductApi } from '#/api/iot/device/product';

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
