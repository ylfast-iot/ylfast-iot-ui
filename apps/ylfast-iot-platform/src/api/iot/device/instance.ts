// 设备实例

import type { QueryParamEntity, Recordable } from '#/adapter';
import type { IotDeviceProductApi } from '#/api';
import type { BasicModel, PagerResult } from '#/api/basic';
import type { DeviceState, DeviceType } from '#/enums/device';
import type { ConfigMetadata } from '#/types/config-metadata';
import type { Unit } from '#/types/data-type';
import type {
  InvokeFunctionMessage,
  InvokeFunctionReplyMessage,
  ReadPropertiesMessage,
  ReadPropertiesReplyMessage,
  SubDeviceMessage,
  SubDeviceMessageReply,
  WritePropertiesMessage,
  WritePropertiesReplyMessage,
} from '#/types/device';

import { buildBasicCrudApis } from '#/api/basic';
import { IotProtocolApi } from '#/api/iot/protocol';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace IotDeviceInstanceApi {
  /**
   * 设备实例
   */
  export interface DeviceInstance extends BasicModel {
    /**
     * 设备名称
     * 长度限制：64字符
     */
    deviceName: string;

    /**
     * 设备TSL（物模型）
     * 存储类型：CLOB（大文本）
     */
    tsl: string;

    /**
     * 设备序列号
     * 长度限制：64字符
     */
    sn: string;

    /**
     * 产品ID
     * 长度限制：64字符
     */
    productId: string;

    /**
     * 设备启用状态
     * 取值：1-启用，0-禁用（默认值 0）
     */
    enableStatus: number;

    /**
     * 协议ID（非协议记录ID）
     * 长度限制：64字符
     */
    protocolId: string;

    /**
     * 传输协议
     * 长度限制：64字符（示例：MQTT/TCP/HTTP/CoAP 等）
     */
    transport: string;

    /**
     * 设备封面URL
     */
    deviceCoverUrl?: string;

    /**
     * 设备描述
     * 长度限制：128字符
     */
    description?: string;

    /**
     * 父级设备ID（网关设备时生效）
     * 长度限制：64字符
     */
    parentDeviceId?: string;

    /**
     * 设备状态
     * 默认值：unActive（未激活）
     */
    deviceState: DeviceState;

    /**
     * 注册时间（毫秒级时间戳）
     */
    registerTime?: number; // Long 类型映射为 number

    /**
     * 设备类型
     */
    deviceType: DeviceType;

    /**
     * 产品名称
     * 长度限制：64字符
     */
    productName: string;

    /**
     * 设备配置
     */
    configuration: Recordable;
  }

  /**
   * 设备详情
   */
  export interface DeviceDetail {
    /** 设备ID */
    id: string;
    /** 设备名称 */
    deviceName: string;
    /** TSL 物模型JSON */
    tsl?: string;
    /** 产品物模型 */
    productTsl: string;
    /** 产品ID */
    productId?: string;
    /** 设备状态 1启用 0禁用 */
    enableStatus?: number; // Byte → number
    /** 协议id */
    protocolId?: string;
    /** 父设备id */
    parentDeviceId?: string;
    /** 传输协议（如：MQTT/TCP/HTTP 等） */
    transport?: string;
    /** 序列号 */
    sn?: string;
    /** 设备状态（如：unActive/active/online/offline 等） */
    deviceState?: DeviceState;
    /** 设备封面图URL */
    deviceCoverUrl?: string;
    /** 设备描述 */
    description?: string;
    /** 设备配置信息（数据库中），默认空对象 */
    configuration: Record<string, any>;
    /** 设备配置信息（缓存中），默认空对象 */
    cachedConfiguration?: Record<string, any>;
    /** 产品名称 */
    productName?: string;
    /** 产品类型 */
    productType: string;
    /** 产品类型id */
    productTypeId: string;
    /** 设备类型 */
    deviceType: DeviceType;
    /** 是否独立物模型 */
    isSelfMetadata?: boolean;
    /** 是否独立配置 */
    isSelfConfig?: boolean;
    /** 设备上线时间（毫秒级时间戳） */
    onlineTime?: number;
    /** 设备离线时间（毫秒级时间戳） */
    offlineTime?: number;
    /** 注册时间（毫秒级时间戳） */
    registerTime?: number;
    /** 创建时间（毫秒级时间戳） */
    createTime?: number;
    /** 接入网关通道类型 */
    channel?: string;
    /** 接入网关id */
    gatewayId?: string;
    /** 网关提供者 */
    gatewayProvider?: string;
    /** 网关名称 */
    gatewayName?: string;
    /** 设备地址 */
    address?: string;
    /** 协议名称 */
    protocolName?: string;
    /** 当前存储的策略模式（ROW、COLUMN，NONE） */
    storeStrategyMode?: string;
    /** 固件信息 */
    firmwareInfo?: Record<string, any>;

    /** 协议详情（非后端获取，由接口后续填充） */
    protocolDetail: IotProtocolApi.ProtocolDetail;
  }

  /**
   * 物模型配置信息
   */
  export interface TslConfVo {
    // 设备、产品 id
    id: string;
    // 物模型JSON
    tsl: string;
  }

  /**
   * 绑定或解绑设备vo对象
   */
  export interface BindOrUnbindDeviceVo {
    /**
     * 父设备id
     */
    parentDeviceId: string;

    /**
     * 已经绑定过的设备列表。解绑时用到
     */
    bindDeviceList?: DeviceInstance[];

    /**
     * 新增并绑定设备 新增设备时，需要传此参数
     */
    addAndBindDevice?: DeviceInstance;
  }

  /**
   * 修改设备状态
   */
  export interface ChangeEnableStatusVo {
    id: string;
    // 启用状态 1启用 0禁用 2暂停
    enableStatus: number;
  }

  /**
   * 批量导入设备
   */
  export interface BatchImportDeviceVo {
    /**
     * 设备信息
     */
    devices: ImportDevice[];

    /**
     * 产品信息
     */
    product: IotDeviceProductApi.DeviceProduct;
  }

  interface ImportDevice {
    deviceSn: string;
    deviceId: string;
    deviceName: string;
  }

  const BASE_URL = '/iot/device';

  export const Apis = {
    updateTsl: `${BASE_URL}/update/metaInfo`,
    bindDevice: `${BASE_URL}/bindDevice`,
    unBindDevice: `${BASE_URL}/unBindDevice`,
    changeEnableStatus: `${BASE_URL}/change/enableStatus`,
    detail: `${BASE_URL}/detail/{deviceId}`,
    detailsPage: `${BASE_URL}/details/_page`,
    detailsList: `${BASE_URL}/details/list`,
    updateSimpleInfo: `${BASE_URL}/update/simpleInfo`,
    batchImport: `${BASE_URL}/batch/import`,

    // 设备操作相关
    readProperties: `${BASE_URL}/operation/properties/read`,
    subDeviceReadProperties: `${BASE_URL}/operation/sub-device/properties/read`,
    writeProperties: `${BASE_URL}/operation/properties/write`,
    invokeFunction: `${BASE_URL}/operation/function/invoke`,
    checkState: `${BASE_URL}/operation/checkState/{deviceId}`,
    disconnect: `${BASE_URL}/operation/{deviceId}/disconnect`,
    register: `${BASE_URL}/operation/{deviceId}/register`,
    sendMessage: `${BASE_URL}/operation/{deviceId}/message`,

    // 设备metadata相关
    getDeviceConfigMetadataApi: `${BASE_URL}/config/metadata/device/{deviceId}`,
    getDeviceConfigMetadataByProductIdApi: `${BASE_URL}/config/metadata/device/byProductId`,
    getDeviceConfigMetadataPropertiesApi: `${BASE_URL}/config/metadata/device/properties/{deviceId}`,
    getProductConfigMetadataApi: `${BASE_URL}/config/metadata/product/{productId}`,
    getProductConfigMetadataByAccessIdApi: `${BASE_URL}/config/metadata/product/byAccessId`,
    getProductConfigMetadataPropertiesApi: `${BASE_URL}/config/metadata/product/properties/{productId}`,
    getUnitsApi: `${BASE_URL}/config/metadata/allUnits`,
  };

  // 继承基础增删改查接口
  export const basicCrudApis = buildBasicCrudApis<DeviceInstance, string>(
    BASE_URL,
  );
}

