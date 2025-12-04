import type { Authentication } from '#/adapter/hsweb/auth';

import { adaptToPermissionCode } from '#/adapter/hsweb/auth';
import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    token: string;
    expires?: number;
    user?: any;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/authorize/login', data);
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi(token?: null | string) {
  return baseRequestClient.get<AuthApi.RefreshTokenResult>(
    `/user-token/${token}/touch`,
    {
      withCredentials: true,
    },
  );
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return requestClient.get('/user-token/reset', {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient
    .get<Authentication>('/authorize/me')
    .then(adaptToPermissionCode);
}
