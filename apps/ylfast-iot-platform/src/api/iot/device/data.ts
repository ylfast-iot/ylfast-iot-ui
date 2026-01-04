import type { QueryParamEntity } from '#/adapter';
import type { PagerResult } from '#/api/basic';
import type { DeviceMonitorApi } from '#/api/iot/device/device-monitor';
import type { AggType } from '#/enums/agg-type';

import { getMultiMeasurementValue } from '#/api/dashboard';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace DeviceDataApi {
  export const Apis = {
    aggData: '/iot/device/data/{deviceId}/agg/_query',
    eventDataPage: '/iot/device/data/{deviceId}/event/{eventId}',
    logsData: '/iot/device/data/{deviceId}/logs',

    // 一条记录多个属性（一个属性一列）
    propertiesDataPage: '/iot/device/data/{deviceId}/properties/_query',
    propertiesDataList:
      '/iot/device/data/{deviceId}/properties/_query/no-paging',

    // 一个属性一条记录
    propertiesAllData: '/iot/device/data/{deviceId}/properties',
    propertiesLatestData: '/iot/device/data/{deviceId}/properties/latest',
    propertyLatestData: '/iot/device/data/{deviceId}/property/{property}',
    propertyDataList:
      '/iot/device/data/{deviceId}/property/{property}/_query/no-paging',
    propertyDataPage: '/iot/device/data/{deviceId}/property/{property}/_query',

    strategyMode: '/iot/device/data/strategy-mode/{strategyId}',
  };

  export type PropertyAggregation = {
    // 聚合类型
    agg: AggType;
    // 属性别名
    alias: string;
    // 要聚合的属性
    property: string;
  };

  export type AggregationRequest = {
    // 时间格式
    format: string;
    // 时间范围
    from: number;

    // 聚合时间间隔
    interval: string;
    to: number;
  };
  export type AggRequest = {
    columns: PropertyAggregation[];
    query: AggregationRequest;
  };

  export type DeviceLogData = {
    content: string;
    createTime: number;
    deviceId: string;
    id: string;
    messageId: string;
    orgId: string;
    productId: string;
    timestamp: number;
    type: string;
  };

  export type DeviceProperties = {
    [key: string]: any;
    deviceId: string;
  };

  export type DevicePropertyData = {
    createTime: number;
    deviceId: string;
    formatTime: string;
    formatValue: any;
    property: string;
    propertyName: string;
    state: string;
    timestamp: number;
    type: string;
    unit: string;
    value: any;
  };

  export type DeviceEventData = {
    [key: string]: any;
    createTime: number;
    deviceId: string;
    timestamp: number;
  };

  export type Sort = {
    name: string;
    order: 'asc' | 'desc';
    value: string;
  };
}

/**
 * 获取事件数据
 * @param deviceId
 * @param eventId
 * @param params
 */
export const getEventDataPage = (
  deviceId: string,
  eventId: string,
  params: QueryParamEntity,
) => {
  return requestClient.post<PagerResult<DeviceDataApi.DeviceEventData>>(
    parseTemplate(DeviceDataApi.Apis.eventDataPage, { deviceId, eventId }),
    params,
  );
};

/**
 * 分页 获取属性数据
 * @param deviceId 设备id
 * @param property 多个属性用 , 分割
 * @param params 搜索参数
 */
export const getPropertyDataPage = (
  deviceId: string,
  property: string,
  params: QueryParamEntity,
) => {
  return requestClient.post<PagerResult<DeviceDataApi.DevicePropertyData>>(
    parseTemplate(DeviceDataApi.Apis.propertyDataPage, {
      deviceId,
      property,
    }),
    params,
  );
};

/**
 * 获取属性数据 列表
 * @param deviceId
 * @param property 多个属性用 , 分割
 * @param params
 */