/**
 * 更新设备物模型
 * @param metadataConf 物模型更新配置信息
 */
export function updateDeviceMetadata(
  metadataConf: IotDeviceInstanceApi.TslConfVo,
) {
  return requestClient.post<boolean>(
    IotDeviceInstanceApi.Apis.updateTsl,
    metadataConf,
  );
}

/**
 * 绑定设备
 * @param bindDeviceVo 绑定设备vo对象
 */

export function bindDevice(
  bindDeviceVo: IotDeviceInstanceApi.BindOrUnbindDeviceVo,
) {
  return requestClient.post<boolean>(
    IotDeviceInstanceApi.Apis.bindDevice,
    bindDeviceVo,
  );
}

/**
 * 解绑设备
 * @param unBindDeviceVo 解绑设备vo对象
 */
export function unBindDevice(
  unBindDeviceVo: IotDeviceInstanceApi.BindOrUnbindDeviceVo,
) {
  return requestClient.post<boolean>(
    IotDeviceInstanceApi.Apis.unBindDevice,
    unBindDeviceVo,
  );
}

/**
 * 修改设备状态
 * @param stateVo 设备状态vo
 */
export function changeEnableStatus(
  stateVo: IotDeviceInstanceApi.ChangeEnableStatusVo,
) {
  return requestClient.post<boolean>(
    IotDeviceInstanceApi.Apis.changeEnableStatus,
    stateVo,
  );
}

