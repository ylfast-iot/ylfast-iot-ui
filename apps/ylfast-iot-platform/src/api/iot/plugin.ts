import type { QueryParamEntity, Recordable } from '#/adapter';
import type { BasicModel, ValidateResult } from '#/api/basic';
import type { ConfigMetadata } from '#/types/config-metadata';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace IotPluginApi {
  /**
   * 版本信息
   */
  export interface Version {
    id: number;
    major: number;
    minor: number;
    revision: number;
    snapshot: boolean;
  }

  /**
   * 版本范围
   */
  export interface VersionRange {
    from: Version;
    to: Version;
  }

  /**
   * 插件描述信息
   */
  export interface Description {
    /**
     * 插件驱动id
     */
    id: string;
    /**
     * 插件驱动名称
     */
    name: string;
    /**
     * 描述
     */
    description: string;
    /**
     * 版本号
     */
    version: Version;
    /**
     * 支持的平台版本范围
     */
    platformVersion: VersionRange;
    /**
     * 配置信息
     */
    configuration: {
      [key: string]: any;
      // 插件包地址
      location: string;
    };
  }

  /**
   * 插件类型信息
   */
  export interface PluginTypeInfo {
    id: string;
    name: string;
    value: string;
    text: string;
  }

  /**
   * 设备产品
   */
  export interface DeviceProduct {
    /**
     * 分类
     */
    group: string;
    /**
     * ID
     */
    id: string;
    /**
     * 名称
     */
    name: string;
    /**
     * 说明
     */
    description: string;
    /**
     * 物模型
     */
    metadata?: Recordable;
  }

  /**
   * 插件驱动实体
   */
  export interface PluginDriver extends BasicModel {
    /**
     * 插件ID
     */
    id: string;
    /**
     * 插件名称
     */
    name: string;
    /**
     * 插件类型
     */
    type: string;
    /**
     * 插件描述
     */
    description?: string;
    /**
     * 插件版本
     */
    version?: string;

    /**
     * 提供者
     */
    provider?: string;

    /**
     * 插件文件类型
     */
    fileType?: string;

    /**
     * 插件文件名称
     */
    fileName?: string;

    /**
     * 配置信息
     */
    configuration?: Recordable;
  }

  /**
   * 插件上传信息
   */
  export interface PluginDriverUploadInfo {
    /**
     * 插件ID
     */
    id: string;
    /**
     * 插件名称
     */
    name: string;
    /**
     * 插件说明
     */
    description: string;
    /**
     * 插件版本
     */
    version: string;
    /**
     * 插件类型
     */
    type: PluginTypeInfo;
    /**
     * 文件访问地址
     */
    accessUrl: string;
    /**
     * 文件名称
     */
    filename: string;
    /**
     * 文件后缀
     */
    extension: string;
    /**
     * 文件长度
     */
    length: number;
    /**
     * md5
     */
    md5: string;
    /**
     * sha256
     */
    sha256: string;
    /**
     * 创建时间
     */
    createTime: number;
    /**
     * 创建者ID
     */
    creatorId: string;
    /**
     * 其他信息
     */
    others: Recordable;

    /**
     * 插件提供者
     */
    provider: string;
  }

  const BASE_URL = '/iot/plugin/driver';

  export const Apis = {
    // 验证ID是否合法
    validateId: `${BASE_URL}/id/_validate`,
    // 获取配置元信息
    configMetadata: `${BASE_URL}/configMetadata/{id}`,
    // 获取插件驱动列表
    providers: `${BASE_URL}/providers`,
    // 获取插件详情
    description: `${BASE_URL}/{driverId}/description`,
    // 获取插件类型
    types: `${BASE_URL}/types`,
    // 获取插件产品
    products: `${BASE_URL}/products`,
    // 获取驱动支持的产品
    driverProducts: `${BASE_URL}/{driverId}/products`,
    // 上传插件
    upload: `${BASE_URL}/upload`,
    // 获取插件详情信息
    convert: `${BASE_URL}/convert`,
  };

  // 继承基础增删改查接口
  export const basicCrudApis = buildBasicCrudApis<PluginDriver, string>(
    BASE_URL,
  );
}

/**
 * @description: 验证插件ID是否合法
 * @param id 插件ID
 */
export const validatePluginId = (id: string) =>
  requestClient.get<ValidateResult>(IotPluginApi.Apis.validateId, {
    params: { id },
  });

/**
 * @description: 获取插件配置元信息
 * @param id 插件ID
 */
export const getPluginConfigMetadata = (id: string) =>
  requestClient.get<ConfigMetadata>(
    parseTemplate(IotPluginApi.Apis.configMetadata, { id }),
  );

/**
 * @description: 获取所有插件驱动
 */
export const getPluginProviders = () =>
  requestClient.get<IotPluginApi.Description[]>(IotPluginApi.Apis.providers);

/**
 * @description: 获取插件详情
 * @param driverId 驱动ID
 */
export const getPluginDescription = (driverId: string) =>
  requestClient.get<IotPluginApi.Description>(
    parseTemplate(IotPluginApi.Apis.description, { driverId }),
  );

/**
 * @description: 获取插件类型
 */
export const getPluginTypes = () =>
  requestClient.get<IotPluginApi.PluginTypeInfo[]>(IotPluginApi.Apis.types);

/**
 * @description: 获取插件产品
 * @param accessId 接入网关id
 */
export const getPluginProducts = (accessId: string) =>
  requestClient.get<IotPluginApi.DeviceProduct[]>(IotPluginApi.Apis.products, {
    params: { accessId },
  });

/**
 * @description: 获取驱动支持的产品信息
 * @param driverId 驱动ID
 */
export const getDriverProducts = (driverId: string) =>
  requestClient.get<IotPluginApi.DeviceProduct[]>(
    parseTemplate(IotPluginApi.Apis.driverProducts, { driverId }),
  );

/**
 * @description: 上传插件
 * @param file 插件文件
 */
export const uploadPlugin = (file: File) =>
  requestClient.upload<IotPluginApi.PluginDriverUploadInfo>(
    IotPluginApi.Apis.upload,
    { file },
  );

/**
 * @description: 获取插件详情信息
 * @param pluginDriver 插件驱动数据
 */
export const convertToDetail = (pluginDriver: IotPluginApi.PluginDriver) =>
  requestClient.post<IotPluginApi.PluginDriverUploadInfo>(
    IotPluginApi.Apis.convert,
    pluginDriver,
  );

/**
 * @description: 获取插件列表
 * @param params 查询参数
 */
export const getPluginList = (params?: QueryParamEntity) => {
  params = params ?? {};
  return IotPluginApi.basicCrudApis.postQuery(params);
};

/**
 * @description: 获取全部插件列表（不分页）
 * @param params 查询参数
 */
export const getAllPlugins = (params?: QueryParamEntity) => {
  params = params ?? {};
  params.paging = false;
  return IotPluginApi.basicCrudApis.postQueryNoPaging(params);
};
