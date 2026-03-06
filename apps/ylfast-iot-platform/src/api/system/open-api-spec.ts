import type { BasicModel } from '#/api/basic';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace OpenApiSpecApi {
  /** 接口标签分组信息 */
  export interface OpenApiTagGroupInfo {
    /** 分组名 */
    group: string;
    /** 标签列表 */
    tags: string[];
  }

  /** 接口展开明细信息 */
  export interface SimpleOpenApiInfo {
    /** 接口ID */
    id: string;
    /** 应用ID */
    appId: string;
    /** 接口分组 */
    group: string;
    /** 接口标签 */
    tags: string[];
    /** 服务提供方 */
    provider: string;
    /** 操作ID */
    operationId: string;
    /** HTTP请求方法 */
    method: string;
    /** 请求路径 */
    path: string;
    /** 接口描述概要 */
    summary: string;
    /** 权限标识ID */
    permissionId?: string;
    /** 动作集合 */
    actions?: string[];
    /** 接口规范信息 */
    specification?: string;
  }

  /** 接口管理基础实体 */
  export type OpenApiSpecEntity = BasicModel<string>;

  export const BASE_URL = '/open/api/spec';

  export const Apis = {
    // 基本的增删改查路由已经在 buildBasicCrudApis 中内置
    base: BASE_URL,
    groupQuery: `${BASE_URL}/{appId}/group/_query`,
    expandsQuery: `${BASE_URL}/{appId}/expands/_query`,
  };
}

// === Exported Interface Functions ===

/**
 * 接口管理增删改查 API
 * 包含了： _query, _query/no-paging, {id}, _exists, _count 等基础接口
 */
export const openApiSpecCrudApis = buildBasicCrudApis<
  OpenApiSpecApi.OpenApiSpecEntity,
  string
>(OpenApiSpecApi.BASE_URL);

/**
 * 按应用查询接口标签分组
 * @param appId 应用ID
 * @param internal 是否内部调用，默认为 true
 * @returns 标签分组列表
 */
export const queryOpenApiTagGroups = (
  appId: string,
  internal: boolean = true,
) => {
  return requestClient.get<OpenApiSpecApi.OpenApiTagGroupInfo[]>(
    parseTemplate(OpenApiSpecApi.Apis.groupQuery, { appId }),
    { params: { internal } },
  );
};

/**
 * 按应用查询接口展开明细
 * @param appId 应用ID
 * @returns 接口展开明细列表
 */
export const queryOpenApiExpands = (appId: string) => {
  return requestClient.get<OpenApiSpecApi.SimpleOpenApiInfo[]>(
    parseTemplate(OpenApiSpecApi.Apis.expandsQuery, { appId }),
  );
};
