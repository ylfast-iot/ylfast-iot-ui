import type { SystemMenuApi } from './menu';

import type { QueryParamEntity } from '#/adapter';
import type { BasicModel } from '#/api/basic';
import type { ConfigMetadata } from '#/types/config-metadata';
import type { EnumDict } from '#/types/global';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace ApplicationApi {
  // === Enums ===
  /** 集成方式 */
  export type IntegrationMode =
    | 'apiClient'
    | 'apiServer'
    | 'page'
    | 'ssoClient';
  /** 应用状态 */
  export type ApplicationState = 'disabled' | 'enabled';
  /** 连接状态 */
  export type ApplicationConnectState = 'abnormal' | 'normal' | 'unknown';
  /** 认证类型 */
  export type AuthType = 'basic' | 'bearer' | 'none' | 'oauth2' | 'other';
  /** OAuth2 授权类型 */
  export type OAuthGrantType = 'authorization_code' | 'client_credentials';
  /** OAuth2 Token 请求方式 */
  export type TokenRequestType = 'POST_BODY' | 'POST_URI';
  /** 路由类型 */
  export type RouteType = 'hash' | 'history';
  /** 签名方式 */
  export type Signature = 'MD5' | 'SHA256';

  export type IntegrationModeEnumDict = EnumDict<IntegrationMode> & {
    configMetadata?: ConfigMetadata;
  };

  // === Base Models ===
  /** 参数模型 */
  export interface Parameter {
    /** 参数键 */
    key: string;
    /** 参数值 */
    value: string;
  }

  /** 认证配置 */
  export interface AuthenticationConfig {
    /** 认证类型 */
    type: AuthType;
    /** Bearer 认证配置 */
    bearer?: {
      /** Bearer Token */
      token: string;
    };
    /** Basic 认证配置 */
    basic?: {
      /** 密码 */
      password?: string;
      /** 用户名 */
      username?: string;
    };
    /** OAuth2 认证配置 */
    oauth2?: {
      /** accessToken 在响应中的属性名 */
      accessTokenProperty: string;
      /** 授权地址 */
      authorizationUrl: string;
      /** 客户端ID */
      clientId: string;
      /** 客户端密钥 */
      clientSecret: string;
      /** 授权类型 */
      grantType: OAuthGrantType;
      /** 回调地址 */
      redirectUri: string;
      /** Token 请求方式 */
      tokenRequestType: TokenRequestType;
      /** Token 地址 */
      tokenUrl: string;
    };
  }

  /** API客户端配置 */
  export interface ApiClientConfig {
    /** 接口基础地址 */
    baseUrl?: string;
    /** 认证配置 */
    authConfig?: AuthenticationConfig;
    /** 请求头参数 */
    headers?: Parameter[];
    /** 请求参数 */
    parameters?: Parameter[];
  }

  /** API服务配置 */
  export interface ApiServerConfig {
    /** 安全密钥 */
    secureKey?: string;
    /** IP白名单 */
    ipWhiteList?: string;
    /** 签名方式 */
    signature?: EnumDict<Signature>;
    /** 回调地址 */
    redirectUri?: string;
    /** 扩展配置 */
    options?: Record<string, any>;
    /** 角色ID列表 */
    roleIdList?: string[];
    /** 组织ID列表 */
    orgIdList?: string[];
  }

  /** 页面集成配置 */
  export interface PageConfig {
    /** 页面根地址 */
    baseUrl?: string;
    /** 路由类型 */
    routeType?: RouteType;
    /** 跳转参数 */
    parameters?: Parameter[];
    /** 拉取菜单数据接口(当配置了appClient时只需配置为path) */
    requestQueryMenuApi?: string;
    /** 扩展配置 */
    configuration?: Record<string, any>;
    /** 解析后的菜单查询 URL */
    parsedQueryMenuUrl?: string;
    /** 解析后的菜单查询 Path */
    parsedQueryMenuPath?: string;
  }

  /** 单点登录配置 */
  export interface SsoConfig {
    /** SSO配置 */
    configuration?: Record<string, any>;
    /** 用户名自动创建前缀 */
    usernamePrefix?: string;
    /** 是否自动创建用户 */
    autoCreateUser?: boolean;
    /** 默认角色ID列表 */
    roleIdList: string[];
    /** 默认组织ID列表 */
    orgIdList?: string[];
    /** 默认密码 */
    defaultPasswd?: string;
  }

  /** 应用信息实体 */
  export interface ApplicationEntity extends BasicModel<string> {
    /** 应用提供商 */
    provider: string;
    /** 应用名称 */
    name: string;
    /** 应用Logo地址 */
    logoUrl?: string;
    /** 应用说明 */
    description?: string;
    /** 集成方式 */
    integrationModes: IntegrationModeEnumDict[];
    /** API客户端配置 */
    apiClient?: ApiClientConfig;
    /** API服务配置 */
    apiServer?: ApiServerConfig;
    /** 页面集成配置 */
    page?: PageConfig;
    /** 单点登录配置 */
    sso?: SsoConfig;
    /** 应用状态 */
    state?: EnumDict<ApplicationState>;
    /** 连接状态 */
    connectState?: EnumDict<ApplicationConnectState>;
    /** 应用分组 */
    group?: EnumDict<string>;
    /** 应用编码 */
    code?: string;
    /** 扩展配置 */
    configurations?: Record<string, any>;
  }

  // === Endpoint Request & Response Models ===
  /** 应用提供商信息 */
  export interface ApplicationProviderInfo {
    /** 提供商标识 */
    provider: string;
    /** 提供商名称 */
    name: string;
    /** 支持的集成方式 */
    integrationModes: string[];
  }

  /** 应用连接状态信息 */
  export interface ApplicationConnectStateInfo {
    /** 应用ID */
    appId: string;
    /** 连接状态 */
    state: EnumDict<ApplicationConnectState>;
    /** 连接附加数据 */
    data?: any;
    /** 状态来源能力类型 */
    sourceType: IntegrationModeEnumDict;
  }

  /** 接口分组授权实体 */
  export interface ApiGroupGrantEntity extends BasicModel<string> {
    /** 授权目标类型 */
    targetType?: string;
    /** 授权目标ID */
    targetId?: string;
    /** 接口分组ID */
    groupId?: string;
    /** 资产访问控制 */
    assetAccesses?: Record<string, any>;
    /** 允许的接口操作ID集合 */
    operationIds?: string[];
    /** 是否合并授权 */
    merge?: boolean;
    /** 授权优先级 */
    priority?: number;
  }

  /** 应用保存及授权请求 */
  export interface ApplicationSaveRequest {
    /** 应用信息 */
    application: ApplicationEntity;
    /** 授权信息列表 */
    grants: ApiGroupGrantEntity[];
  }

  /** 应用菜单信息 */
  export interface ApplicationMenuInfo {
    /** 应用信息 */
    application: ApplicationEntity;
    /** 菜单列表 */
    menus: SystemMenuApi.Menu[]; // MenuEntity
    /** 菜单归属者 */
    owner?: string;
  }

  /** 页面集成应用信息 */
  export interface PageApplicationInfo extends PageConfig {
    /** 应用ID */
    applicationId: string;
    /** 提供商标识 */
    provider: string;
  }

  /** SDK 信息响应 */
  export interface ApiSdkResponse {
    /** SDK类型 */
    type: string;
    /** 依赖坐标 */
    dependency: string;
    /** SDK地址 */
    sdk: string;
  }

  /** API操作授权请求项 */
  export interface ApiGrantRequestOperation {
    /** 接口操作ID */
    id: string;
    /** 权限项列表 */
    permissions: Record<string, string[]>[];
  }

  /** API授权请求 */
  export interface ApiGrantRequest {
    /** 客户端ID */
    clientId: string;
    /** 操作授权列表 */
    operations: ApiGrantRequestOperation[];
  }

  /** 授权详情 */
  export interface GrantedInfo {
    /** 授权时间 */
    grantTime: number;
    /** 授权范围 */
    scope: string;
  }

  /** 已授权应用信息 */
  export interface GrantedApplicationInfo {
    /** 应用ID */
    applicationId: string;
    /** 应用名称 */
    applicationName: string;
    /** 应用提供商 */
    applicationProvider: string;
    /** 授权信息列表 */
    grantedInfo: GrantedInfo[];
  }

  export interface ApplicationInfo {
    id: string;
    name: string;
    provider: string;
    logoUrl: string;
    features: string[];
  }

  /** 用户权限维度基础接口 */
  export interface Dimension {
    id: string;
    name: string;
    type: EnumDict<string>;
    options: Record<string, any>;
  }

  /** 认证用户信息 */
  export interface User extends Dimension {
    /** 用户名 */
    username: string;
    /** 用户类型 */
    userType: string;
  }

  /** 权限信息 */
  export interface Permission {
    /** 权限ID，权限的唯一标识 */
    id: string;
    /** 权限名称 */
    name: string;
    /** 其他拓展字段 */
    options: Record<string, any>;
  }

  /** 认证信息详情 */
  export interface Authentication {
    /** 用户信息 */
    user: User;
    /** 用户所有维度 */
    dimensions: Dimension[];
    /** 用户持有的权限集合 */
    permissions: Permission[];
  }

  /** 应用分组详情 */
  export interface ApplicationGroupDetail {
    /** 分组ID */
    id: string;
    /** 分组值 */
    value: string;
    /** 分组名称 */
    text: string;
    /** 排序值 */
    sort: number;
    /** 分组下应用列表 */
    data: ApplicationEntity[];
  }

  export const BASE_URL = '/application';
  export const Apis = {
    // Basic CRUD implicit from ReactiveServiceCrudController
    base: BASE_URL,
    providers: `${BASE_URL}/providers`,
    enable: `${BASE_URL}/{id}/_enable`,
    disable: `${BASE_URL}/{id}/_disable`,
    state: `${BASE_URL}/{appId}/state`,
    updateState: `${BASE_URL}/{appId}/state/_update`,
    save: `${BASE_URL}/_save`,
    saveWithMenu: `${BASE_URL}/with-menu/_save`,
    pages: `${BASE_URL}/pages`,
    sdk: `${BASE_URL}/sdk`,
    operations: `${BASE_URL}/operations`,
    batchOperations: `${BASE_URL}/operations/_batch`,
    grant: `${BASE_URL}/{id}/grant`,
    grantAdd: `${BASE_URL}/{id}/grant/_add`,
    grantDelete: `${BASE_URL}/{id}/grant/_delete`,
    granted: `${BASE_URL}/{id}/granted`,
    myGranted: `${BASE_URL}/me/granted`,
    authorizeMe: `${BASE_URL}/{id}/authorize/me`,

    // Menu tree and list
    menuTree: `${BASE_URL}/{id}/menu/tree`,
    menuList: `${BASE_URL}/{id}/menu/list`,
    userMenuTree: `${BASE_URL}/{id}/{userId}/menu/tree`,
    userMenuList: `${BASE_URL}/{id}/{userId}/menu/list`,
    grantTree: `${BASE_URL}/{targetType}/{targetId}/{appId}/_grant/tree`,
    grantList: `${BASE_URL}/{targetType}/{targetId}/{appId}/_grant/list`,

    // Group details
    groupDetail: `${BASE_URL}/group/_detail`,
    groupDetailByCurrentUser: `${BASE_URL}/group/user/_detail`,
    groupDetailByUser: `${BASE_URL}/group/user/{userId}/_detail`,

    // Query APIs
    bindApiQuery: `${BASE_URL}/api/bind/_query/no-paging`,
    queryUserApplications: `${BASE_URL}/user/_query/no-paging`,
    queryUserApplicationsByUserId: `${BASE_URL}/user/{userId}/_query/no-paging`,
  };
}

