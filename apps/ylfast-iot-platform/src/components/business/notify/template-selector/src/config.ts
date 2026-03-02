import type { QueryParamEntity } from '#/adapter';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { IotNotifyTemplateApi as TemplateApi } from '#/api/iot/notify/template';

export function useNotifyTemplateSelectorConfig() {
  const searchFormSchemas = computed<YlDcFormSchema[]>(() => [
    {
      component: 'Input',
      field: 'id',
      label: 'ID',
      termTypes: ['eq', 'like'],
    },
    {
      component: 'Input',
      field: 'name',
      label: $t('common.name'),
      termTypes: ['eq', 'like'],
    },
    {
      component: 'Input',
      field: 'type',
      label: '类型',
      termTypes: ['eq', 'like'],
    },
    {
      component: 'Input',
      field: 'provider',
      label: '服务商',
      termTypes: ['eq', 'like'],
    },
  ]);

  const tableColumns = computed<VxeGridProps['columns']>(() => [
    { field: 'id', title: 'ID', width: 180 },
    { field: 'name', minWidth: 150, title: $t('common.name') },
    { field: 'type', title: '类型', width: 120 },
    { field: 'provider', title: '服务商', width: 120 },
    { field: 'description', title: $t('common.description') },
  ]);

  return {
    searchFormSchemas,
    tableColumns,
  };
}

export async function queryNotifyTemplateList(params: QueryParamEntity) {
  return await TemplateApi.basicCrudApis.postQuery({
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sorts: [{ name: 'createTime', order: 'desc' }],
    terms: params.terms || [],
  });
}

export async function queryNotifyTemplateListNoPaging(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const res = await TemplateApi.basicCrudApis.postQueryNoPaging({
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
