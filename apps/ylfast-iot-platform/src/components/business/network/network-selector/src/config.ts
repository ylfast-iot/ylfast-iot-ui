import type { QueryParamEntity } from '#/adapter';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { computed, ref } from 'vue';

import { $t } from '@vben/locales';

import { getNetworkSupports, IotNetCompApi } from '#/api/iot/network-config';

const networkTypes = ref<IotNetCompApi.NetworkTypeDetail[]>([]);

/**
 * 加载支持的网络类型 (全局单例)
 */
export async function loadNetworkTypes() {
  if (networkTypes.value.length > 0) return;
  const res = await getNetworkSupports();
  networkTypes.value = res || [];
}

export function useNetworkSelectorConfig() {
  // 触发加载
  loadNetworkTypes();

  const searchFormSchemas = computed<YlDcFormSchema[]>(() => [
    {
      component: 'Input',
      field: 'name',
      label: $t('network.name'),
      termTypes: ['eq', 'like'],
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: getNetworkSupports,
        labelField: 'name',
        valueField: 'id',
      },
      field: 'type',
      label: $t('network.type'),
      termTypes: ['eq'],
    },
  ]);

  const tableColumns = computed<VxeGridProps['columns']>(() => [
    { field: 'name', minWidth: 150, title: $t('network.name') },
    {
      field: 'type',
      slots: { default: 'type' },
      title: $t('network.type'),
    },
    {
      field: 'address',
      slots: { default: 'address' },
      title: $t('network.address'),
    },
    {
      field: 'state',
      slots: { default: 'state' },
      title: $t('network.state'),
    },
  ]);

  return {
    getNetworkTypeInfo,
    searchFormSchemas,
    tableColumns,
  };
}

/**
 * 查询网络组件列表
 */
export async function queryNetworkList(params: QueryParamEntity) {
  return await IotNetCompApi.basicCrudApis.postQuery({
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sorts: [{ name: 'createTime', order: 'desc' }],
    terms: params.terms || [],
  });
}

/**
 * 查询网络组件 (回显)
 */
export async function queryNetworkListNoPaging(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const res = await IotNetCompApi.basicCrudApis.postQueryNoPaging({
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
 * 获取组件类型信息 (已内置响应式支持)
 */
export function getNetworkTypeInfo(type: string) {
  const typeMap: Record<string, { color: string; label: string }> = {
    HTTP_SERVER: { color: 'cyan', label: $t('network.types.HTTP_SERVER') },
    MQTT_CLIENT: { color: 'orange', label: $t('network.types.MQTT_CLIENT') },
    MQTT_SERVER: { color: 'green', label: $t('network.types.MQTT_SERVER') },
    TCP_SERVER: { color: 'blue', label: $t('network.types.TCP_SERVER') },
    UDP_SERVER: { color: 'purple', label: $t('network.types.UDP_SERVER') },
    WS_SERVER: { color: 'pink', label: $t('network.types.WS_SERVER') },
  };

  const support = networkTypes.value.find(
    (s: IotNetCompApi.NetworkTypeDetail) => s.id === type,
  );
  const info = typeMap[type] || { color: 'default', label: type };

  if (support) {
    return { ...info, label: support.name };
  }

  return info;
}

/**
 * 获取组件状态信息
 */
export function getNetworkStateInfo(state: any) {
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
