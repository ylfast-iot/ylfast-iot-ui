import type { DashboardApi } from '.';

import { getMultiMeasurementValue } from '.';

export namespace DashboardDeviceMonitorApi {
  export type DeviceOnlineCountMonitorGroup = 'aggOnline';

  // 设备消息数量监控指标分组（今天设备消息量、昨天设备消息量、本月设备消息量、设备消息量）
  export type DeviceMessageQuantityMonitorGroup =
    | 'device_msg'
    | 'oneday'
    | 'thisMonth'
    | 'today'
    | 'yesterday';

  export interface DeviceOnlineMetricParams
    extends DashboardApi.BaseMetricParams {
    /** 状态 */
    state?: 'offline' | 'online';
  }

  /** 趋势图数据类型 */
  export type TrendChartData =
    DashboardApi.DashboardMeasurementNumberResponse[];
}

/**
 * 获取设备在线数量监控指标值（用于指定时间范围内的设备在线数量）
 * @param params 请求参数
 */
export function getDeviceOnlineCountMonitorMeasurementValue(
  params: DashboardDeviceMonitorApi.DeviceOnlineMetricParams,
) {
  if (!params.format) {
    params.format = 'YYYY-MM-dd HH:mm:ss';
  }

  return getMultiMeasurementValue<number>([
    {
      dashboard: 'device',
      dimension: 'agg',
      group: 'aggOnline',
      measurement: 'online',
      object: 'session',
      params: {
        state: 'online',
        ...params,
      },
    },
  ]);
}

/**
 * 获取设备消息数量监控指标值（用于指定时间范围内的设备消息数量,用group区分不同的时间范围）
 * @param requests 请求参数
 */
export function getDeviceMessageQuantityMonitorMeasurementValue(
  requests: {
    group: DashboardDeviceMonitorApi.DeviceMessageQuantityMonitorGroup;
    params: DashboardApi.BaseMetricParams;
  }[],
) {
  return getMultiMeasurementValue<number>(
    requests.map((request) => {
      const { group, params } = request;
      if (!params.format) {
        params.format = 'yyyy-MM-dd HH:mm:ss';
      }
      return {
        dashboard: 'device',
        dimension: 'agg',
        group,
        measurement: 'quantity',
        object: 'message',
        params,
      };
    }),
  );
}
