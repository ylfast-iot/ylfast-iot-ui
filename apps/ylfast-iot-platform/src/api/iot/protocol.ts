import type { QueryParamEntity, Recordable } from '#/adapter';
import type { BasicModel } from '#/api/basic';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace IotProtocolApi {
  export interface Protocol extends BasicModel {
    /**
     * 协议记录ID
     */
    id: string;
    /**
     * 协议包的id
     */
    protocolId: string;
    /**
     * 协议名称
     */
    protocolName: string;
    /**
     * 协议类型 （jar包、dir）
     */
    protocolType: string;
    /**
     * 描述
     */
    protocolDescription: string;
    /**
     * 状态
     */
    state: number;
    /**
     * 配置
     */
    configuration: Recordable;
  }
  export type ProtocolDetail = {
    description: string;
    id: string;
    name: string;
    transports: TransportDetail[];
  };

  export type TransportDetail = {
    document: string; // 传输协议文档信息使用说明
    // 传输协议支持的功能点
    features: {
      id: string;
      name: string;
    }[];
    id: string;
    metadata: string; // 当前协议所绑定的默认物模型
    name: string;
    routes: {
      address: string;
      description: string;
      example: string;
      group: string;
    }[];
  };

  export type ProtocolDebuggerDetail = {
    document: string;
    transport: string;
  };

  export interface ProtocolSupport {
    description: string;
    id: string;
    name: string;
  }

  export interface ProtocolUploadInfo {
    /** 文件名 */
    filename: string;
    /** 文件ID */
    fileId: string;
    /** 访问URL */
    accessUrl: string;
    /** 协议信息 */
    protocolInfo: ProtocolInfo;
  }

  export interface ProtocolInfo {
    /** 协议ID */
    id: string;
    /** 协议名称 */
    name: string;
    /** 拓展配置信息 */
    configuration: Recordable;
    /** 说明 */
    description: string;
  }

  export interface ProtocolLoaderInfo {
    name: string;
    provider: string;
    document: string;
  }

  const BASE_URL = '/iot/protocol';
  export const Apis = {
    detail: `${BASE_URL}/{id}/detail`,
    LoaderProvidersApi: `${BASE_URL}/loader/providers`,
    registeredList: `${BASE_URL}/registered/list`,
    // 启用
    register: `${BASE_URL}/{id}/_register`,
    // 禁用
    unregister: `${BASE_URL}/{id}/_unregister`,
    // 检查id是否存在
    exists: `${BASE_URL}/{id}/exists`,
    // 协议默认物模型
    defaultDeviceMetadata: `${BASE_URL}/{id}/{transport}/metadata`,
    upload: `${BASE_URL}/upload`,
    supports: `${BASE_URL}/supports`,
    supportTransportProtocols: `${BASE_URL}/supports/{transport}`,
  };

  // 继承基础增删改查接口
  export const basicCrudApis = buildBasicCrudApis<Protocol, string>(BASE_URL);
}

/**
 * @description:  获取协议加载器提供列表
 */
export const getProtocolSupportLoaderProviders = () =>
  requestClient.get<IotProtocolApi.ProtocolLoaderInfo[]>(
    IotProtocolApi.Apis.LoaderProvidersApi,
  );

/**
 * @description: 获取支持指定传输协议的消息协议
 * @param transport 传输协议
 * @param query 查询参数
 */
export const getSupportTransportProtocols = (
  transport: string,
  query?: QueryParamEntity,
) =>
  requestClient.post<IotProtocolApi.ProtocolInfo[]>(
    parseTemplate(IotProtocolApi.Apis.supportTransportProtocols, { transport }),
    query,
  );

/**
 * @description: 获取当前支持的协议
 * @param query 查询参数
 */
export const getAllProtocols = (query?: QueryParamEntity) =>
  requestClient.post<IotProtocolApi.ProtocolInfo[]>(
    IotProtocolApi.Apis.supports,
    query,
  );

/**
 * @description: 发布协议
 * @param id
 */
export const deployProtocol = (id: string) =>
  requestClient.post<boolean>(
    parseTemplate(IotProtocolApi.Apis.register, { id }),
  );

/**
 * @description: 取消发布协议
 * @param id
 */
export const unDeployProtocol = (id: string) =>
  requestClient.post<boolean>(
    parseTemplate(IotProtocolApi.Apis.unregister, { id }),
  );

/**
 * @description: 检查协议ID是否存在
 * @param id
 */
export const checkProtocolExists = (id: string) =>
  requestClient.get<boolean>(parseTemplate(IotProtocolApi.Apis.exists, { id }));

/**
 * @description: 获取协议默认物模型
 * @param id
 * @param transport
 */
export const getProtocolDefaultMetadata = (id: string, transport: string) =>
  requestClient.get<string>(
    parseTemplate(IotProtocolApi.Apis.defaultDeviceMetadata, { id, transport }),
  );

/**
 * @description:  获取列表
 * @param params
 * @returns  IotProtocolApi.Protocol[]
 */
export const getIotProtocolList = (params?: QueryParamEntity) => {
  params = params ?? {};
  params.paging = false;
  return IotProtocolApi.basicCrudApis.postQueryNoPaging(params);
};

/**
 * @description:  获取协议详情
 * @param id
 * @returns IotProtocolApi.ProtocolDetail
 */
export const getProtocolDetail = (id: string) =>
  requestClient.get<IotProtocolApi.ProtocolDetail>(
    parseTemplate(IotProtocolApi.Apis.detail, {
      id,
    }),
  );

/**
 * @description: 获取已经注册在内存中的协议
 * @returns IotProtocolApi.ProtocolSupport[]
 */
export const getRegisteredProtocols = () =>
  requestClient.get<IotProtocolApi.ProtocolSupport[]>(
    IotProtocolApi.Apis.registeredList,
  );

/**
 * @description: 上传协议
 * @param file 协议文件
 * @returns IotProtocolApi.ProtocolUploadInfo
 */
export const uploadProtocol = (file: File) => {
  return requestClient.upload<IotProtocolApi.ProtocolUploadInfo>(
    IotProtocolApi.Apis.upload,
    { file },
  );
};
