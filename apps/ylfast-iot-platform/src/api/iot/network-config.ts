import type { QueryParamEntity, Recordable } from '#/adapter';
import type { BasicModel } from '#/api/basic';
import type { GeneralState } from '#/enums';
import type { ConfigMetadata } from '#/types/config-metadata';
import type { EnumDict } from '#/types/global';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace IotNetCompApi {
  /**
   * 网络组件配置
   */
  export interface IotNetComp extends BasicModel {
    /**
     * 网络组件名称
     */
    name: string;
    /**
     * 组件类型
     */
    type: string;
    /**
     * 描述
     */
    description?: string;
    /**
     * 组件状态
     */
    state: EnumDict<GeneralState>;
    /**
     * 集群是否共享配置
     */
    shareCluster: boolean;
    /**
     * 集群配置
     */
    cluster?: Configuration[];
    /**
     * 网络组件配置信息
     */
    configuration: any | ClientNetworkConfig | ServerNetworkConfig;
    /**
     * 地址信息
     */
    addressInfo?: AddressInfo[];
  }

  export interface Configuration {
    serverId: string;
    tags?: Record<string, string>;
    configuration: any | ClientNetworkConfig | ServerNetworkConfig;
  }

  export interface ChannelInfo {
    id: string;
    name: string;
    description: string;
    addresses: Address[];
    others: Recordable;
  }

  export interface Address {
    address: string;
    // health = 1 正常 0 已禁用 -1 无法访问
    health: number;
    // 是否正常
    ok: boolean;
    // 是否无法访问
    bad: boolean;
    // 是否禁用
    disabled: boolean;
  }

  export interface NetworkTypeDetail {
    id: string;
    name: string;
  }

  /**
   * 地址信息
   */
  export interface AddressInfo {
    /**
     * 地址信息
     */
    address: string;
    /**
     * 是否为客户端
     */
    client: boolean;
  }

  /**
   * 网络传输方式
   */
  export type NetworkTransport = 'TCP' | 'UDP';

  /**
   * 基础网络组件配置
   */
  export interface NetworkConfig {
    /**
     * 组件标识
     */
    id: string;
    /**
     * 网络传输方式
     */
    transport: NetworkTransport;
    /**
     * 传输协议前缀 (http mqtt ws 等)
     */
    schema: string;
    /**
     * 是否开启安全加密 (DTLS TLS)
     */
    secure: boolean;
    /**
     * 安全证书id
     */
    certId: string;

    /**
     * 其他配置
     */
    [key: string]: any;
  }

  /**
   * 客户端网络配置
   */
  export interface ClientNetworkConfig extends NetworkConfig {
    /**
     * 远程连接 host
     */
    remoteHost: string;
    /**
     * 远程连接 port
     */
    remotePort: number;
  }

  /**
   * 服务端网络组件配置
   */
  export interface ServerNetworkConfig extends NetworkConfig {
    /**
     * 本地网卡地址
     */
    host: string;
    /**
     * 本地网卡真实端口
     */
    port: number;
    /**
     * 公网主机 ip、域名
     */
    publicHost: string;
    /**
     * 公网访问端口
     */
    publicPort: number;
    /**
     * 是否开启公网安全认证
     */
    publicSecure: boolean;
    /**
     * 获取公网安全证书id
     */
    publicCertId: string;
  }

  export const BASE_URL = '/iot/net-comp';

  export const Apis = {
    supports: `${BASE_URL}/supports`,
    start: `${BASE_URL}/{id}/_start`,
    shutdown: `${BASE_URL}/{id}/shutdown`,
    configMetadata: `${BASE_URL}/config/metadata/{type}`,
    detailByType: `${BASE_URL}/{networkType}/_detail`,
    aliveByType: `${BASE_URL}/{networkType}/_alive`,
  };

  export const basicCrudApis = buildBasicCrudApis<IotNetComp, string>(BASE_URL);
}

/**
 * 获取支持的网络通道类型
 */
export const getNetworkSupports = () =>
  requestClient.get<IotNetCompApi.NetworkTypeDetail[]>(
    IotNetCompApi.Apis.supports,
  );

/**
 * 启动网络组件
 * @param id
 */
export const startNetwork = (id: string) =>
  requestClient.post<boolean>(parseTemplate(IotNetCompApi.Apis.start, { id }));

/**
 * 停止网络组件
 * @param id
 */
export const shutdownNetwork = (id: string) =>
  requestClient.post<boolean>(
    parseTemplate(IotNetCompApi.Apis.shutdown, { id }),
  );

/**
 * 获取网络组件配置元数据定义
 * @param type
 */
export const getNetworkConfigMetadata = (type: string) =>
  requestClient.get<ConfigMetadata>(
    parseTemplate(IotNetCompApi.Apis.configMetadata, { type }),
  );

/**
 * 获取指定类型下全部的网络组件信息
 * @param networkType
 */
export const getNetworkInfoByType = (networkType: string) =>
  requestClient.get<IotNetCompApi.ChannelInfo[]>(
    parseTemplate(IotNetCompApi.Apis.detailByType, { networkType }),
  );

/**
 * 获取指定类型下可用的网络组件信息
 * @param networkType
 * @param include
 * @param query
 */
export const getAliveNetworkInfo = (
  networkType: string,
  include?: string,
  query?: QueryParamEntity,
) =>
  requestClient.post<IotNetCompApi.ChannelInfo[]>(
    parseTemplate(IotNetCompApi.Apis.aliveByType, { networkType }),
    query,
    {
      params: {
        include,
      },
    },
  );
