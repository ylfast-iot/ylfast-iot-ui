import type { QueryParamEntity } from '#/adapter';
import type { BasicModel, PagerResult } from '#/api/basic';
// 设备产品
import type { CommonState } from '#/enums';
import type { DeviceType } from '#/enums/device';
import type { EnumDict } from '#/types/global';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace IotDeviceProductApi {
  export interface DeviceProduct extends BasicModel {
    /**
     * 产品名称
     * 长度限制：64字符
     */
    productName?: string;

    /**
     * 物模型
     * 存储类型：CLOB（大文本，JSON格式）
     */
    tsl?: string;

    /**
     * 产品分类
     * 长度限制：64字符
     */
    productType?: string;

    /**
     * 产品分类id
     * 长度限制：64字符
     */
    productTypeId?: string;

    /**
     * 设备类型（直连设备\网关设备\网关子设备）
     */
    deviceType?: EnumDict<DeviceType>;

    /**
     * 产品状态 1正常,0禁用
     * 默认值：0（禁用）
     */
    state?: number; // Byte → number

    /**
     * 协议id
     * 长度限制：64字符
     */
    protocolId?: string;

    /**
     * 设备消息网关id
     * 长度限制：64字符
     */
    gatewayId?: string;

    /**
     * 接入消息网关名称
     * 长度限制：64字符
     */
    gatewayName?: string;

    /**
     * 接入网关通道提供者
     * 长度限制：64字符
     */
    gatewayProvider?: string;

    /**
     * 接入网关通道类型
     * 长度限制：64字符
     */
    channel?: string;

    /**
     * 存储策略
     * 长度限制：64字符
     */
    storePolicy?: string;

    /**
     * 存储策略配置
     * 存储类型：CLOB（大文本），JSON格式
     */
    storePolicyConfiguration?: Record<string, any>;

    /**
     * 产品封面
     * 长度限制：128字符，格式：http/https/ftp/file 开头的URL
     * 存储类型：CLOB（大文本）
     */
    coverUrl?: string;

    /**
     * 传输协议
     * 长度限制：64字符（如：MQTT/TCP/HTTP 等）
     */
    transport?: string;

    /**
     * 协议名称
     * 长度限制：64字符
     */
    protocolName?: string;

    /**
     * 产品配置
     * 存储类型：CLOB（大文本），JSON格式
     */
    configuration?: Record<string, any>;

    /**
     * 所属项目
     * 数据库字段：project_id，长度限制：64字符
     * 隐藏字段（@Hidden）
     */
    projectId?: string;

    /**
     * 项目名称
     * 数据库字段：project_name
     * 隐藏字段（@Hidden）
     */
    projectName?: string;

    /**
     * 机构ID
     * 数据库字段：org_id，长度限制：64字符
     * 已废弃（@Deprecated）、隐藏字段（@Hidden）
     */
    orgId?: string;

    /**
     * 产品描述
     * 长度限制：128字符
     */
    description?: string;
  }

  export interface ProductDetail {
    /** 产品ID */
    id: string;
    /** 产品名称 */
    productName: string;
    /** 物模型 */
    tsl?: string;
    /** 产品分类 */
    productType: string;
    /** 产品分类id */
    productTypeId: string;
    /** 产品描述 */
    description?: string;
    /** 设备类型（直连设备\网关设备\网关子设备） */
    deviceType: EnumDict<DeviceType>;
    /** 产品状态（1启用，0禁用） */
    state: CommonState; // Byte → number
    /** 协议id (非协议记录id) */
    protocolId: string;
    /** 网关id */
    gatewayId: string;
    /** 网关名称 */
    gatewayName: string;
    /** 网关通道提供者 */
    gatewayProvider: string;
    /** 网关通道类型 */
    channel: string;
    /** 存储策略 */
    storePolicy: string;
    /** 存储策略配置 */
    storePolicyConfiguration: Record<string, any>;
    /** 产品封面URL */
    coverUrl?: string;
    /** 传输协议 */
    transport?: string;
    /** 协议名称 */
    protocolName?: string;
    /** 产品配置 */
    configuration: Record<string, any>;
    /** 设备数量 */
    deviceCount: number;
    /** 当前存储的策略模式 */
    storeStrategyMode: string;
    createTime: number;
  }

  const BASE_URL = '/iot/product';

  export const Apis = {
    // 获取产品列表
    list: `${BASE_URL}/list`,
    saveTslConf: `${BASE_URL}/saveTslConf`,
    detail: `${BASE_URL}/detail/{id}`,
    detailPage: `${BASE_URL}/detail/page`,
    register: `${BASE_URL}/{productId}/register`,
    unregister: `${BASE_URL}/{productId}/unregister`,
  };

  // 继承基础增删改查接口
  export const basicCrudApis = buildBasicCrudApis<DeviceProduct, string>(
    BASE_URL,
  );
}

/**
 * 注册/启用产品
 * @param productId 产品id
 */
export function registerProduct(productId: string) {
  return requestClient.post(
    parseTemplate(IotDeviceProductApi.Apis.register, {
      productId,
    }),
  );
}

/**
 * 注销/禁用产品
 * @param productId 产品id
 */
export function unregisterProduct(productId: string) {
  return requestClient.post(
    parseTemplate(IotDeviceProductApi.Apis.unregister, {
      productId,
    }),
  );
}

/**
 * 产品详情
 * @param productId 产品id
 */
export function getProductDetail(productId: string) {
  return requestClient.get<IotDeviceProductApi.ProductDetail>(
    parseTemplate(IotDeviceProductApi.Apis.detail, {
      id: productId,
    }),
  );
}

/**
 * 产品详情分页
 * @param params 查询参数
 */
export function getProductDetailsPage(params: QueryParamEntity) {
  return requestClient.post<PagerResult<IotDeviceProductApi.ProductDetail>>(
    IotDeviceProductApi.Apis.detailPage,
    params,
  );
}
