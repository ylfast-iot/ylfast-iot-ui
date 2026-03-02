import type { ApplicationApi } from './application';

import { requestClient } from '#/api/request';

export namespace SsoApi {
  /**
   * SSO 控制器接口地址
   */
  export const Apis = {
    // 全局 SSO
    ssoProviders: '/sso/providers',
    ssoLogin: '/sso/{provider}/login',
    ssoNotifyGet: '/sso/{provider}/notify',
    ssoNotifyPost: '/sso/{provider}/notify',
    ssoNotifyResultGet: '/sso/{provider}/notify-result',
    ssoNotifyResultPost: '/sso/{provider}/notify-result',
    ssoBindCode: '/sso/bind-code/{code}',
    ssoBind: '/sso/me/bind/{code}',
    ssoUnbind: '/sso/me/{type}/{provider}/unbind',
    ssoBindings: '/sso/me/bindings',

    // 应用级 SSO
    appSsoAll: '/application/sso/_all',
    appSsoLoginRedirect: '/application/sso/{appId}/login',
    appSsoLoginUrl: '/application/sso/{appId}/login', // POST
    appSsoNotifyGet: '/application/sso/{appId}/notify',
    appSsoNotifyPost: '/application/sso/{appId}/notify',
    appSsoNotifyResultGet: '/application/sso/{appId}/notify-result',
    appSsoNotifyResultPost: '/application/sso/{appId}/notify-result',
    appSsoCancelGrantMe: '/application/sso/{appId}/cancel-grant/me',
    appSsoUnbindMe: '/application/sso/{appId}/unbind/me',
    appSsoBindCode: '/application/sso/bind-code/{code}',
    appSsoBindMe: '/application/sso/me/bind/{code}',
    appSsoBindingsMe: '/application/sso/me/bindings',
    appSsoGrantedMe: '/application/sso/me/granted',

    appSsoRegister: '/application/sso/register/{code}',
  };

  /**
   * SSO 提供者信息
   */
  export interface SSOProviderInfo {
    /** 类型 */
    type: string;
    /** 提供者标识 */
    provider: string;
    /** 提供者名称 */
    providerName: string;
  }

  /**
   * 已绑定 SSO 提供者信息
   */
  export interface BoundSSOProviderInfo {
    /** 类型 */
    type: string;
    /** 提供者标识 */
    provider: string;
    /** 提供者名称 */
    providerName: string;
    /** 是否已绑定 */
    bound: boolean;
    /** 绑定时间 */
    bindTime: number;
    /** 第三方用户ID */
    thirdUserId: string;
    /** 附加信息 */
    others: Record<string, any>;
  }

  /**
   * 回调结果
   */
  export interface NotifyResult {
    /** 第三方用户ID */
    thirdPartyUserId: string;
    /** 描述 */
    description: string;
    /** 过期毫秒时间戳 */
    expiresMillis: number;
    /** 附加信息 */
    others: Record<string, any>;
  }

  /**
   * 绑定码信息
   */
  export interface BindCode {
    /** 绑定类型 */
    type: string;
    /** 提供者标识 */
    provider: string;
    /** 提供者名称 */
    providerName: string;
    /** 第三方回调结果 */
    result: NotifyResult;
  }

  /**
   * 绑定结果
   */
  export interface BindResult {
    /** 是否已绑定 */
    bound: boolean;
    /** 绑定码 */
    bindCode: string;
    /** 登录令牌 */
    token: string;
    /** 平台用户ID */
    userId: string;
  }

  /**
   * 可绑定应用信息 (应用级)
   */
  export interface BoundApplicationInfo {
    /** 应用ID */
    id: string;
    /** 提供商标识 */
    provider: string;
    /** 应用名称 */
    name: string;
    /** 应用Logo地址 */
    logoUrl: string;
    /** 应用能力列表 */
    features: string[];
    /** 是否已绑定 */
    bound: boolean;
    /** 绑定时间 */
    bindTime: number;
    /** 第三方应用用户ID */
    applicationUserId: string;
    /** 其他信息 */
    others: Record<string, any>;
  }