/**
 * 获取设备详情
 * @param deviceId 设备id
 */
export function getDeviceDetail(deviceId: string) {
  return requestClient.get<IotDeviceInstanceApi.DeviceDetail>(
    parseTemplate(IotDeviceInstanceApi.Apis.detail, {
      deviceId,
    }),
  );
}

/**
 * 分页获取设备列表
 * @param params 查询参数
 */
export function getDeviceDetailsPage(
  params: QueryParamEntity,
): Promise<PagerResult<IotDeviceInstanceApi.DeviceDetail>> {
  return requestClient.post<PagerResult<IotDeviceInstanceApi.DeviceDetail>>(
    IotDeviceInstanceApi.Apis.detailsPage,
    params,
  );
}

/**
 * 获取设备列表
 * @param params 查询参数
 */
export function getDeviceDetailsList(
  params: QueryParamEntity,
): Promise<IotDeviceInstanceApi.DeviceDetail[]> {
  return requestClient.post<IotDeviceInstanceApi.DeviceDetail[]>(
    IotDeviceInstanceApi.Apis.detailsList,
    params,
  );
}

/**
 * 更新设备简单信息
 * @param deviceInstance 设备实例
 */
export function updateDeviceSimpleInfo(
  deviceInstance: IotDeviceInstanceApi.DeviceInstance,
) {
  return requestClient.post<boolean>(
    IotDeviceInstanceApi.Apis.updateSimpleInfo,
    deviceInstance,
  );
}

/**
 * 批量导入设备
 * @param batchImportDeviceVo 批量导入设备vo对象
 */
export function batchImport(
  batchImportDeviceVo: IotDeviceInstanceApi.BatchImportDeviceVo,
) {
  return requestClient.post<boolean>(
    IotDeviceInstanceApi.Apis.batchImport,
    batchImportDeviceVo,
  );
}

/**
 * @description:  读取子设备属性
 * @param message
 * @return SubDeviceMessageReply<ReadPropertiesReplyMessage>
 */
export const readSubDeviceProperties = (
  message: SubDeviceMessage<ReadPropertiesMessage>,
) =>
  requestClient.post<SubDeviceMessageReply<ReadPropertiesReplyMessage>>(
    IotDeviceInstanceApi.Apis.subDeviceReadProperties,
    message,
  );

/**
 * @description:  读设备属性
 * @param message ReadPropertiesReplyMessage
 * @returns ReadPropertiesReplyMessage
 */