// === Exported Interface Functions ===

/**
 * 基础增删改查 API
 */
export const applicationCrudApis = buildBasicCrudApis<
  ApplicationApi.ApplicationEntity,
  string
>(ApplicationApi.BASE_URL);

/**
 * 查询应用提供者
 */
export const queryApplicationProviders = () =>
  requestClient.get<ApplicationApi.ApplicationProviderInfo[]>(
    ApplicationApi.Apis.providers,
  );

/**
 * 启用应用
 * @param id 应用ID
 */
export const enableApplication = (id: string) =>
  requestClient.put<boolean>(parseTemplate(ApplicationApi.Apis.enable, { id }));

/**
 * 禁用应用
 * @param id 应用ID
 */
export const disableApplication = (id: string) =>
  requestClient.put<boolean>(
    parseTemplate(ApplicationApi.Apis.disable, { id }),
  );

/**
 * 查询应用连接状态
 * @param appId 应用ID
 */
export const getApplicationConnectState = (appId: string) =>
  requestClient.get<ApplicationApi.ApplicationConnectStateInfo>(
    parseTemplate(ApplicationApi.Apis.state, { appId }),
  );

/**
 * 更新应用连接状态
 * @param appId 应用ID
 * @param owner 归属者
 */
export const updateApplicationConnectState = (appId: string, owner?: string) =>
  requestClient.put<ApplicationApi.ApplicationConnectStateInfo>(
    parseTemplate(ApplicationApi.Apis.updateState, { appId }),
    null,
    { params: { owner } },
  );