  /**
   * 应用 SSO 注册请求 (未开启自动建号场景)
   */
  export interface ApplicationSsoRegisterRequest {
    /** 登录用户名 */
    username?: string;
    /** 登录密码 */
    password?: string;
    /** 展示姓名 */
    name?: string;
  }
}

// ================= 全局 SSO 接口 =================

/**
 * 查询 SSO 提供者
 */
export const querySsoProviders = () =>
  requestClient.get<SsoApi.SSOProviderInfo[]>(SsoApi.Apis.ssoProviders);

/**
 * 跳转到第三方登录
 * @param provider 提供者标识
 */
export const ssoLoginRedirect = (provider: string) =>
  requestClient.get(SsoApi.Apis.ssoLogin.replace('{provider}', provider));

/**
 * 第三方回调通知(GET)
 * @param provider 提供者标识
 * @param query 请求参数
 */
export const ssoNotifyGet = (provider: string, query: Record<string, string>) =>
  requestClient.get(SsoApi.Apis.ssoNotifyGet.replace('{provider}', provider), {
    params: query,
  });

/**
 * 第三方回调通知(POST)
 * @param provider 提供者标识
 * @param body 请求体
 */
export const ssoNotifyPost = (
  provider: string,
  body?: Record<string, string>,
) =>
  requestClient.post(
    SsoApi.Apis.ssoNotifyPost.replace('{provider}', provider),
    body,
  );

/**
 * 查询第三方回调处理结果(GET)
 * @param provider 提供者标识
 * @param query 请求参数
 */
export const ssoNotifyResultGet = (
  provider: string,
  query: Record<string, string>,
) =>
  requestClient.get<SsoApi.BindResult>(
    SsoApi.Apis.ssoNotifyResultGet.replace('{provider}', provider),
    { params: query },
  );

/**
 * 查询第三方回调处理结果(POST)
 * @param provider 提供者标识
 * @param body 请求体
 */
export const ssoNotifyResultPost = (
  provider: string,
  body: Record<string, string>,
) =>
  requestClient.post<SsoApi.BindResult>(
    SsoApi.Apis.ssoNotifyResultPost.replace('{provider}', provider),
    body,
  );

/**
 * 查询绑定码信息
 * @param code 绑定码
 */
export const getSsoBindCode = (code: string) =>
  requestClient.get<SsoApi.BindCode>(
    SsoApi.Apis.ssoBindCode.replace('{code}', code),
  );

/**
 * 当前用户绑定第三方账号
 * @param code 绑定码
 */
export const ssoBindMe = (code: string) =>
  requestClient.post(SsoApi.Apis.ssoBind.replace('{code}', code));

/**
 * 当前用户解绑第三方账号
 * @param type 类型
 * @param provider 提供者标识
 * @param bindIds 绑定的IDS列表
 */
export const ssoUnbindMe = (
  type: string,
  provider: string,
  bindIds?: string[],
) =>
  requestClient.post(
    SsoApi.Apis.ssoUnbind
      .replace('{type}', type)
      .replace('{provider}', provider),
    bindIds || [],
  );

/**
 * 查询当前用户绑定信息
 */
export const querySsoBindingsMe = () =>
  requestClient.get<SsoApi.BoundSSOProviderInfo[]>(SsoApi.Apis.ssoBindings);

// ================= 应用级 SSO 接口 =================

/**
 * 查询可用SSO应用
 */
export const queryAppSsoAll = () =>
  requestClient.get<ApplicationApi.ApplicationInfo[]>(SsoApi.Apis.appSsoAll);

/**
 * 跳转到应用SSO登录
 * @param appId 应用ID
 * @param scene 场景 bind/login bind时在个人中心绑定账号时使用
 */
