import type { DashboardApi } from '#/api/dashboard';
import type { UpgradeState } from '#/enums/firmware-upgrade';
import type { ProgressType } from '#/enums/subscribe-topics';
import type {
  ReadPropertiesReplyMessage,
  ReportFirmwareDownloadProgressMessage,
  ReportFirmwareUpgradeProgressMessage,
} from '#/types/device';
import type { WebSocketMessage } from '#/utils/websoket';

import { subscribeMeasurementValue } from '#/api/dashboard';
import { DeviceDataApi } from '#/api/iot/device/data';
import { SubscribeType } from '#/enums/subscribe-topics';
import { getWebSocket } from '#/utils/websoket';

export namespace DeviceMonitorApi {
  export type DeviceMessageSubscription = {
    deviceId: string;
    isAll?: boolean;
    productId?: string;
    properties?: Record<string, any>;
  };

  export type DeviceFirmwareProgressMessageSubscription = {
    deviceId: string; // 设备id
    firmwareId: string; // 固件id
    productId: string; // 产品id
    progressType: ProgressType; // 进度类型
    version: string; // 固件版本
  };

  export type DeviceMessageReplyCallback<T> = (
    message: WebSocketMessage<T>,
  ) => void;
  export type DeviceFirmwareProgressCallback<T> = (
    message: WebSocketMessage<T>,
  ) => void;
  export type DeviceFirmwareUpgradeResponseCallback<T> = (
    message: WebSocketMessage<T>,
  ) => void;

  // 设备操作类型
  export type OperationPayloadType = 'CONNECT' | 'DISCONNECT';
  // 设备操作消息
  export type DeviceOperationMessage = {
    code: 200 | 500;
    deviceId: string;
    message: string;
    type: OperationPayloadType;
  };

  export interface FirmwareUpgradeResponse {
    // 设备ID
    deviceId: string;
    // 实例ID
    instanceId: string;
    // 任务ID
    taskId: string;
    // 升级是否成功
    success: boolean;
    // 升级状态
    state: UpgradeState;
    // 升级进度
    progress: number;
    // 升级消息
    message: string;
  }

  export interface FirmwareProgressInfo {
    firmwareId: string;
    version: string;
    progress: number;
    message: string;
    completed: boolean;
    success: boolean;
    errorCode: string;
    errorMsg: string;
  }

  export type DeviceState = {
    deviceId: string;
    type: 'offline' | 'online';
  };

  // 实时消息维度定义
  export type DeviceMessageMeasurementValue =
    DashboardApi.MeasurementValue<DeviceDataApi.DevicePropertyData>;

  export type DeviceStateMeasurementValue =
    DashboardApi.MeasurementValue<DeviceState>;

  /**
   * 调试轨迹数据类型
   */
  export type TraceDataType = 'data' | 'log';

  /**
   * 调试轨迹数据
   */
  export interface TraceData {
    // 数据内容
    detail: any;
    // 结束时间 毫秒
    endTime: number;
    // 是否有错误信息
    error: boolean;
    /**
     * @see DeviceTracer.SpanName
     * 操作. encode,decode
     */
    operation: string;
    // 开始时间 毫秒
    startTime: number;
    /**
     * 跟踪数据类型
     */
    type: TraceDataType;
    // 跟踪ID
    traceId: string;
  }
}

/**
 * 订阅固件升级响应消息（包含进度和状态）
 * @param taskId
 * @param callback
 */
export function subscribeFirmwareUpgradeResponse(
  taskId: string,
  callback?: DeviceMonitorApi.DeviceFirmwareUpgradeResponseCallback<DeviceMonitorApi.FirmwareUpgradeResponse>,
) {
  const topic =
    SubscribeType.DEVICE_FIRMWARE_UPGRADE_RESPONSE_MESSAGE.formatTopicValue(
      taskId,
    );
  return getWebSocket<DeviceMonitorApi.FirmwareUpgradeResponse>(
    `device-firmware-upgrade-response-${taskId}`,
    topic,
    {},
    {
      urlSuffix: '/messaging',
    },
  ).subscribe((message) => {
    try {
      callback && callback(message);
    } catch {
      console.error('出现异常：', message);
    }
  });
}

/**
 * 订阅网关盒子固件升级进度消息（包含进度和实时日志）
 * @param accessId 接入客户端id
 * @param callback
 */
export function subscribeBoxFirmwareUpgradeProgressInfo(
  accessId: string,
  callback?: DeviceMonitorApi.DeviceFirmwareUpgradeResponseCallback<DeviceMonitorApi.FirmwareProgressInfo>,
) {
  const topic =
    SubscribeType.GATEWAY_BOX_FIRMWARE_UPGRADE_PROGRESS_INFO_MESSAGE.formatTopicValue(
      accessId,
    );
  return getWebSocket<DeviceMonitorApi.FirmwareProgressInfo>(
    `box-firmware-upgrade-progress-${accessId}`,
    topic,
    {},
    {
      urlSuffix: '/messaging',
    },
  ).subscribe((message) => {
    try {
      callback && callback(message);
    } catch {
      console.error('出现异常：', message);
    }
  });
}