export const readDeviceProperties = (message: ReadPropertiesMessage) =>
  requestClient.post<ReadPropertiesReplyMessage>(
    IotDeviceInstanceApi.Apis.readProperties,
    message,
  );

/**
 * @description:  写设备属性
 * @param message
 * @returns WritePropertiesReplyMessage
 */
export const writeDeviceProperties = (message: WritePropertiesMessage) =>
  requestClient.post<WritePropertiesReplyMessage>(
    IotDeviceInstanceApi.Apis.writeProperties,
    message,
  );

/**
 * @description:  设备功能调用
 * @param message
 * @returns InvokeFunctionReplyMessage
 */
export const invokeDeviceFunction = (message: InvokeFunctionMessage) =>
  requestClient.post<InvokeFunctionReplyMessage>(
    IotDeviceInstanceApi.Apis.invokeFunction,
    message,
  );

/**
 * @description:  设备功能调用
 * @param deviceId 设备id
 * @returns InvokeFunctionReplyMessage
 */
export const disconnect = (deviceId: string) =>
  requestClient.post<InvokeFunctionReplyMessage>(
    parseTemplate(IotDeviceInstanceApi.Apis.disconnect, {
      deviceId,
    }),
  );

/**
 * @description:  设备注册（注册到注册中心）
 * @param deviceId 设备id
 * @returns Boolean 注册结果
 */
export const register = (deviceId: string) =>
  requestClient.post<boolean>(
    parseTemplate(IotDeviceInstanceApi.Apis.register, {
      deviceId,
    }),
  );

/**
 * @description:  检查设备状态
 * @param deviceId 设备id
 * @returns number 1在线 其他离线
 */
export const checkState = (deviceId: string) =>
  requestClient.get<DeviceState>(
    parseTemplate(IotDeviceInstanceApi.Apis.checkState, {
      deviceId,
    }),
  );

/**
 * 根据设备id获取设备配置定义
 * @param deviceId
 */
export const getDeviceConfigMetadata = (deviceId: string) =>
  requestClient.get<ConfigMetadata[]>(
    parseTemplate(IotDeviceInstanceApi.Apis.getDeviceConfigMetadataApi, {
      deviceId,
    }),
  );

/**
 * 根据产品id获取设备配置定义
 * @param productId
 */
export const getDeviceConfigMetadataByProductId = (productId: string) =>
  requestClient.get<ConfigMetadata[]>(
    IotDeviceInstanceApi.Apis.getDeviceConfigMetadataByProductIdApi,
    {
      params: {
        productId,
      },
    },
  );

/**
 * 根据设备id获取设备配置属性列表
 * @param deviceId
 */
export const getDeviceConfigMetadataProperties = (deviceId: string) =>
  requestClient.get<ConfigMetadata[]>(
    parseTemplate(
      IotDeviceInstanceApi.Apis.getDeviceConfigMetadataPropertiesApi,
      {
        deviceId,
      },
    ),
  );

/**
 * 根据产品id获取产品配置定义
 * @param productId
 */
export const getProductConfigMetadata = (productId: string) =>
  requestClient.get<ConfigMetadata[]>(
    parseTemplate(IotDeviceInstanceApi.Apis.getProductConfigMetadataApi, {
      productId,
    }),
  );

/**
 * 根据接入网关id获取产品配置定义
 * @param productId 产品id
 * @param accessId 接入网关id
 */
export const getProductConfigMetadataByAccessId = (
  productId: string,
  accessId: string,
) =>
  requestClient.get<ConfigMetadata[]>(
    IotDeviceInstanceApi.Apis.getProductConfigMetadataByAccessIdApi,
    {
      params: {
        accessId,
        productId,
      },
    },
  );

/**
 * 根据产品id获取产品配置属性列表
 * @param productId
 */
export const getProductConfigMetadataProperties = (productId: string) =>
  requestClient.get<ConfigMetadata[]>(
    parseTemplate(
      IotDeviceInstanceApi.Apis.getProductConfigMetadataPropertiesApi,
      {
        productId,
      },
    ),
  );

/**
 * 获取所有单位
 */
export const getAllUnits = () =>
  requestClient.get<Unit[]>(IotDeviceInstanceApi.Apis.getUnitsApi);
