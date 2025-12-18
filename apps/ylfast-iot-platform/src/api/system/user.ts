import type { QueryParamEntity } from '#/adapter';
import type { UserDetail } from '#/adapter/hsweb/user';
import type { PagerResult, ValidateResult } from '#/api/basic';

import { UserEntityType } from '#/adapter/hsweb/user';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace SystemUserApi {
  export type User = UserDetail;
  export type SaveUserUserDetailRequest = {
    avatar?: string;
    description?: string;
    email?: string;
    name?: string;
    telephone?: string;
  };

  export type SaveUserRequest = {
    orgIdList: string[];
    roleIdList: string[];
    user: UserDetail;
  };

  export type UserEntity = {
    createTime: number;
    creatorId: string;
    id: string;

    name: string;
    /**
     * 1 启用 0 禁用
     */
    status: number;

    type: 'admin' | 'other' | 'user';
    username: string;
  };

  export type ChangePasswordRequest = {
    newPassword: string;
    oldPassword: string;
  };

  // 根路径
  export const basicApi = '/user/detail';
  export const ApiMethod = {
    /**
     * 创建用户
     */
    create: `${basicApi}/_create`,
    /**
     * 根据用户ID获取用户信息
     */
    byId: `${basicApi}/{userId}`,
    /**
     * 获取所有用户类型
     */
    getTypes: `${basicApi}/types`,

    /**
     * 获取用户详情
     */
    query: `${basicApi}/_query`,

    /**
     * 更新用户
     */
    update: `${basicApi}/{userId}/_update`,

    /**
     * 删除用户
     */
    delete: `/user/{userId}`,

    /**
     * 查询用户
     */
    _query: `/user/_query`,

    /**
     * 密码验证
     */
    passwordValidate: `/user/password/_validate`,

    /**
     * 验证当前用户密码
     */
    mePasswordValidate: `/user/me/password/_validate`,

    /**
     * 用户名验证
     */
    usernameValidate: `/user/username/_validate`,

    /**
     * 重置密码
     */
    resetPassword: `/user/{userId}/password/_reset`,

    /**
     * 修改当前用户信息
     */
    updateLoginUserInfo: '/user/me',

    /**
     * 修改当前用户密码
     */
    changeSelfPassword: '/user/passwd',

    /**
     * 保存用户
     */
    save: `/user`,

    /**
     * 修改用户状态
     */
    changeState: '/user/{id}/{state}',
  };
}

/**
 * 修改当前用户信息
 * @param data
 */
export const updateLoginUserInfo = async (data: SystemUserApi.UserEntity) => {
  return requestClient.put<SystemUserApi.UserEntity>(
    SystemUserApi.ApiMethod.updateLoginUserInfo,
    data,
  );
};

/**
 * 重置用户密码
 * @param password 密碼
 * @param userId 用戶
 */
export const resetPassword = async (userId: string, password: string) => {
  return requestClient.post<SystemUserApi.ChangePasswordRequest>(
    parseTemplate(SystemUserApi.ApiMethod.resetPassword, {
      userId,
    }),
    password,
    {
      headers: {
        'Content-Type': 'text/plain',
      },
    },
  );
};

/**
 * 修改当前用户密码
 * @param data
 */
export const changeSelfPassword = async (
  data: SystemUserApi.ChangePasswordRequest,
) => {
  return requestClient.put<SystemUserApi.ChangePasswordRequest>(
    SystemUserApi.ApiMethod.changeSelfPassword,
    data,
  );
};

/**
 * 修改用户状态
 * @param id 用户ID
 * @param state 状态 0 禁用 1 启用
 */
export const changeState = async (id: string, state: 0 | 1) => {
  return requestClient.put<boolean>(
    parseTemplate(SystemUserApi.ApiMethod.changeState, {
      id,
      state,
    }),
  );
};

/**
 * 密码验证
 * @param password 密码
 */
export const passwordValidate = async (password: string) => {
  return requestClient.post<ValidateResult>(
    SystemUserApi.ApiMethod.passwordValidate,
    password,
    {
      headers: {
        'Content-Type': 'text/plain',
      },
    },
  );
};
/**
 * 密码验证（当前用户）
 * @param password 密码
 */
export const mePasswordValidate = async (password: string) => {
  return requestClient.post<ValidateResult>(
    SystemUserApi.ApiMethod.mePasswordValidate,
    password,
    {
      headers: {
        'Content-Type': 'text/plain',
      },
    },
  );
};

/**
 * 用户名验证
 * @param username 用户名
 */
export const usernameValidate = async (username: string) => {
  return requestClient.post<ValidateResult>(
    SystemUserApi.ApiMethod.usernameValidate,
    username,
    {
      headers: {
        'Content-Type': 'text/plain',
      },
    },
  );
};

/**
 * 查询用户列表
 * @param params 查询参数
 */
export const _queryUsers = async (params?: QueryParamEntity) => {
  return requestClient.post<PagerResult<SystemUserApi.UserEntity>>(
    SystemUserApi.ApiMethod._query,
    params,
  );
};

/**
 * 查询用户详情列表
 * @param params 查询参数
 */
export const queryUsers = async (params?: QueryParamEntity) => {
  return requestClient.post<PagerResult<UserDetail>>(
    SystemUserApi.ApiMethod.query,
    params,
  );
};

/**
 * 根据用户ID获取用户信息
 * @param userId
 */
export const getUserById = async (userId: string) => {
  return requestClient.get<UserDetail>(
    parseTemplate(SystemUserApi.ApiMethod.byId, {
      userId,
    }),
  );
};

/**
 * 创建用户
 * @param data 用户数据
 */
export const createUser = async (data: SystemUserApi.SaveUserRequest) => {
  return requestClient.post<UserDetail>(SystemUserApi.ApiMethod.create, data);
};

/**
 * 更新用户
 * @param userId 用户ID
 * @param data 用户数据
 */
export const updateUser = async (
  userId: string,
  data: SystemUserApi.SaveUserRequest,
) => {
  return requestClient.put<UserDetail>(
    parseTemplate(SystemUserApi.ApiMethod.update, {
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
    parseTemplate(SystemUserApi.ApiMethod.delete, {
      userId,
    }),
  );
};

/**
 * 获取所有用户类型
 */
export const getUserTypes = async () => {
  return requestClient.get<UserEntityType[]>(SystemUserApi.ApiMethod.getTypes);
};

/**
 * 保存当前用户详情
 * @param data 用户数据
 */
export async function saveUserDetails(
  data: SystemUserApi.SaveUserUserDetailRequest,
) {
  return requestClient.put(SystemUserApi.basicApi, data);
}

/**
 * 保存当前用户信息
 * @param data 用户数据
 */
export async function saveUser(data: SystemUserApi.UserEntity) {
  return requestClient.request(SystemUserApi.ApiMethod.save, {
    data,
    method: 'PATCH',
  });
}
