import type { Recordable } from '@vben/types';

import type { QueryParamEntity } from '#/adapter';
import type { I18nSupport, TreeSortSupport } from '#/api/basic.d';

import { requestClient } from '#/api/request';

export namespace SystemMenuApi {
  export interface PermissionInfo {
    permission: string;
    name: string;
    actions: string[];
  }

  export interface ButtonInfo extends I18nSupport {
    options: Recordable<any>;
    permissions: PermissionInfo[];
    id: string;
    name: string;
    description: string;
  }

  export interface Menu extends I18nSupport, TreeSortSupport<Menu> {
    id: string;
    name: string;
    code: string;
    icon?: string;
    url?: string;
    component?: string;
    describe?: string;
    status: number; // 0: disable, 1: enable
    permissions: PermissionInfo[];
    buttons: ButtonInfo[];
    owner: string; // Add owner field as per test.ts
    application: string; // Add application field as per test.ts
    creatorId: string;
    createTime: number;
    options: Recordable<any>;
  }
}

/**
 * 获取所有菜单（树形结构）
 * @param params 查询参数
 */
export function getAllMenuTree(params?: QueryParamEntity) {
  return requestClient.post<SystemMenuApi.Menu[]>('/menu/_all/tree', params);
}

/**
 * 获取当前用户可访问的菜单(树结构) - GET
 * @param params 查询参数
 */
export function getUserMenuAsTree(params?: QueryParamEntity) {
  return requestClient.get<SystemMenuApi.Menu[]>('/menu/user-own/tree', {
    params,
  });
}

/**
 * 获取当前用户可访问的菜单(树结构) - POST
 * @param params 查询参数
 */
export function getUserMenuAsTreePost(params?: QueryParamEntity) {
  return requestClient.post<SystemMenuApi.Menu[]>(
    '/menu/user-own/tree',
    params,
  );
}

/**
 * 保存菜单（新增或修改）
 * @param data 菜单数据
 */
export function saveMenu(data: SystemMenuApi.Menu) {
  return requestClient.request<boolean>('/menu', {
    data,
    method: 'PATCH',
  });
}

/**
 * 新增菜单
 * @param data 菜单数据
 */
export function createMenu(data: SystemMenuApi.Menu) {
  return requestClient.post<SystemMenuApi.Menu>('/menu', data);
}

/**
 * 批量新增菜单
 * @param data 菜单数据列表
 */
export function batchCreateMenu(data: SystemMenuApi.Menu[]) {
  return requestClient.post<number>('/menu/_batch', data);
}

/**
 * 删除菜单
 * @param id 菜单ID
 */
export function deleteMenu(id: string) {
  return requestClient.delete<boolean>(`/menu/${id}`);
}

/**
 * 根据菜单获取对应的权限
 * @param menus 菜单列表
 */
export function getPermissionsByMenuGrant(menus: SystemMenuApi.Menu[]) {
  return requestClient.post<SystemMenuApi.PermissionInfo[]>(
    '/menu/permissions',
    menus,
  );
}

/**
 * 获取菜单所属系统
 * @param excludeOwners 需要去除的所属系统
 */
export function getSystemMenuOwner(excludeOwners?: string[]) {
  return requestClient.post<string[]>('/menu/owner', excludeOwners);
}

/**
 * 获取本系统菜单信息（树结构）
 * @param owner 菜单所属系统
 * @param params 查询参数
 */
export function getSystemMenuAsTree(owner: string, params?: QueryParamEntity) {
  return requestClient.post<SystemMenuApi.Menu[]>(
    `/menu/owner/tree/${owner}`,
    params,
  );
}

/**
 * 根据菜单获取对应的资产类型 (Deprecated)
 * @param menus 菜单列表
 */
export function getAssetTypeByMenuGrant(menus: SystemMenuApi.Menu[]) {
  return requestClient.post<any[]>('/menu/asset-types', menus);
}

/**
 * 使用GET方式分页动态查询
 * @param params 查询参数
 */
export function queryMenu(params: QueryParamEntity) {
  return requestClient.get<any>('/menu/_query', { params });
}

/**
 * 使用POST方式分页动态查询
 * @param params 查询参数
 */
export function queryMenuPost(params: QueryParamEntity) {
  return requestClient.post<any>('/menu/_query', params);
}

/**
 * 使用GET方式分页动态查询(不返回总数)
 * @param params 查询参数
 */
export function queryMenuNoPaging(params: QueryParamEntity) {
  return requestClient.get<SystemMenuApi.Menu[]>('/menu/_query/no-paging', {
    params,
  });
}

/**
 * 使用POST方式分页动态查询(不返回总数)
 * @param params 查询参数
 */
export function queryMenuNoPagingPost(params: QueryParamEntity) {
  return requestClient.post<SystemMenuApi.Menu[]>(
    '/menu/_query/no-paging',
    params,
  );
}

/**
 * 使用GET方式判断数据是否存在
 * @param params 查询参数
 */
export function checkMenuExists(params: QueryParamEntity) {
  return requestClient.get<boolean>('/menu/_exists', { params });
}

/**
 * 使用POST方式判断数据是否存在
 * @param params 查询参数
 */
export function checkMenuExistsPost(params: QueryParamEntity) {
  return requestClient.post<boolean>('/menu/_exists', params);
}

/**
 * 使用GET方式查询总数
 * @param params 查询参数
 */
export function countMenu(params: QueryParamEntity) {
  return requestClient.get<number>('/menu/_count', { params });
}

/**
 * 使用POST方式查询总数
 * @param params 查询参数
 */
export function countMenuPost(params: QueryParamEntity) {
  return requestClient.post<number>('/menu/_count', params);
}

/**
 * 校验菜单编码是否合法
 * @param code 菜单编码
 * @param owner 菜单所有者
 * @param appId 外部菜单所属应用ID
 */
export function validateMenuCode(code: string, owner: string, appId?: string) {
  return requestClient.get<any>('/menu/code/_validate', {
    params: { appId, code, owner },
  });
}
