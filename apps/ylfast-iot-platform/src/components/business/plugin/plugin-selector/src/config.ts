import type { QueryParamEntity } from '#/adapter';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { getPluginTypes, IotPluginApi } from '#/api/iot/plugin';

/**
 * 获取插件类型选项
 */
export const fetchPluginTypeOptions = () =>
  getPluginTypes().then((res) =>
    res.map((item) => ({
      label: item.name || item.text,
      value: item.id || item.value,
    })),
  );

export function usePluginSelectorConfig() {
  const searchFormSchemas = computed<YlDcFormSchema[]>(() => [
    {
      field: 'id',
      label: 'ID',
      component: 'Input',
      termTypes: ['eq', 'like'],
    },
    {
      field: 'name',
      label: $t('plugin.name'),
      component: 'Input',
      termTypes: ['eq', 'like'],
    },
    {
      field: 'type',
      label: $t('plugin.type'),
      component: 'ApiSelect',
      componentProps: {
        api: fetchPluginTypeOptions,
        placeholder: $t('common.placeholder.select'),
      },
      termTypes: ['eq'],
    },
  ]);

  const tableColumns = computed<VxeGridProps['columns']>(() => [
    { field: 'id', title: 'ID', width: 180 },
    {
      field: 'name',
      title: $t('plugin.name'),
      minWidth: 150,
    },
    {
      field: 'type',
      title: $t('plugin.type'),
      width: 120,
      slots: { default: 'type' },
    },
    {
      field: 'version',
      title: $t('plugin.version'),
      width: 100,
    },
    {
      field: 'description',
      title: $t('common.description'),
      minWidth: 200,
      slots: { default: 'description' },
    },
  ]);

  return {
    searchFormSchemas,
    tableColumns,
  };
}

export async function queryPluginList(params: QueryParamEntity) {
  return await IotPluginApi.basicCrudApis.postQuery({
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    terms: params.terms || [],
    sorts: [{ name: 'createTime', order: 'desc' }],
  });
}

export async function queryPluginListNoPaging(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const res = await IotPluginApi.basicCrudApis.postQueryNoPaging({
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
