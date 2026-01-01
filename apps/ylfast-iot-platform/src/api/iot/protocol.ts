import type { QueryParamEntity, Recordable } from '#/adapter';
import type { BasicModel } from '#/api/basic';
import type { DeviceMessage } from '#/types/device';

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

  const BASE_URL = '/iot/protocol';
  export const Apis = {
    detail: `${BASE_URL}/{id}/detail`,
    LoaderProvidersApi: `${BASE_URL}/loader/providers`,
    debugProtocolEncode: `${BASE_URL}/{deviceId}/encode`,
    debugProtocolDecode: `${BASE_URL}/{deviceId}/decode`,
    protocolDebuggerDetail: `${BASE_URL}/detail/{deviceId}`,
    debugLogsReceive: `${BASE_URL}/debug/{deviceId}/logs`,
  };

  // 继承基础增删改查接口
  export const basicCrudApis = buildBasicCrudApis<Protocol, string>(BASE_URL);
}

/**
 * @description:  获取协议加载器提供列表
 */
export const getProtocolSupportLoaderProviders = () =>
  requestClient.get<{ document: string; name: string; provider: string }[]>(
    IotProtocolApi.Apis.LoaderProvidersApi,
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
 * @description:  调试协议编码
 * @param deviceId 设备id
 * @param deviceMessage 设备消息
 * @returns string 编码后的报文
 */
export const debugProtocolEncode = (
  deviceId: string,
  deviceMessage: DeviceMessage,
) =>
  requestClient.post<string>(
    parseTemplate(IotProtocolApi.Apis.debugProtocolEncode, {
      deviceId,
    }),
    deviceMessage,
  );

/**
 * @description:  调试协议解码
 * @param deviceId 设备id
 * @param message 消息
 * @returns DeviceMessage
 */
export const debugProtocolDecode = (deviceId: string, message: string) =>
  requestClient.post<DeviceMessage>(
    parseTemplate(IotProtocolApi.Apis.debugProtocolDecode, {
      deviceId,
    }),
    message,
  );

/**
 * @description:  获取协议调试器详情
 * @param deviceId 设备id
 * @returns ProtocolDebuggerDetail
 */
export const protocolDebuggerDetail = (deviceId: string) =>
  requestClient.get<IotProtocolApi.ProtocolDebuggerDetail>(
    parseTemplate(IotProtocolApi.Apis.protocolDebuggerDetail, {
      deviceId,
    }),
  );

/**
 * @description:  接收调试日志
 * @param deviceId 设备id
 * @param messageCallback 成功回调监听
 * @param errorCallback 异常回调监听
 * @returns  void
 */
export const debugLogsReceive = (
  deviceId: string,
  messageCallback: (msg: string) => void,
  errorCallback?: (event: Event) => void,
) => {
  return requestClient
    .requestSSE(
      parseTemplate(IotProtocolApi.Apis.debugLogsReceive, {
        deviceId,
      }),
      null,
      {
        onMessage(data) {
          messageCallback(data);
        },
        onEnd() {
          // 处理完成
          console.warn('处理完成');
        },
      },
    )
    .catch((error) => errorCallback && errorCallback(error));
};
