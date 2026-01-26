import type { Recordable } from '#/adapter';
import type { BasicModel } from '#/api/basic';
import type { ConfigMetadata } from '#/types/config-metadata';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace IotNotifyConfigApi {
  export interface NotifyConfig extends BasicModel {
    /**
     * 通知配置名称
     */
    name: string;
    /**
     * 通知类型
     */
    type: string;
    /**
     * 通知服务提供商
     */
    provider: string;
    /**
     * 通知配置，根据不同的服务提供商不同而不同
     */
    configuration: Recordable;
    /**
     * 通知配置描述
     */
    description?: string;
  }

  export interface ProviderInfo {
    /** 通知类型 */
    type: string;
    /** 服务商ID */
    id: string;
    /** 服务商名称 */
    name: string;
  }

  export interface NotifyTypeInfo {
    /** 通知类型ID */
    id: string;
    /** 通知类型名称 */
    name: string;
    /** 服务商信息 */
    providerInfos: ProviderInfo[];
  }

  const BASE_URL = '/iot/notifier/config';
  export const Apis = {
    types: `${BASE_URL}/types`,
    typeProviders: `${BASE_URL}/type/{type}/providers`,
    metadata: `${BASE_URL}/{type}/{provider}/metadata`,
  };

  // 继承基础增删改查接口
  export const basicCrudApis = buildBasicCrudApis<NotifyConfig, string>(
    BASE_URL,
  );
}

/**
 * @description: 获取平台支持的通知类型
 */
export const getNotifyTypes = () =>
  requestClient.get<IotNotifyConfigApi.NotifyTypeInfo[]>(
    IotNotifyConfigApi.Apis.types,
  );

/**
 * @description: 获取支持的服务商
 * @param type 通知类型ID
 */
export const getNotifyProviders = (type: string) =>
  requestClient.get<IotNotifyConfigApi.ProviderInfo[]>(
    parseTemplate(IotNotifyConfigApi.Apis.typeProviders, { type }),
  );

/**
 * @description: 获取指定类型和服务商所需配置定义
 * @param type 通知类型ID
 * @param provider 服务商ID
 */
export const getNotifyConfigMetadata = (type: string, provider: string) =>
  requestClient.get<ConfigMetadata>(
    parseTemplate(IotNotifyConfigApi.Apis.metadata, { type, provider }),
  );
