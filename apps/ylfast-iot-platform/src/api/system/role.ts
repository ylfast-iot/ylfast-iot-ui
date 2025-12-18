import type { QueryParamEntity } from '#/adapter';
import type { I18nSupport } from '#/api/basic.d';

import { requestClient } from '#/api/request';

export namespace SystemRoleApi {
  export interface RoleEntity extends I18nSupport {
    id: string;
    name: string;
    description: string;
    state: string; // 'enabled' | 'disabled'
    groupId: string;
    creatorId: string;
    createTime: number;
    modifierId?: string;
    modifyTime?: number;
  }
  export interface RoleGroupDetailTree {
    groupId: string;
    groupName: string;
    roles: RoleEntity[];
  }
}

/**
 * 角色管理 API
 */

// Role APIs

export function queryRole(params: QueryParamEntity) {
  return requestClient.get<any>('/role/_query', { params });
}

export function queryRolePost(params: QueryParamEntity) {
  return requestClient.post<any>('/role/_query', params);
}

export function queryRoleNoPaging(params: QueryParamEntity) {
  return requestClient.get<SystemRoleApi.RoleEntity[]>(
    '/role/_query/no-paging',
    { params },
  );
}

export function saveRole(data: SystemRoleApi.RoleEntity) {
  const method = data.id ? 'PUT' : 'POST';
  const url = data.id ? `/role/${data.id}` : '/role';
  return requestClient.request<string>(url, {
    method,
    data,
  });
}

export function deleteRole(id: string) {
  return requestClient.delete<boolean>(`/role/${id}`);
}

export function getRoleById(id: string) {
  return requestClient.get<SystemRoleApi.RoleEntity>(`/role/${id}`);
}

// Bind/Unbind Users
export function bindUsersToRole(roleId: string, userIds: string[]) {
  return requestClient.post<boolean>(`/role/${roleId}/users/_bind`, userIds);
}

export function unbindUsersFromRole(roleId: string, userIds: string[]) {
  return requestClient.post<boolean>(`/role/${roleId}/users/_unbind`, userIds);
}

export function queryGroupTree(param: QueryParamEntity) {
  return requestClient.post<any>('/role/group/tree', { params: param });
}

/**
 * 查询分组及角色(树状)
 * @param param
 */
export function queryGroupDetailTree(param: QueryParamEntity) {
  return requestClient.post<SystemRoleApi.RoleGroupDetailTree[]>(
    '/role/group/detail/_query/tree',
    param,
  );
}
