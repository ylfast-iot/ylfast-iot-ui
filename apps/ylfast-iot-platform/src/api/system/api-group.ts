import type { OpenApiSpecApi } from './open-api-spec';

import type { QueryParamEntity } from '#/adapter';
import type { BasicModel, PagerResult } from '#/api/basic';
import type { GeneralState } from '#/enums';
import type { EnumDict } from '#/types/global';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace ApiGroupApi {
  /** 接口分组操作信息 */
  export interface ApiGroupOperationInfo {
    /** 操作ID */
    id: string;
    /** 操作名称 */
    name: string;
    /** 操作描述 */
    description?: string;
    /** 接口ID列表 */
    apiSpecIds?: string[];
    /** 扩展属性 */
    options?: Record<string, any>;
  }

  export type AccessSupport = 'indirect' | 'support' | 'unsupported';

  /** 接口分组实体 */
  export interface ApiGroupEntity extends BasicModel<string> {
    /** 分组名称 */
    name: string;
    /** 状态 */
    status?: GeneralState;
    /** 操作集合 */
    operations?: ApiGroupOperationInfo[];
    /** 访问支持策略 */
    accessSupport?: EnumDict<AccessSupport>;
    /** 资产类型 */
    assetType?: string;
    /** 扩展属性 */
    options?: Record<string, any>;
    /** 描述信息 */
    description?: string;
    /** 创建者ID */
    creatorId?: string;
    /** 创建时间 */
    createTime?: number;
  }

  /** 接口分组授权实体 */
  export interface ApiGroupGrantEntity extends BasicModel<string> {
    /** 授权目标类型 */
    targetType: string;
    /** 授权目标ID */
    targetId: string;
    /** 接口分组ID */
    groupId: string;
    /** 操作ID列表 */
    operationIds?: string[];
    /** 资产访问控制配置 */
    assetAccesses?: Record<string, any>;
    /** 是否合并 */
    merge?: boolean;
    /** 优先级 */
    priority?: number;
  }

  /** 分组授权操作明细 */
  export interface ApiGroupOperationDetail {
    /** 操作ID */
    id: string;
    /** 操作名称 */
    name: string;
    /** 操作描述 */
    description?: string;
    /** 接口ID列表 */
    apiSpecIds?: string[];
    /** 扩展属性 */
    options?: Record<string, any>;
    /** 接口详细信息 */
    apiDetail?: OpenApiSpecApi.SimpleOpenApiInfo[];
  }

  /** 接口分组详情 */
  export interface ApiGroupDetail extends BasicModel<string> {
    /** 分组名称 */
    name: string;
    /** 状态 */
    status?: 'disabled' | 'enabled';
    /** 描述信息 */
    description?: string;
    /** 操作明细集合 */
    operations?: ApiGroupOperationDetail[];
    /** 访问支持策略 */
    accessSupport?: 'indirect' | 'support' | 'unsupported';
    /** 资产类型 */
    assetType?: string;
    /** 扩展属性 */
    options?: Record<string, any>;
    /** 创建者ID */
    creatorId?: string;
    /** 创建时间 */
    createTime?: number;
  }

  export const BASE_URL = '/open/api/group';

  export const Apis = {
    // 基本增删改查路由已经在 buildBasicCrudApis 里内置
    base: BASE_URL,
    saveByAppId: `${BASE_URL}/{appId}/_save`,
    grant: `${BASE_URL}/{targetType}/{targetId}/_grant`,
    queryGrant: `${BASE_URL}/{targetType}/{targetId}/grant/_query`,
    queryMyGrant: `${BASE_URL}/me/grant/_query`,
    queryGrantDetail: `${BASE_URL}/detail/{targetType}/{targetId}/grant/_query`,
    queryMyGrantDetail: `${BASE_URL}/detail/me/grant/_query`,
    queryDetail: `${BASE_URL}/detail/_query`,
    queryDetailNoPaging: `${BASE_URL}/detail/_query/no-paging`,
  };
}

// === Exported Interface Functions ===