export const appSsoLoginRedirect = (appId: string, scene: string) =>
  requestClient.get(SsoApi.Apis.appSsoLoginRedirect.replace('{appId}', appId), {
    params: { scene },
  });

/**
 * 获取应用SSO登录URL
 * @param appId 应用ID
 * @param scene 场景 bind/login bind时在个人中心绑定账号时使用
 */
export const getAppSsoLoginUrl = (appId: string, scene: string) =>
  requestClient.post<string>(
    SsoApi.Apis.appSsoLoginUrl.replace('{appId}', appId),
    null,
    { params: { scene } },
  );

/**
 * 应用SSO回调通知(GET)
 * @param appId 应用ID
 * @param query 请求参数
 */
export const appSsoNotifyGet = (appId: string, query: Record<string, string>) =>
  requestClient.get(SsoApi.Apis.appSsoNotifyGet.replace('{appId}', appId), {
    params: query,
  });

/**
 * 应用SSO回调通知(POST)
 * @param appId 应用ID
 * @param body 请求体
 */
export const appSsoNotifyPost = (
  appId: string,
  body?: Record<string, string>,
) =>
  requestClient.post(
    SsoApi.Apis.appSsoNotifyPost.replace('{appId}', appId),
    body,
  );

/**
 * 查询应用SSO回调处理结果(GET)
 * @param appId 应用ID
 * @param query 请求参数
 */
export const appSsoNotifyResultGet = (
  appId: string,
  query: Record<string, string>,
) =>
  requestClient.get<SsoApi.BindResult>(
    SsoApi.Apis.appSsoNotifyResultGet.replace('{appId}', appId),
    { params: query },
  );

/**
 * 查询应用SSO回调处理结果(POST)
 * @param appId 应用ID
 * @param body 请求体
 */
export const appSsoNotifyResultPost = (
  appId: string,
  body: Record<string, string>,
) =>
  requestClient.post<SsoApi.BindResult>(
    SsoApi.Apis.appSsoNotifyResultPost.replace('{appId}', appId),
    body,
  );

/**
 * 取消当前用户对应用的授权
 * @param appId 应用ID
 */
export const cancelAppGrantMe = (appId: string) =>
  requestClient.post(SsoApi.Apis.appSsoCancelGrantMe.replace('{appId}', appId));

/**
 * 解绑当前用户应用账号
 * @param appId 应用ID
 * @param bindIds 绑定ID数组
 */
export const unbindAppMe = (appId: string, bindIds?: string[]) =>
  requestClient.post(
    SsoApi.Apis.appSsoUnbindMe.replace('{appId}', appId),
    bindIds || [],
  );

/**
 * 查询应用绑定码详情
 * @param code 绑定码
 */
export const getAppBindCode = (code: string) =>
  requestClient.get<SsoApi.BindCode>(
    SsoApi.Apis.appSsoBindCode.replace('{code}', code),
  );

/**
 * 当前用户绑定应用账号
 * @param code 绑定码
 */
export const bindAppMe = (code: string) =>
  requestClient.post(SsoApi.Apis.appSsoBindMe.replace('{code}', code));

/**
 * 查询当前用户可绑定应用
 */
export const queryAppBindingsMe = () =>
  requestClient.get<SsoApi.BoundApplicationInfo[]>(
    SsoApi.Apis.appSsoBindingsMe,
  );

/**
 * 查询当前用户应用授权记录
 */
export const queryAppGrantedMe = () =>
  requestClient.get<ApplicationApi.GrantedApplicationInfo[]>(
    SsoApi.Apis.appSsoGrantedMe,
  );

/**
 * 根据绑定码注册并登录
 * @param code 绑定码
 * @param request 注册信息
 */
export const appSsoRegister = (
  code: string,
  request: SsoApi.ApplicationSsoRegisterRequest,
) =>
  requestClient.post<SsoApi.BindResult>(
    SsoApi.Apis.appSsoRegister.replace('{code}', code),
    request,
  );
