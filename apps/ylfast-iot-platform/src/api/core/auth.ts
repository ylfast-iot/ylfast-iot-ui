import type { Authentication } from '#/adapter/hsweb/auth';

import { preferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';

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
  return baseRequestClient.get('/user-token/reset', {
    withCredentials: true,
    transformRequest: (data, headers) => {
      const accessStore = useAccessStore();
      headers.Authorization = accessStore.accessToken
        ? `Bearer ${accessStore.accessToken}`
        : null;
      headers['Accept-Language'] = preferences.app.locale;
      return data;
    },
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

/**
 * 验证token是否有效
 */
export async function tokenIsValid() {
  return requestClient.get<boolean>('/user/token/_validate');
}