/**
 * 保存应用及授权
 * @param data ApplicationSaveRequest
 */
export const saveApplicationAndGrant = (
  data: ApplicationApi.ApplicationSaveRequest,
) => requestClient.post(ApplicationApi.Apis.save, data);

/**
 * 保存应用并绑定菜单
 * @param data ApplicationMenuInfo
 */
export const saveApplicationWithMenu = (
  data: ApplicationApi.ApplicationMenuInfo,
) => requestClient.post(ApplicationApi.Apis.saveWithMenu, data);

/**
 * 查询页面集成应用
 */
export const queryPageApplications = () =>
  requestClient.get<ApplicationApi.PageApplicationInfo[]>(
    ApplicationApi.Apis.pages,
  );

/**
 * 查询SDK信息
 */
export const queryApplicationSdk = () =>
  requestClient.get<ApplicationApi.ApiSdkResponse[]>(ApplicationApi.Apis.sdk);

/**
 * 查询可授权API操作
 */
export const queryApplicationOperations = () =>
  requestClient.get<any[]>(ApplicationApi.Apis.operations);

/**
 * 批量保存授权API操作
 * @param operations 操作ID列表
 */
export const batchSaveApplicationOperations = (operations: string[]) =>
  requestClient.patch<any>(ApplicationApi.Apis.batchOperations, operations);

