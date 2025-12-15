import type { QueryParamEntity } from '#/adapter';
import type { UserDetail } from '#/adapter/hsweb/user';
import type { PagerResult } from '#/api/basic';

import { UserEntityType } from '#/adapter/hsweb/user';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace SystemUserApi {
  export type User = UserDetail;

  // 根路径
  export const basicApi = '/user/detail';
  export const ApiMethod = {
    /**
     * 创建用户
     */
    createUser: `${basicApi}/_create`,
    /**
     * 根据用户ID获取用户信息
     */
    getUserById: `${basicApi}/{userId}`,
    /**
     * 获取所有用户类型
     */
    getUserTypes: `${basicApi}/types`,

    /**
     * 获取用户列表
     */
    queryUsers: `${basicApi}/_query`,

    /**
     * 更新用户
     */
    updateUser: `${basicApi}/{userId}/_update`,

    /**
     * 删除用户
     */
    deleteUser: `/user/{userId}`,
  };
}

/**
 * 查询用户列表
 * @param params 查询参数
 */
export const queryUsers = async (params?: QueryParamEntity) => {
  return requestClient.post<PagerResult<UserDetail>>(
    SystemUserApi.ApiMethod.queryUsers,
    params,
  );
};

/**
 * 根据用户ID获取用户信息
 * @param userId
 */
export const getUserById = async (userId: string) => {
  return requestClient.get<UserDetail>(
    parseTemplate(SystemUserApi.ApiMethod.getUserById, {
      userId,
    }),
  );
};

/**
 * 创建用户
 * @param data 用户数据
 */
export const createUser = async (data: Omit<UserDetail, 'id'>) => {
  return requestClient.post<UserDetail>(
    SystemUserApi.ApiMethod.createUser,
    data,
  );
};

/**
 * 更新用户
 * @param userId 用户ID
 * @param data 用户数据
 */
export const updateUser = async (
  userId: string,
  data: Omit<UserDetail, 'id'>,
) => {
  return requestClient.put<UserDetail>(
    parseTemplate(SystemUserApi.ApiMethod.updateUser, {
      userId,
    }),
    data,
  );
};

/**
 * 删除用户
 * @param userId 用户ID
 */
export const deleteUser = async (userId: string) => {
  return requestClient.delete<boolean>(
    parseTemplate(SystemUserApi.ApiMethod.deleteUser, {
      userId,
    }),
  );
};

/**
 * 获取所有用户类型
 */
export const getUserTypes = async () => {
  return requestClient.get<UserEntityType[]>(
    SystemUserApi.ApiMethod.getUserTypes,
  );
};

/**
 * 保存当前用户详情
 * @param data 用户数据
 */
export async function saveUser(data: UserDetail) {
  return requestClient.put(SystemUserApi.basicApi, data);
}
