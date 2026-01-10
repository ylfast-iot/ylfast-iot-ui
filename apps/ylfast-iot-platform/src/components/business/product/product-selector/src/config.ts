import type { QueryParamEntity } from '#/adapter';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { IotDeviceProductApi as ProductApi } from '#/api/iot/device/product';

export const searchFormSchemas: YlDcFormSchema[] = [
  {
    field: 'id',
    label: 'ID',
    component: 'Input',
    termTypes: ['eq', 'like'],
  },
  {
    field: 'productName',
    label: '名称',
    component: 'Input',
    termTypes: ['eq', 'like'],
  },
];

export const tableColumns: VxeGridProps['columns'] = [
  { field: 'id', title: 'ID', width: 180 },
  { field: 'productName', title: '产品名称', minWidth: 150 },
  {
    field: 'productType',
    title: '产品类型',
    width: 120,
    slots: { default: 'productType' },
  },
];

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
