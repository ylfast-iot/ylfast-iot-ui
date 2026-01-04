import type { Recordable } from '#/adapter';
import type {
  DeviceMessageReplyType,
  DeviceMessageType,
} from '#/enums/message';
import type { DataType } from '#/types/data-type';

export interface DeviceMessage {
  deviceId: string;
  messageType: DeviceMessageType;
  headers?: Recordable;
}

// 回复消息
export interface DeviceMessageReply {
  deviceId: string;
  messageId: string;
  message: string;
  success: boolean;
  code: string;
  headers: {
    productId?: string;
    seq: string;
  };
  timestamp: number;
  messageType: DeviceMessageReplyType;
}

// 子设备消息
export type SubDeviceMessage<T extends DeviceMessage> = {
  subDeviceId: string;
  subDeviceMessage: T; // 子设备的具体消息内容
} & DeviceMessage;

// 子设备回复消息
export type SubDeviceMessageReply<T extends DeviceMessageReply> = {
  subDeviceId: string;
  subDeviceMessage: T; // 子设备的具体消息内容
} & DeviceMessageReply;

// 属性读取消息
export type ReadPropertiesMessage = DeviceMessage & {
  properties: string[];
};

// 属性读取回复消息
export type ReadPropertiesReplyMessage = DeviceMessageReply & {
  properties: Record<string, any>;
};

// 写属性消息
export type WritePropertiesMessage = DeviceMessage & {
  properties: Record<string, any>;
};

// 写属性回复消息
export type WritePropertiesReplyMessage = DeviceMessageReply & {
  properties: Record<string, DataType>;
};

export type invokeParam = {
  name: string; // 参数名称
  value: any; // 参数值
};

// 方法调用消息
export type InvokeFunctionMessage = DeviceMessage & {
  functionId: string;
  params: invokeParam[];
};

// 方法调用消息
export type InvokeFunctionReplyMessage = DeviceMessage & {
  functionId: string;
  output: any;
};

// 上报固件下载进度消息
export type ReportFirmwareDownloadProgressMessage =
  ReportFirmwareProgressMessage;
// 上报固件更新进度消息
export type ReportFirmwareUpgradeProgressMessage =
  ReportFirmwareProgressMessage;
export type ReportFirmwareProgressMessage = DeviceMessage & {
  complete: boolean;
  errorCode: string;
  errorMsg: string;
  firmwareId: string;
  progress: number;
  success: boolean;
  version: string;
};