/**
 * 批量删除授权API操作
 * @param operations 操作ID列表
 */
export const batchRemoveApplicationOperations = (operations: string[]) =>
  requestClient.delete<number>(ApplicationApi.Apis.batchOperations, {
    data: operations,
  });

/**
 * 设置应用授权
 * @param id 应用ID
 * @param data ApiGrantRequest
 */
export const grantApplication = (
  id: string,
  data: ApplicationApi.ApiGrantRequest,
) => requestClient.post(parseTemplate(ApplicationApi.Apis.grant, { id }), data);

/**
 * 追加应用授权
 * @param id 应用ID
 * @param data ApiGrantRequest
 */
export const grantApplicationAdd = (
  id: string,
  data: ApplicationApi.ApiGrantRequest,
) =>
  requestClient.post(parseTemplate(ApplicationApi.Apis.grantAdd, { id }), data);

/**
 * 移除应用授权
 * @param id 应用ID
 * @param data ApiGrantRequest
 */
export const grantApplicationDelete = (
  id: string,
  data: ApplicationApi.ApiGrantRequest,
) =>
  requestClient.post(
    parseTemplate(ApplicationApi.Apis.grantDelete, { id }),
    data,
  );

/**
 * 查询应用已授权信息
 * @param id 应用ID
 */
export const queryApplicationGranted = (id: string) =>
  requestClient.get<any[]>(parseTemplate(ApplicationApi.Apis.granted, { id }));

/**
 * 查询当前用户已授权应用
 */
export const queryCurrentUserGrantedApplications = () =>
  requestClient.get<ApplicationApi.GrantedApplicationInfo[]>(
    ApplicationApi.Apis.myGranted,
  );

/**
 * 获取当前用户授权信息
 * @param id 应用ID
 */
export const authorizeCurrentUser = (id: string) =>
  requestClient.get<ApplicationApi.Authentication>(
    parseTemplate(ApplicationApi.Apis.authorizeMe, { id }),
  );

/**
 * 查询应用菜单树
 * @param id 应用ID
 * @param query 查询参数
 */
export const queryApplicationMenuTreePost = (
  id: string,
  query: QueryParamEntity,
) =>
  requestClient.post<SystemMenuApi.MenuView[]>(
    parseTemplate(ApplicationApi.Apis.menuTree, { id }),
    query,
  );

/**
 * 查询应用菜单树
 * @param id 应用ID
 * @param params 查询参数
 */
export const queryApplicationMenuTreeGet = (
  id: string,
  params?: Record<string, any>,
) =>
  requestClient.get<SystemMenuApi.MenuView[]>(
    parseTemplate(ApplicationApi.Apis.menuTree, { id }),
    { params },
  );

/**
 * 查询应用菜单列表
 * @param id 应用ID
 * @param query 查询参数
 */
export const queryApplicationMenuListPost = (
  id: string,
  query: QueryParamEntity,
) =>
  requestClient.post<SystemMenuApi.MenuView[]>(
    parseTemplate(ApplicationApi.Apis.menuList, { id }),
    query,
  );

/**
 * 查询应用菜单列表
 * @param id 应用ID
 * @param params 查询参数
 */