/**
 * 接口分组管理增删改查 API
 * 包含了： _query, _query/no-paging, {id}, _exists, _count, _batch 等基础接口
 */
export const apiGroupCrudApis = buildBasicCrudApis<
  ApiGroupApi.ApiGroupEntity,
  string
>(ApiGroupApi.BASE_URL);

/**
 * 添加接口分组并绑定到应用（全量保存）
 * @param appId 应用ID
 * @param data 接口分组列表
 * @returns Promise<void>
 */
export const saveApiGroupsByApp = (
  appId: string,
  data: ApiGroupApi.ApiGroupEntity[],
) => {
  return requestClient.patch(
    parseTemplate(ApiGroupApi.Apis.saveByAppId, { appId }),
    data,
  );
};

/**
 * 对对象进行接口分组授权（全量覆盖）
 * @param targetType 授权目标类型
 * @param targetId 授权目标ID
 * @param data 分组授权列表
 * @returns Promise<void>
 */
export const grantApiGroups = (
  targetType: string,
  targetId: string,
  data: ApiGroupApi.ApiGroupGrantEntity[],
) => {
  return requestClient.put(
    parseTemplate(ApiGroupApi.Apis.grant, { targetType, targetId }),
    data,
  );
};

/**
 * 查询对象授权信息
 * @param targetType 授权目标类型
 * @param targetId 授权目标ID
 * @returns 授权信息列表
 */
export const queryApiGroupGrant = (targetType: string, targetId: string) => {
  return requestClient.post<ApiGroupApi.ApiGroupGrantEntity[]>(
    parseTemplate(ApiGroupApi.Apis.queryGrant, { targetType, targetId }),
  );
};

/**
 * 查询当前用户授权信息
 * @returns 当前用户的授权信息列表
 */
export const queryMyApiGroupGrant = () => {
  return requestClient.post<ApiGroupApi.ApiGroupGrantEntity[]>(
    ApiGroupApi.Apis.queryMyGrant,
  );
};

/**
 * 查询对象授权接口分组详情
 * @param targetType 授权目标类型
 * @param targetId 授权目标ID
 * @param query 查询参数
 * @param specification 是否显示规格，默认为 false
 * @returns 授权接口分组详情列表
 */
export const queryApiGroupGrantDetail = (
  targetType: string,
  targetId: string,
  query: QueryParamEntity = {},
  specification: boolean = false,
) => {
  return requestClient.post<ApiGroupApi.ApiGroupDetail[]>(
    parseTemplate(ApiGroupApi.Apis.queryGrantDetail, { targetType, targetId }),
    query,
    { params: { specification } },
  );
};

/**
 * 查询当前用户授权接口分组详情
 * @param query 查询参数
 * @param specification 是否显示规格，默认为 false
 * @returns 当前用户授权接口分组详情列表
 */
export const queryMyApiGroupGrantDetail = (
  query: QueryParamEntity = {},
  specification: boolean = false,
) => {
  return requestClient.post<ApiGroupApi.ApiGroupDetail[]>(
    ApiGroupApi.Apis.queryMyGrantDetail,
    query,
    { params: { specification } },
  );
};

/**
 * 分页查询接口分组详情
 * @param query 查询参数
 * @param specification 是否显示规格，默认为 false
 * @returns 分页过后的接口分组详情
 */
export const queryApiGroupDetailPage = (
  query: QueryParamEntity = {},
  specification: boolean = false,
) => {
  return requestClient.post<PagerResult<ApiGroupApi.ApiGroupDetail>>(
    ApiGroupApi.Apis.queryDetail,
    query,
    { params: { specification } },
  );
};

/**
 * 不分页查询接口分组详情
 * @param query 查询参数
 * @param specification 是否显示规格，默认为 false
 * @returns 接口分组详情列表
 */
export const queryApiGroupDetailList = (
  query: QueryParamEntity = {},
  specification: boolean = false,
) => {
  return requestClient.post<ApiGroupApi.ApiGroupDetail[]>(
    ApiGroupApi.Apis.queryDetailNoPaging,
    query,
    { params: { specification } },
  );
};
