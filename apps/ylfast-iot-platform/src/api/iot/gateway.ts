import type { QueryParamEntity, Recordable } from '#/adapter';
import type { BasicModel, PagerResult } from '#/api/basic';
import type { GeneralState } from '#/enums';
import type { ConfigMetadata } from '#/types/config-metadata';
import type { EnumDict } from '#/types/global';
import type { FunctionMetadata } from '#/types/metadata';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace IotGatewayApi {
  /**
   * 通道类型
   */
  export interface ChannelType {
    id: string;
    name: string;
  }

  /**
   * 传输协议
   */
  export interface Transport {
    id: string;
    name: string;
    description?: string;
  }

  /**
   * 协议功能点
   */
  export interface ProtocolFeature {
    id: string;
    name: string;
  }

  /**
   * 路由信息
   */
  export interface Route {
    group: string;
    address: string;
    description: string;
    example: string;
  }

  export interface MqttRoute extends Route {
    topic?: string;
    qos?: number;
    // 上行
    upstream?: boolean;
    // 下行
    downstream?: boolean;
  }
  export interface HttpRoute extends Route {
    method?: string[];
    contentType?: string[];
  }

  export interface WebSocketRoute extends Route {
    // 等同于address
    path?: string;
  }

  /**
   * 传输协议详情
   */
  export interface TransportDetail {
    id: string;
    name: string;
    metadata?: string;
    document?: string;
    features: ProtocolFeature[];
    routes: (HttpRoute | MqttRoute | WebSocketRoute)[];
  }

  /**
   * 协议详情
   */
  export interface ProtocolDetail {
    id: string;
    name: string;
    description?: string;
    transports?: TransportDetail[];
  }

  /**
   * 通道信息
   */
  export interface ChannelInfo {
    id: string;
    name: string;
    description?: string;
    // health = 1 正常 0 已禁用 -1 无法访问
    addresses?: { address: string; health: number }[];
    others?: Recordable;
  }

  /**
   * 设备网关实体
   */
  export interface DeviceGateway extends BasicModel {
    /**
     * 网关名称
     */
    name: string;
    /**
     * 接入方式（网关提供者）
     */
    provider: string;
    /**
     * 网关描述
     */
    description?: string;
    /**
     * 网关状态
     */
    state: EnumDict<GeneralState>;
    /**
     * 通道ID
     */
    channelId?: string;
    /**
     * 网关类型 network、channel、sub、plugin
     */
    channel: string;
    /**
     * 通讯协议
     */
    transport: string;
    /**
     * 消息协议ID
     */
    protocolId?: string;
    /**
     * 网关配置
     */
    configuration?: Recordable;
    /**
     * 状态变更时间
     */
    stateTime?: number;
  }

  /**
   * 设备网关详情
   */
  export interface DeviceGatewayDetail extends DeviceGateway {
    /**
     * 通道信息
     */
    channelInfo?: ChannelInfo;
    /**
     * 协议详情
     */
    protocolDetail?: ProtocolDetail;
    /**
     * 传输协议详情
     */
    transportDetail?: TransportDetail;
  }

  /**
   * 网关接入方式
   */
  export interface GatewayProviderDetail {
    id: string;
    name: string;
    description?: string;
    channel: string;
    transport: Transport;
    order: number;
    other?: {
      // 仅当channel == 网络类通道时有效
      networkType?: {
        id: string; // 网络类型id
        name: string; // 网络类型名称
      };
    };
  }

  /**
   * 网关接入方式分组
   */
  export interface GatewayProviderDetailGroup {
    channel: string;
    name: string;
    providers: GatewayProviderDetail[];
  }

  /**
   * 设备会话信息
   */
  export interface DeviceSessionInfo {
    /** 设备ID */
    deviceId: string;
    /** 服务节点ID */
    serverId: string;
    /** 设备地址 */
    address: string;
    /** 连接时间 */
    connectTime: number;
    /** 最后通信时间 */
    lastCommTime: number;
    /** 通信协议 */
    transport: string;
    /** 上级设备ID (子设备) */
    parentDeviceId?: string;
    /** 等待处理消息数 */
    pendingMessages?: number;
  }

  export const BASE_URL = '/iot/gateway';

  export const Apis = {
    startup: `${BASE_URL}/{id}/_startup`,
    pause: `${BASE_URL}/{id}/_pause`,
    shutdown: `${BASE_URL}/{id}/_shutdown`,
    providers: `${BASE_URL}/providers`,
    providersGrouped: `${BASE_URL}/providersGrouped`,
    channels: `${BASE_URL}/channels`,
    detail: `${BASE_URL}/{id}/detail`,
    detailQuery: `${BASE_URL}/detail/_query`,
    transports: `${BASE_URL}/transports`,
    transportDetail: `${BASE_URL}/transport/detail`,
    configMetadata: `${BASE_URL}/config-metadata/{provider}`,
    // 设备会话
    sessions: `${BASE_URL}/sessions`,
    sessionsByServer: `${BASE_URL}/sessions/{serverId}`,
    removeSession: `${BASE_URL}/session/{deviceId}`,
    // 网关命令
    commands: `${BASE_URL}/{gatewayId}/commands`,
    executeCommand: `${BASE_URL}/{gatewayId}/command/{commandId}`,
  };

  // 继承基础增删改查接口
  export const basicCrudApis = buildBasicCrudApis<DeviceGateway, string>(
    BASE_URL,
  );
}