export const queryApplicationMenuListGet = (
  id: string,
  params?: Record<string, any>,
) =>
  requestClient.get<SystemMenuApi.MenuView[]>(
    parseTemplate(ApplicationApi.Apis.menuList, { id }),
    { params },
  );

/**
 * 查询指定用户应用菜单树
 * @param id 应用ID
 * @param userId 用户ID
 * @param query 查询参数
 */
export const queryUserApplicationMenuTree = (
  id: string,
  userId: string,
  query: QueryParamEntity,
) =>
  requestClient.post<SystemMenuApi.MenuView[]>(
    parseTemplate(ApplicationApi.Apis.userMenuTree, { id, userId }),
    query,
  );

/**
 * 查询指定用户应用菜单列表
 * @param id 应用ID
 * @param userId 用户ID
 * @param query 查询参数
 */
export const queryUserApplicationMenuList = (
  id: string,
  userId: string,
  query: QueryParamEntity,
) =>
  requestClient.post<SystemMenuApi.MenuView[]>(
    parseTemplate(ApplicationApi.Apis.userMenuList, { id, userId }),
    query,
  );

/**
 * 查询目标对象应用授权菜单树
 * @param targetType 目标类型
 * @param targetId 目标ID
 * @param appId 应用ID
 * @param query 查询参数
 */
export const queryGrantMenuTree = (
  targetType: string,
  targetId: string,
  appId: string,
  query: QueryParamEntity,
) =>
  requestClient.post<SystemMenuApi.MenuView[]>(
    parseTemplate(ApplicationApi.Apis.grantTree, {
      targetType,
      targetId,
      appId,
    }),
    query,
  );

/**
 * 查询目标对象应用授权菜单列表
 * @param targetType 目标类型
 * @param targetId 目标ID
 * @param appId 应用ID
 * @param query 查询参数
 */
export const queryGrantMenuList = (
  targetType: string,
  targetId: string,
  appId: string,
  query: QueryParamEntity,
) =>
  requestClient.post<SystemMenuApi.MenuView[]>(
    parseTemplate(ApplicationApi.Apis.grantList, {
      targetType,
      targetId,
      appId,
    }),
    query,
  );

/**
 * 按分组查询应用详情
 * @param query 查询参数
 * @param filterEmpty 是否过滤空分组
 */
export const queryGroupDetail = (
  query: QueryParamEntity,
  filterEmpty?: boolean,
) =>
  requestClient.post<ApplicationApi.ApplicationGroupDetail[]>(
    ApplicationApi.Apis.groupDetail,
    query,
    { params: { filterEmpty } },
  );

/**
 * 查询当前用户应用分组详情
 * @param query 查询参数
 * @param filterEmpty 是否过滤空分组
 */
export const queryGroupDetailByCurrentUser = (
  query: QueryParamEntity,
  filterEmpty?: boolean,
) =>
  requestClient.post<ApplicationApi.ApplicationGroupDetail[]>(
    ApplicationApi.Apis.groupDetailByCurrentUser,
    query,
    { params: { filterEmpty } },
  );

/**
 * 查询指定用户应用分组详情
 * @param userId 用户ID
 * @param query 查询参数
 * @param filterEmpty 是否过滤空分组
 */
export const queryGroupDetailByUser = (
  userId: string,
  query: QueryParamEntity,
  filterEmpty?: boolean,
) =>
  requestClient.post<ApplicationApi.ApplicationGroupDetail[]>(
    parseTemplate(ApplicationApi.Apis.groupDetailByUser, { userId }),
    query,
    { params: { filterEmpty } },
  );

/**
 * 查询可绑定API应用
 * @param query 查询参数
 */
export const bindApiQueryNoPaging = (query: QueryParamEntity) =>
  requestClient.post<ApplicationApi.ApplicationEntity[]>(
    ApplicationApi.Apis.bindApiQuery,
    query,
  );

/**
 * 查询当前用户可访问应用
 * @param query 查询参数
 */
export const queryUserApplicationsNoPaging = (query: QueryParamEntity) =>
  requestClient.post<ApplicationApi.ApplicationEntity[]>(
    ApplicationApi.Apis.queryUserApplications,
    query,
  );

/**
 * 查询指定用户可访问应用
 * @param userId 用户ID
 * @param query 查询参数
 */
export const queryUserApplicationsByUserIdNoPaging = (
  userId: string,
  query: QueryParamEntity,
) =>
  requestClient.post<ApplicationApi.ApplicationEntity[]>(
    parseTemplate(ApplicationApi.Apis.queryUserApplicationsByUserId, {
      userId,
    }),
    query,
  );