/**
 * 订阅固件进度消息
 * @param subscription
 * @param callback
 */
export function subscribeFirmwareProgressMessage(
  subscription: DeviceMonitorApi.DeviceFirmwareProgressMessageSubscription,
  callback?: DeviceMonitorApi.DeviceFirmwareProgressCallback<
    ReportFirmwareDownloadProgressMessage | ReportFirmwareUpgradeProgressMessage
  >,
) {
  const topic = SubscribeType.DEVICE_FIRMWARE_PROGRESS_MESSAGE.formatTopicValue(
    subscription.deviceId,
    subscription.productId,
    subscription.version,
    subscription.firmwareId,
    subscription.progressType,
  );

  return getWebSocket<
    ReportFirmwareDownloadProgressMessage | ReportFirmwareUpgradeProgressMessage
  >(
    `device-firmware-${subscription.progressType}-progress-${subscription.deviceId}`,
    topic,
    {},
    {
      urlSuffix: '/messaging',
    },
  ).subscribe((message) => {
    try {
      callback && callback(message);
    } catch {
      console.error('出现异常：', message);
    }
  });
}

/**
 * 订阅设备实时属性消息
 * @param deviceId 设备id
 * @param productId 产品id
 * @param properties 属性名称
 * @param onMessage 回调方法
 */
export function subscribeDeviceMessageMonitor(
  deviceId: string,
  productId: string,
  properties: string[],
  onMessage: (
    message: WebSocketMessage<DeviceMonitorApi.DeviceMessageMeasurementValue>,
  ) => void,
) {
  return subscribeMeasurementValue(
    `device-message-realTime-${deviceId}-${productId}-${properties.join('-')}`,
    {
      dashboard: 'device',
      object: productId,
      measurement: 'properties',
      dimension: 'realTime',
      params: {
        deviceId,
        history: '1',
        properties,
      },
    },
    onMessage,
  );
}

/**
 * 订阅设备状态消息
 * @param deviceId 设备id
 * @param productId 产品id
 * @param onMessage 回调方法
 */
export function subscribeDeviceStateMonitor(
  deviceId: string,
  productId: string,
  onMessage: (
    message: WebSocketMessage<DeviceMonitorApi.DeviceStateMeasurementValue>,
  ) => void,
) {
  return subscribeMeasurementValue(
    `device-state-realTime-${deviceId}-${productId}`,
    {
      dashboard: 'device',
      object: 'status',
      measurement: 'change',
      dimension: 'realTime',
      params: {
        deviceId,
      },
    },
    onMessage,
  );
}

/**
 * 订阅设备实时消息
 * @param subscription
 * @param callback
 */
export function subscribeRealTimeDeviceMessage(
  subscription: DeviceMonitorApi.DeviceMessageSubscription,
  callback?: DeviceMonitorApi.DeviceMessageReplyCallback<ReadPropertiesReplyMessage>,
) {
  const topic = SubscribeType.DEVICE_MESSAGE_SUB.formatTopicValue(
    subscription.deviceId,
    subscription.productId,
  );
  return getWebSocket<ReadPropertiesReplyMessage>(
    `device-realTime-property-${subscription.deviceId}`,
    topic,
    subscription.properties || {},
    {
      urlSuffix: '/messaging',
    },
  ).subscribe((message) => {
    try {
      callback && callback(message);
    } catch {
      console.error('出现异常：', message);
    }
  });
}

/**
 * 订阅设备操作消息
 * @param subscription
 * @param callback
 */
export function subscribeDeviceOperationMessage(
  subscription: DeviceMonitorApi.DeviceMessageSubscription,
  callback?: DeviceMonitorApi.DeviceMessageReplyCallback<DeviceMonitorApi.DeviceOperationMessage>,
) {
  return getWebSocket<DeviceMonitorApi.DeviceOperationMessage>(
    `device-operation${subscription.deviceId}`,
    SubscribeType.DEVICE_OPERATION_MESSAGE_SUB.formatTopicValue(
      subscription.deviceId,
      subscription.productId,
    ),
    {},
    {
      urlSuffix: '/messaging',
    },
  ).subscribe((message) => {
    callback && callback(message);
  });
}

/**
 * 订阅设备调试轨迹消息
 * @param deviceId 设备id
 * @param callback 回调方法
 */
export function subscribeDeviceDebug(
  deviceId: string,
  callback?: DeviceMonitorApi.DeviceMessageReplyCallback<DeviceMonitorApi.TraceData>,
) {
  const topic =
    SubscribeType.DEVICE_DEBUG_TRACE_MESSAGE.formatTopicValue(deviceId);
  return getWebSocket<DeviceMonitorApi.TraceData>(
    `device-debug-${deviceId}`,
    topic,
    {},
    {
      urlSuffix: '/messaging',
    },
  ).subscribe((message) => {
    try {
      callback && callback(message);
    } catch (error) {
      console.error('设备调试消息处理异常：', error, message);
    }
  });
}
