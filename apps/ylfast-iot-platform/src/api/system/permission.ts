import type { QueryParamEntity } from '#/adapter';
import type { BasicModel, I18nSupport, PagerResult } from '#/api/basic';

import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace SystemPermissionApi {
  export type Permission = BasicModel &
    I18nSupport & {
      actions: Action[];
      describe: string;
      i18nDescribe: string;
      i18nName: string;
      name: string;
      status: number;
    };

  export interface Action extends I18nSupport {
    /**
     * 操作标识
     */
    action: string;
    /**
     * 操作名
     */
    name: string;
    /**
     * 操作描述
     */
    describe: string;

    i18nName: string;
    i18nDescribe: string;
  }

  export const basicApi = '/permission';

  export const ApiMethod = {
    /**
     * 批量操作
     */
    batch: `${basicApi}/_batch`,

    /**
     * 根据id来进行的一些操作接口
     */
    byId: `${basicApi}/{id}`,
    /**
     * 修改状态
     */
    modState: `${basicApi}/status/{status}`,

    /**
     * 查询
     */
    query: `${basicApi}/_query`,

    /**
     * 查询不分页
     */
    queryNoPaging: `${basicApi}/_query/no-paging`,

    /**
     * 查询是否存在
     */
    exists: `${basicApi}/_exists`,

    /**
     * 查询数量
     */
    count: `${basicApi}/_count`,

    /**
     * 验证权限id是否合法
     */
    validate: `${basicApi}/id/_validate`,

    /**
     * 获取用于赋权的权限列表
     */
    queryForGrant: `${basicApi}/_query/for-grant`,
  };
}

/**
 * 查询权限列表
 * @param params 查询参数
 */
export const getPermissionList = async (params?: QueryParamEntity) => {
  return requestClient.post<PagerResult<SystemPermissionApi.Permission>>(
    SystemPermissionApi.ApiMethod.query,
    params,
  );
};

/**
 * 根据ID获取权限详情
 * @param id 权限ID
 */
export const getPermissionById = async (id: string) => {
  return requestClient.get<SystemPermissionApi.Permission>(
    parseTemplate(SystemPermissionApi.ApiMethod.byId, {
      id,
    }),
  );
};

/**
 * 创建权限
 * @param data 权限数据
 */
export const createPermission = async (
  data: Partial<SystemPermissionApi.Permission>,
) => {
  return requestClient.post<SystemPermissionApi.Permission>(
    SystemPermissionApi.basicApi,
    data,
  );
};

/**
 * 更新权限
 * @param id 权限ID
 * @param data 权限数据
 */
export const updatePermission = async (
  id: string,
  data: Partial<SystemPermissionApi.Permission>,
) => {
  return requestClient.put<boolean>(
    parseTemplate(SystemPermissionApi.ApiMethod.byId, {
      id,
    }),
    data,
  );
};

/**
 * 删除权限
 * @param id 权限ID
 */
export const deletePermission = async (id: string) => {
  return requestClient.delete<SystemPermissionApi.Permission>(
    parseTemplate(SystemPermissionApi.ApiMethod.byId, {
      id,
    }),
  );
};

/**
 * 批量修改权限状态
 * @param ids 权限ID列表
 * @param status 状态 0:禁用 1:启用
 */
export const changePermissionState = async (ids: string[], status: number) => {
  return requestClient.put<number>(
    parseTemplate(SystemPermissionApi.ApiMethod.modState, {
      status,
    }),
    ids,
  );
};

/**

 * 查询不分页列表

 * @param params 查询参数

 */

export const getPermissionListNoPaging = async (params?: QueryParamEntity) => {
  return requestClient.post<SystemPermissionApi.Permission[]>(
    SystemPermissionApi.ApiMethod.queryNoPaging,

    params,
  );
};

/**

 * 验证权限ID是否合法

 * @param id 权限ID

 */

export const validatePermissionId = async (id: string) => {
  return requestClient.get<any>(SystemPermissionApi.ApiMethod.validate, {
    params: { id },
  });
};

/**

 * 获取用于赋权的权限列表

 * @param params 查询参数

 */

export const queryPermissionForGrant = async (params?: any) => {
  return requestClient.get<SystemPermissionApi.Permission[]>(
    SystemPermissionApi.ApiMethod.queryForGrant,

    {
      params,
    },
  );
};

/**

 * 批量创建权限

 * @param data 权限数据列表

 */

export const batchCreatePermission = async (
  data: Partial<SystemPermissionApi.Permission>[],
) => {
  return requestClient.post<number>(SystemPermissionApi.ApiMethod.batch, data);
};
