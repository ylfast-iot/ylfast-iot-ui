import type { QueryParamEntity } from '#/adapter';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { IotProtocolApi } from '#/api/iot/protocol';

export function useProtocolSelectorConfig() {
  const searchFormSchemas = computed<YlDcFormSchema[]>(() => [
    {
      field: 'protocolId',
      label: 'ID',
      component: 'Input',
      termTypes: ['eq', 'like'],
    },
    {
      field: 'protocolName',
      label: $t('protocol.name'),
      component: 'Input',
      termTypes: ['eq', 'like'],
    },
    {
      field: 'protocolType',
      label: $t('protocol.type'),
      component: 'Select',
      componentProps: {
        options: [
          { label: 'JAR', value: 'jar' },
          { label: 'SCRIPT', value: 'script' },
          { label: 'LOCAL', value: 'local' },
        ],
      },
      termTypes: ['eq'],
    },
  ]);

  const tableColumns = computed<VxeGridProps['columns']>(() => [
    { field: 'protocolId', title: 'ID', width: 180 },
    {
      field: 'protocolName',
      title: $t('protocol.name'),
      minWidth: 150,
    },
    {
      field: 'protocolType',
      title: $t('protocol.type'),
      width: 120,
      slots: { default: 'protocolType' },
    },
    {
      field: 'protocolDescription',
      title: $t('protocol.description'),
      minWidth: 200,
      slots: { default: 'protocolDescription' },
    },
  ]);

  return {
    searchFormSchemas,
    tableColumns,
  };
}

export async function queryProtocolList(params: QueryParamEntity) {
  return await IotProtocolApi.basicCrudApis.postQuery({
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    terms: params.terms || [],
    sorts: [{ name: 'createTime', order: 'desc' }],
  });
}

export async function queryProtocolListNoPaging(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const res = await IotProtocolApi.basicCrudApis.postQueryNoPaging({
    terms: [
      {
        column: 'protocolId',
        termType: 'in',
        value: ids.join(','),
      },
    ],
  });
  return res || [];
}

export function getProtocolTypeInfo(type: string) {
  switch (type?.toLowerCase()) {
    case 'jar': {
      return { color: 'blue', label: 'JAR', icon: 'lucide:coffee' };
    }
    case 'local': {
      return { color: 'orange', label: 'LOCAL', icon: 'lucide:file-text' };
    }
    case 'script': {
      return { color: 'green', label: 'SCRIPT', icon: 'lucide:code-2' };
    }
    default: {
      return { color: 'default', label: type, icon: 'lucide:help-circle' };
    }
  }
}
