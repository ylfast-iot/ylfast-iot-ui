import type { QueryParamEntity } from '#/adapter';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { computed, ref } from 'vue';

import { $t } from '@vben/locales';

import {
  getMediaServerSupports,
  IotMediaServerApi as MediaApi,
} from '#/api/iot/media-server';

const providerTypes = ref<MediaApi.MediaServerTypeDetail[]>([]);

/**
 * 加载支持的媒体服务提供商 (全局单例)
 */
export async function loadProviderTypes() {
  if (providerTypes.value.length > 0) return;
  const res = await getMediaServerSupports();
  providerTypes.value = res || [];
}

export function useMediaServerSelectorConfig() {
  // 触发加载
  loadProviderTypes();

  const searchFormSchemas = computed<YlDcFormSchema[]>(() => [
    {
      component: 'Input',
      field: 'name',
      label: $t('mediaServer.name'),
      termTypes: ['eq', 'like'],
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: getMediaServerSupports,
        labelField: 'name',
        valueField: 'id',
      },
      field: 'provider',
      label: $t('mediaServer.provider'),
      termTypes: ['eq'],
    },
  ]);

  const tableColumns = computed<VxeGridProps['columns']>(() => [
    { field: 'name', minWidth: 150, title: $t('mediaServer.name') },
    {
      field: 'provider',
      slots: { default: 'provider' },
      title: $t('mediaServer.provider'),
    },
    {
      field: 'shareCluster',
      slots: { default: 'shareCluster' },
      title: $t('mediaServer.config.shared'),
    },
    {
      field: 'enabled',
      slots: { default: 'enabled' },
      title: $t('common.status'),
    },
  ]);

  return {
    getProviderInfo,
    searchFormSchemas,
    tableColumns,
  };
}

/**
 * 查询媒体服务列表
 */
export async function queryMediaServerList(params: QueryParamEntity) {
  return await MediaApi.basicCrudApis.postQuery({
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sorts: [{ name: 'createTime', order: 'desc' }],
    terms: params.terms || [],
  });
}

/**
 * 查询媒体服务 (回显)
 */
export async function queryMediaServerListNoPaging(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const res = await MediaApi.basicCrudApis.postQueryNoPaging({
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
 * 获取提供商类型信息
 */
export function getProviderInfo(provider: string) {
  const support = providerTypes.value.find(
    (s: MediaApi.MediaServerTypeDetail) => s.id === provider,
  );

  return {
    label: support ? support.name : provider,
    color: 'blue',
  };
}

/**
 * 获取状态信息
 */
export function getMediaServerStateInfo(enabled: boolean) {
  if (enabled) {
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
