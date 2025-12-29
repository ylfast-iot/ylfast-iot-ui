// 设备实例

import type { QueryParamEntity, Recordable } from '#/adapter';
import type { IotDeviceProductApi } from '#/api';
import type { BasicModel, PagerResult } from '#/api/basic';
import type { DeviceState, DeviceType } from '#/enums/device';

import { buildBasicCrudApis } from '#/api/basic';
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
    tsl: string;
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
    configuration?: Record<string, any>;
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
