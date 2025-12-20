import type { Recordable } from '#/adapter';
import type { DataType } from '#/types/data-type';

import { requestClient } from '#/api/request';

export namespace SystemConfigApi {
  export interface ScopeConfig {
    /**
     * 配置id
     */
    id?: string;

    /**
     * 配置作用域
     */
    scope: string;
    /**
     * 配置信息
     */
    properties: Recordable;
  }

  export interface ConfigScope {
    id: string;
    name: string;
    /**
     * 是否公开访问(不需要登录)
     */
    publicAccess: boolean;
  }

  export interface ConfigPropertyDef {
    /**
     * 配置key
     */
    key: string;

    /**
     * 配置名称
     */
    name: string;

    /**
     * 是否只读
     */
    readonly: boolean;

    /**
     * 配置类型
     */
    type: DataType;
    /**
     * 默认值
     */
    defaultValue: string;
  }

  export interface ConfigPropertyValue extends ConfigPropertyDef {
    /**
     * 配置值
     */
    value: any;
  }

  export const BasicApi = '/system/config';

  export const ApiMethod = {
    /**
     * 获取配置作用域
     */
    scopes: `${BasicApi}/scopes`,
  };
}

/**
 * 获取所有配置作用域
 */
export const getConfigScopes = () =>
  requestClient.get<SystemConfigApi.ConfigScope[]>(
    SystemConfigApi.ApiMethod.scopes,
  );

/**
 * 获取作用域下的全部配置信息
 * (对象形式)
 */
export const getConfigs = (scope: string) =>
  requestClient.get<Recordable>(`${SystemConfigApi.BasicApi}/${scope}`);

/**
 * 获取作用域下的配置信息（详情信息）
 * (列表形式)
 */
export const getConfigDetail = (scope: string) =>
  requestClient.get<SystemConfigApi.ConfigPropertyValue[]>(
    `${SystemConfigApi.BasicApi}/${scope}/_detail`,
  );

/**
 * 获取作用域下的配置信息（详情信息）
 * @param scopes
 */
export const getScopeConfigDetail = (scopes: string[]) =>
  requestClient.post<SystemConfigApi.ScopeConfig>(
    SystemConfigApi.ApiMethod.scopes,
    scopes,
  );

/**
 * 保存作用域下的配置信息
 */
export const saveConfig = (scope: string, data: Recordable) =>
  requestClient.post(`${SystemConfigApi.BasicApi}/${scope}`, data);

/**
 * 批量保存配置
 */
export const batchSaveConfig = (data: SystemConfigApi.ScopeConfig[]) =>
  requestClient.post(`${SystemConfigApi.BasicApi}/scope/_save`, data);