/**
 * @description 获取传输协议列表
 */
export function getTransports() {
  return requestClient.get<IotGatewayApi.Transport[]>(
    IotGatewayApi.Apis.transports,
  );
}

/**
 * @description 获取网关接入支持方式
 */
export function getGatewayProviders() {
  return requestClient.get<IotGatewayApi.GatewayProviderDetail[]>(
    IotGatewayApi.Apis.providers,
  );
}

/**
 * @description 获取网关接入支持方式（分组）
 */
export function getGatewayProvidersGrouped() {
  return requestClient.get<IotGatewayApi.GatewayProviderDetailGroup[]>(
    IotGatewayApi.Apis.providersGrouped,
  );
}

/**
 * @description 获取所有支持的消息网关通道类型
 */
export function getChannels() {
  return requestClient.get<IotGatewayApi.ChannelType[]>(
    IotGatewayApi.Apis.channels,
  );
}

/**
 * @description 启动网关
 * @param id 网关ID
 */
export function startupGateway(id: string) {
  return requestClient.post(parseTemplate(IotGatewayApi.Apis.startup, { id }));
}

/**
 * @description 暂停网关
 * @param id 网关ID
 */
export function pauseGateway(id: string) {
  return requestClient.post(parseTemplate(IotGatewayApi.Apis.pause, { id }));
}

/**
 * @description 停止网关
 * @param id 网关ID
 */
export function shutdownGateway(id: string) {
  return requestClient.post(parseTemplate(IotGatewayApi.Apis.shutdown, { id }));
}

/**
 * @description 获取单个网关详情
 * @param id 网关ID
 */
export function getGatewayDetail(id: string) {
  return requestClient.get<IotGatewayApi.DeviceGatewayDetail>(
    parseTemplate(IotGatewayApi.Apis.detail, { id }),
  );
}

/**
 * @description 分页查询网关详情
 * @param params 查询参数
 */
export function queryGatewayDetailPage(params: QueryParamEntity) {
  return requestClient.post<PagerResult<IotGatewayApi.DeviceGatewayDetail>>(
    IotGatewayApi.Apis.detailQuery,
    params,
  );
}

/**
 * @description 获取传输协议详情
 * @param protocol 消息协议ID
 * @param transport 传输协议ID
 */
export function getTransportDetail(protocol: string, transport: string) {
  return requestClient.get<IotGatewayApi.TransportDetail>(
    IotGatewayApi.Apis.transportDetail,
    {
      params: { protocol, transport },
    },
  );
}

/**
 * @description 获取网关配置元数据
 * @param provider 网关提供者ID
 */
export function getGatewayConfigMetadata(provider: string) {
  return requestClient.get<ConfigMetadata>(
    parseTemplate(IotGatewayApi.Apis.configMetadata, { provider }),
  );
}

/**
 * @description 获取所有设备会话
 * @param pageIndex 页码
 * @param pageSize 每页数量
 */
export function getSessions(pageIndex?: number, pageSize?: number) {
  return requestClient.get<IotGatewayApi.DeviceSessionInfo[]>(
    IotGatewayApi.Apis.sessions,
    { params: { pageIndex, pageSize } },
  );
}

/**
 * @description 获取指定服务节点的设备会话
 * @param serverId 服务节点ID
 * @param pageIndex 页码
 * @param pageSize 每页数量
 */
export function getSessionsByServer(
  serverId: string,
  pageIndex?: number,
  pageSize?: number,
) {
  return requestClient.get<IotGatewayApi.DeviceSessionInfo[]>(
    parseTemplate(IotGatewayApi.Apis.sessionsByServer, { serverId }),
    { params: { pageIndex, pageSize } },
  );
}

/**
 * @description 移除设备会话
 * @param deviceId 设备ID
 */
export function removeSession(deviceId: string) {
  return requestClient.delete<number>(
    parseTemplate(IotGatewayApi.Apis.removeSession, { deviceId }),
  );
}

/**
 * @description 获取网关支持的命令
 * @param gatewayId 网关ID
 */
export function getGatewayCommands(gatewayId: string) {
  return requestClient.get<FunctionMetadata[]>(
    parseTemplate(IotGatewayApi.Apis.commands, { gatewayId }),
  );
}

/**
 * @description 执行网关命令
 * @param gatewayId 网关ID
 * @param commandId 命令ID
 * @param body 命令参数
 */
export function executeGatewayCommand(
  gatewayId: string,
  commandId: string,
  body?: Record<string, unknown>,
) {
  return requestClient.post<unknown>(
    parseTemplate(IotGatewayApi.Apis.executeCommand, { gatewayId, commandId }),
    body,
  );
}
