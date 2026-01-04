import type { Recordable } from '#/adapter';
import type { ConfigMetadata } from '#/types/config-metadata';
import type { DataType } from '#/types/data-type';
import type { WebSocketMessage } from '#/utils/websoket';

import { requestClient } from '#/api/request';
import { SubscribeType } from '#/enums/subscribe-topics';
import { parseTemplate } from '#/utils';
import { getWebSocket } from '#/utils/websoket';

export namespace DashboardApi {
  export interface DashboardMeasurementResponse<T = any> {
    data: MeasurementValue<T>;
    group: string;
  }

  /**
   * 仪表盘数据
   */
  export interface MeasurementValue<T = any> {
    timestamp: number;
    timeString: string;
    value: T;
  }

  export interface ObjectInfo {
    id: string;
    name: string;
  }

  export interface DashboardInfo {
    id: string;
    name: string;
    objects: ObjectInfo;
  }

  export interface DashboardMeasurementRequest {
    /**
     * 分组
     */
    group?: string;

    /**
     * 仪表盘,如: device
     */
    dashboard: string;

    /**
     * 仪表对象,如: device1
     */
    object: string;

    /**
     * 指标,如: 属性ID
     */
    measurement: string;

    /**
     * 维度
     */
    dimension: string;

    /**
     * 参数
     */
    params: Recordable;
  }

  export interface DimensionInfo {
    id: string;
    name: string;
    type: string;
    realTime: boolean;
    params: ConfigMetadata;
  }

  export interface MeasurementInfo {
    id: string;
    name: string;
    type: DataType;
    dimensions: DimensionInfo[];
  }
}

/**
 * 获取所有仪表定义信息
 */
export function getDefinitions() {
  return requestClient.get<DashboardApi.DashboardInfo[]>('/dashboard/defs');
}

/**
 * 获取仪表指标定义信息
 */
export function getMeasurementDefinitions(dashboard: string, object: string) {
  return requestClient.get(
    parseTemplate('/dashboard/def/{dashboard}/{object}/measurements', {
      dashboard,
      object,
    }),
  );
}

/**
 * 实时获取指标值 (sse)
 * @param params
 * @param onMessage
 * @param onEnd
 */
export function getMeasurementValue<T = Recordable>(
  params: DashboardApi.DashboardMeasurementRequest,
  onMessage: (arg: T) => any,
  onEnd: () => void,
) {
  return requestClient.requestSSE(
    parseTemplate('/dashboard/{dashboard}/{object}/{measurement}/{dimension}', {
      dashboard: params.dashboard,
      object: params.object,
      measurement: params.measurement,
      dimension: params.dimension,
    }),
    params.params,
    {
      onMessage(data) {
        onMessage(JSON.parse(data) as T);
      },
      onEnd,
    },
  );
}

/**
 * POST 方式批量获取仪表数据,不支持获取实时数据
 * @param requests 请求参数
 * @return DashboardApi.DashboardMeasurementResponse
 */
export function getMultiMeasurementValue<T = any>(
  requests: DashboardApi.DashboardMeasurementRequest[],
) {
  return requestClient.post<DashboardApi.DashboardMeasurementResponse<T>[]>(
    '/dashboard/_multi',
    requests,
  );
}

/**
 * 使用EventSource方式批量获取仪表数据,支持获取实时数据
 * @param request 请求参数
 * @param onMessage 消息回调
 * @param onEnd 结束回调
 */
export function getMultiMeasurementValueSse(
  request: DashboardApi.DashboardMeasurementRequest,
  onMessage: (arg: Recordable) => any,
  onEnd: () => void,
) {
  return requestClient.requestSSE(
    '/dashboard/_multi',
    JSON.stringify(request),
    {
      onMessage(data) {
        onMessage(JSON.parse(data));
      },
      onEnd,
    },
  );
}

/**
 * ws订阅Dashboard
 * @param subscribeId 订阅ud
 * @param request 订阅请求
 * @param onMessage
 */
export function subscribeMeasurementValue<T>(
  subscribeId: string,
  request: DashboardApi.DashboardMeasurementRequest,
  onMessage?: (message: WebSocketMessage<T>) => void,
) {
  const topic = SubscribeType.DASHBOARD.formatTopicValue(request);
  return getWebSocket<T>(subscribeId, topic, request.params, {
    urlSuffix: '/messaging',
  }).subscribe((message) => {
    try {
      onMessage && onMessage(message);
    } catch {
      console.error('出现异常：', message);
    }
  });
}
