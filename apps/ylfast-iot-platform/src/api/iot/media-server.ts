import type { BasicModel } from '#/api/basic';
import type { ConfigMetadata } from '#/types/config-metadata';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace IotMediaServerApi {
  /**
   * 流媒体服务配置
   */
  export interface IotMediaServerConfig extends BasicModel {
    /**
     * 流媒体服务名称
     */
    name: string;
    /**
     * 流媒体服务类型 (provider)
     */
    provider: string;
    /**
     * 是否启用流媒体服务
     */
    enabled: boolean;
    /**
     * 流媒体服务配置
     */
    configuration: Record<string, any>;
    /**
     * 集群是否共享配置
     */
    shareCluster: boolean;
    /**
     * 集群配置
     */
    cluster?: Configuration[];
  }

  export interface Configuration {
    serverId: string;
    tags?: Record<string, string>;
    configuration: Record<string, any>;
  }

  export interface MediaServerTypeDetail {
    id: string;
    name: string;
  }

  export const BASE_URL = '/iot/media/server';

  export const Apis = {
    supports: `${BASE_URL}/supports`,
    start: `${BASE_URL}/{provider}/{id}/start`,
    shutdown: `${BASE_URL}/{provider}/{id}/shutdown`,
    configMetadata: `${BASE_URL}/{provider}/config-metadata`,
  };

  export const basicCrudApis = buildBasicCrudApis<IotMediaServerConfig, string>(
    BASE_URL,
  );
}

/**
 * 获取支持的流媒体服务提供者
 */
export const getMediaServerSupports = () =>
  requestClient.get<IotMediaServerApi.MediaServerTypeDetail[]>(
    IotMediaServerApi.Apis.supports,
  );

/**
 * 启动流媒体服务
 * @param provider
 * @param id
 */
export const startMediaServer = (provider: string, id: string) =>
  requestClient.post<boolean>(
    parseTemplate(IotMediaServerApi.Apis.start, { id, provider }),
  );

/**
 * 停止流媒体服务
 * @param provider
 * @param id
 */
export const shutdownMediaServer = (provider: string, id: string) =>
  requestClient.post<boolean>(
    parseTemplate(IotMediaServerApi.Apis.shutdown, { id, provider }),
  );

/**
 * 获取流媒体服务配置元数据
 * @param provider
 */
export const getMediaServerConfigMetadata = (provider: string) =>
  requestClient.get<ConfigMetadata>(
    parseTemplate(IotMediaServerApi.Apis.configMetadata, { provider }),
  );