export const getPropertyDataList = (
  deviceId: string,
  property: string,
  params: QueryParamEntity,
) => {
  return requestClient.post<DeviceDataApi.DevicePropertyData[]>(
    parseTemplate(DeviceDataApi.Apis.propertyDataList, {
      deviceId,
      property,
    }),
    params,
  );
};

/**
 * 获取指定ID设备最新的全部属性
 * @param deviceId
 */
export const getDeviceLatestProperties = (deviceId: string) => {
  return requestClient.get<DeviceDataApi.DevicePropertyData[]>(
    parseTemplate(DeviceDataApi.Apis.propertiesLatestData, { deviceId }),
  );
};

/**
 * 获取指定设备的指定属性最新的属性数据
 * @param deviceId 设备
 * @param property 属性
 */
export const getDeviceLatestProperty = (deviceId: string, property: string) => {
  return requestClient.get<DeviceDataApi.DevicePropertyData>(
    parseTemplate(DeviceDataApi.Apis.propertyLatestData, {
      deviceId,
      property,
    }),
  );
};

/**
 * 按条件查询指定ID设备的全部属性
 * @param deviceId
 * @param params
 */
export const getDeviceProperties = (
  deviceId: string,
  params: QueryParamEntity,
) => {
  return requestClient.get<DeviceDataApi.DevicePropertyData[]>(
    parseTemplate(DeviceDataApi.Apis.propertiesAllData, { deviceId }),
    { params },
  );
};
/**
 * 分页按条件查询指定ID设备的属性  一条记录多个属性（一个属性一列）
 * @param deviceId
 * @param params
 */
export const getDevicePropertiesPage = (
  deviceId: string,
  params: QueryParamEntity,
) => {
  return requestClient.post<PagerResult<DeviceDataApi.DeviceProperties>>(
    parseTemplate(DeviceDataApi.Apis.propertiesDataPage, { deviceId }),
    params,
  );
};

/**
 * 按条件查询指定ID设备的属性列表 一条记录多个属性（一个属性一列）
 * @param deviceId
 * @param params
 */
export const getDevicePropertiesList = (
  deviceId: string,
  params: QueryParamEntity,
) => {
  return requestClient.post<DeviceDataApi.DeviceProperties[]>(
    parseTemplate(DeviceDataApi.Apis.propertiesDataList, { deviceId }),
    params,
  );
};

/**
 * 获取设备日志
 * @param deviceId
 * @param params
 */
export const getDeviceLogs = (deviceId: string, params: QueryParamEntity) => {
  return requestClient.post<DeviceDataApi.DeviceLogData[]>(
    parseTemplate(DeviceDataApi.Apis.logsData, { deviceId }),
    {
      params,
    },
  );
};
/**
 * 获取设备日志
 * @param deviceId
 * @param params
 */
export const getDevicePropertyAggData = (
  deviceId: string,
  params: DeviceDataApi.AggRequest,
) => {
  return requestClient.post<Record<string, any>[]>(
    parseTemplate(DeviceDataApi.Apis.aggData, { deviceId }),
    params,
  );
};

/**
 * 根据策略id获取策略模式
 * @param strategyId 策略id
 */
export const getStrategyMode = (strategyId: string) => {
  return requestClient.get<{
    id: string;
    name: string;
  }>(parseTemplate(DeviceDataApi.Apis.strategyMode, { strategyId }));
};

/**
 * 获取指定设备指定属性的最新数据
 * @param deviceId 设备id
 * @param productId 产品id
 * @param properties 属性名称列表
 */
export function getLastDeviceMessageMeasurementValue(
  deviceId: string,
  productId: string,
  properties: string[],
) {
  return getMultiMeasurementValue<DeviceMonitorApi.DeviceMessageMeasurementValue>(
    [
      {
        dashboard: 'device',
        object: productId,
        measurement: 'properties',
        dimension: 'history',
        params: {
          deviceId,
          history: 1,
          properties,
        },
      },
    ],
  );
}
