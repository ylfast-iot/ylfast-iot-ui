import type { QueryParamEntity } from '#/adapter';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { IotGatewayApi, queryGatewayDetailPage } from '#/api/iot/gateway';

export function useGatewaySelectorConfig() {
  const searchFormSchemas = computed<YlDcFormSchema[]>(() => [
    {
      component: 'Input',
      field: 'name',
      label: $t('gateway.detail.name'),
      termTypes: ['eq', 'like'],
    },
    {
      component: 'Input',
      field: 'id',
      label: 'ID',
      termTypes: ['eq', 'like'],
    },
  ]);

  const tableColumns = computed<VxeGridProps['columns']>(() => [
    { field: 'name', minWidth: 150, title: $t('gateway.detail.name') },
    {
      field: 'provider',
      slots: { default: 'provider' },
      title: '接入方式', // TODO: Add locale key if available
    },
    {
      field: 'state',
      slots: { default: 'state' },
      title: $t('gateway.state'), // Assuming gateway.state exists
    },
    {
      field: 'description',
      title: $t('gateway.detail.desc'),
    },
  ]);

  return {
    searchFormSchemas,
    tableColumns,
  };
}

/**
 * 查询网关列表
 */
export async function queryGatewayList(params: QueryParamEntity) {
  return await queryGatewayDetailPage({
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sorts: [{ name: 'createTime', order: 'desc' }],
    terms: params.terms || [],
  });
}

/**
 * 查询网关 (回显)
 */
export async function queryGatewayListNoPaging(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const res = await IotGatewayApi.basicCrudApis.postQueryNoPaging({
    paging: false,
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

/**
 * 获取网关状态信息
 */
export function getGatewayStateInfo(state: any) {
  const stateValue = state?.value === undefined ? state : state.value;

  if (stateValue?.value === 'enabled' || stateValue === 'enabled') {
    return {
      label: $t('common.enable'),
      statusColor: 'success',
    };
  }
  return {
    label: $t('common.disable'),
    statusColor: 'error',
  };
}
