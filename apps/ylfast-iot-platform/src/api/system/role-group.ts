import type { QueryParamEntity } from '#/adapter';
import type { I18nSupport, TreeSortSupport } from '#/api/basic.d';

import { requestClient } from '#/api/request';

export namespace SystemRoleGroupApi {
  export interface RoleGroupEntity
    extends I18nSupport,
      TreeSortSupport<RoleGroupEntity> {
    id: string;
    name: string;
    description: string;
    creatorId: string;
    createTime: number;
  }
}

/**
 * 角色组管理 API
 */

/**
 * 查询角色组列表 (不分页)
 * @param params 查询参数
 */
export function queryRoleGroupNoPaging(params: QueryParamEntity) {
  return requestClient.post<SystemRoleGroupApi.RoleGroupEntity[]>(
    '/role/group/_query/no-paging',
    params,
  );
}

/**
 * 查询角色组列表 (不分页) - POST
 * @param params 查询参数
 */
export function queryRoleGroupNoPagingPost(params: QueryParamEntity) {
  return requestClient.post<SystemRoleGroupApi.RoleGroupEntity[]>(
    '/role/group/_query/no-paging',
    params,
  );
}

/**
 * 查询分组及角色(树状)
 * @param params 查询参数
 * @param queryByRole true:query为角色条件,false:query为分组条件
 */
export function queryRoleGroupDetailTree(
  params: QueryParamEntity,
  queryByRole = false,
) {
  return requestClient.post<any[]>('/role/group/detail/_query/tree', params, {
    params: { queryByRole },
  });
}

/**
 * 保存角色组 (新增或修改)
 * @param data 角色组数据
 */
export function saveRoleGroup(data: SystemRoleGroupApi.RoleGroupEntity) {
  return data.id
    ? requestClient.put<boolean>(`/role/group/${data.id}`, data)
    : requestClient.post<SystemRoleGroupApi.RoleGroupEntity>(
        '/role/group',
        data,
      );
}

/**
 * 根据ID删除角色组
 * @param id 角色组ID
 */
export function deleteRoleGroup(id: string) {
  return requestClient.delete<SystemRoleGroupApi.RoleGroupEntity>(
    `/role/group/${id}`,
  );
}

/**
 * 根据ID查询角色组
 * @param id 角色组ID
 */
export function getRoleGroupById(id: string) {
  return requestClient.get<SystemRoleGroupApi.RoleGroupEntity>(
    `/role/group/${id}`,
  );
}
