import type { DashboardApi } from '#/api/dashboard/index';
import type { WebSocketMessage } from '#/utils/websoket';

import { Subscription } from 'rxjs';

import {
  getMultiMeasurementValue,
  subscribeMeasurementValue,
} from '#/api/dashboard/index';

export namespace DashboardSystemMonitor {
  /**
   * 系统资源统计
   */
  export type SystemMeasurementValue =
    DashboardApi.MeasurementValue<SystemInfo>;

  /**
   * 平铺后的系统资源统计
   */
  export type SystemFlatMeasurementValue =
    DashboardApi.MeasurementValue<SystemFlatInfo>;

  /**
   * 系统资源统计相关
   */

  /**
   * CPU信息
   */
  export interface CpuInfo {
    /**
     * JVM进程CPU使用率,0-100
     */
    jvmUsage: number;
    /**
     * 系统CPU使用率,0-100
     */
    systemUsage: number;
  }

  export interface MemoryInfo {
    /**
     * JVM堆总内存,单位MB
     */
    jvmHeapTotal: number;

    /**
     * JVM堆可用内存,单位MB
     */
    jvmHeapFree: number;

    /**
     * JVM堆外总内存,单位MB
     */
    jvmNonHeapTotal: number;

    /**
     * JVM堆外可用内存,单位MB
     */
    jvmNonHeapFree: number;

    /**
     * 系统总内存,单位MB
     */
    systemTotal: number;

    /**
     * 系统可用内存,单位MB
     */
    systemFree: number;

    /**
     * JVM内存使用率,0-100
     */
    jvmHeapUsage: number;

    /**
     * 系统内存使用率,0-100
     */
    jvmNonHeapUsage: number;
    /**
     * 系统内存使用率,0-100
     */
    systemUsage: number;
  }

  export interface DiskInfo {
    /**
     * 磁盘总容量,单位MB
     */
    total: number;
    /**
     * 磁盘可用容量,单位MB
     */
    free: number;

    /**
     * 磁盘使用率,0-100
     */
    usage: number;
  }

  /**
   * 系统资源统计
   */
  export interface SystemInfo {
    cpu: CpuInfo;
    memory: MemoryInfo;
    disk: DiskInfo;
  }
  export interface SystemFlatInfo {
    /**
     * JVM进程CPU使用率,0-100
     */
    cpuJvmUsage: number;
    /**
     * 系统CPU使用率,0-100
     */
    cpuSystemUsage: number;
    /**
     * JVM堆总内存,单位MB
     */
    memoryJvmHeapTotal: number;

    /**
     * JVM堆可用内存,单位MB
     */
    memoryJvmHeapFree: number;

    /**
     * JVM堆外总内存,单位MB
     */
    memoryJvmNonHeapTotal: number;

    /**
     * JVM堆外可用内存,单位MB
     */
    memoryJvmNonHeapFree: number;

    /**
     * 系统总内存,单位MB
     */
    memorySystemTotal: number;

    /**
     * 系统可用内存,单位MB
     */
    memorySystemFree: number;

    /**
     * JVM内存使用率,0-100
     */
    memoryJvmHeapUsage: number;

    /**
     * 系统内存使用率,0-100
     */
    memoryJvmNonHeapUsage: number;
    /**
     * 系统内存使用率,0-100
     */
    memorySystemUsage: number;

    /**
     * 磁盘总容量,单位MB
     */
    diskTotal: number;
    /**
     * 磁盘可用容量,单位MB
     */
    diskFree: number;

    /**
     * 磁盘使用率,0-100
     */
    diskUsage: number;
  }

  // 定义 group 的联合类型
  export type SystemMonitorGroup = 'all' | 'cpu' | 'disk' | 'jvm' | 'memory';

  // 定义 params 的对象类型
  export interface MetricParams {
    /** 起始时间戳（必选） */
    from: number;
    format?: string;
    /** 结束时间戳（必选） */
    to: number;
    /** 服务器节点ID,不填默认为当前节点 */
    serverId?: string;
  }
}

/**
 * 实时订阅系统资源信息
 * @param onMessage 消息回调
 * @param serverId 服务器节点ID,不填默认为当前节点
 */
export function subscribeSystemMonitor(
  onMessage: (
    message: WebSocketMessage<DashboardSystemMonitor.SystemMeasurementValue>,
  ) => void,
  serverId?: string,
): Subscription {
  return subscribeMeasurementValue(
    `operations-statistics-system-info-realTime`,
    {
      dashboard: 'systemMonitor',
      object: 'stats',
      measurement: 'info',
      dimension: 'realTime',
      params: {
        type: 'all',
        interval: '1s',
        agg: 'avg',
        serverId,
      },
    },
    onMessage,
  );
}

/**
 * 获取系统资源历史统计信息
 * @param group 分组类型
 * @param params 请求参数
 */
export function getSystemMonitorHistoryMeasurementValue(
  group: DashboardSystemMonitor.SystemMonitorGroup,
  params: any,
) {
  if (!params.format) {
    params.format = 'YYYY-MM-dd HH:mm:ss';
  }
  return getMultiMeasurementValue<DashboardSystemMonitor.SystemFlatMeasurementValue>(
    [
      {
        dashboard: 'systemMonitor',
        object: 'stats',
        group,
        measurement: 'info',
        dimension: 'history',
        params,
      },
    ],
  );
}
