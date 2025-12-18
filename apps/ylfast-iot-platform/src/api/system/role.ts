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

// Grant APIs - moved to menu.ts
