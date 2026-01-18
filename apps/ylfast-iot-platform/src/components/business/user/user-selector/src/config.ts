import type { QueryParamEntity } from '#/adapter';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { UserEntityType } from '#/adapter/hsweb/user';
import { queryUsers } from '#/api/system/user';

export function useUserSelectorConfig() {
  const searchFormSchemas = computed<YlDcFormSchema[]>(() => [
    {
      component: 'Input',
      field: 'name',
      label: $t('common.name'),
      termTypes: ['eq', 'like'],
    },
    {
      component: 'Input',
      field: 'username',
      label: '用户名',
      termTypes: ['eq', 'like'],
    },
  ]);

  const tableColumns = computed<VxeGridProps['columns']>(() => [
    { field: 'name', minWidth: 120, title: $t('common.name') },
    { field: 'username', minWidth: 120, title: '用户名' },
    {
      field: 'typeId',
      slots: { default: 'type' },
      title: '用户类型',
      width: 100,
    },
    {
      field: 'status',
      slots: { default: 'status' },
      title: '状态',
      width: 80,
    },
  ]);

  return {
    searchFormSchemas,
    tableColumns,
  };
}

/**
 * 查询用户列表
 */
export async function queryUserList(params: QueryParamEntity) {
  return await queryUsers({
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sorts: [{ name: 'createTime', order: 'desc' }],
    terms: params.terms || [],
  });
}

/**
 * 查询用户 (回显)
 */
export async function queryUserListNoPaging(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const res = await queryUsers({
    paging: false,
    terms: [
      {
        column: 'id',
        termType: 'in',
        value: ids.join(','),
      },
    ],
  });
  return res.data || [];
}

/**
 * 获取状态信息
 */
export function getUserStateInfo(status: any) {
  const statusValue = status?.value === undefined ? status : status.value;

  if (statusValue === 1 || statusValue === '1') {
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

/**
 * 获取类型信息
 */
export function getUserTypeInfo(type: any) {
  const typeValue = type?.value === undefined ? type : type.value;
  const typeInst = UserEntityType.of(typeValue);
  return {
    label: typeInst.text,
    color: typeInst.color || 'blue',
  };
}
