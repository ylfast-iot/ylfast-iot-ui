import type { EnumDict } from '#/types/global';

import { replaceVariables } from '#/utils';

export type SubscribeType =
  | 'DASHBOARD'
  | 'DATA_COLLECT_SUB'
  | 'DEVICE_FIRMWARE_PROGRESS_MESSAGE'
  | 'DEVICE_FIRMWARE_UPGRADE_RESPONSE_MESSAGE'
  | 'DEVICE_MESSAGE_SUB'
  | 'DEVICE_OPERATION_MESSAGE_SUB'
  | 'GATEWAY_BOX_FIRMWARE_UPGRADE_PROGRESS_INFO_MESSAGE';
export interface SubscribeTypeEnumValue extends EnumDict<string> {
  formatTopicValue: (...args: any) => string;
  label: string;
}

export type SubscribeTypeEnum = {
  [key in SubscribeType]: SubscribeTypeEnumValue;
};

export type ProgressType = 'download' | 'upgrade';

export const SubscribeType: SubscribeTypeEnum = {
  DASHBOARD: {
    value: '/dashboard/{dashboard}/{object}/{measurement}/{dimension}',
    formatTopicValue(params: {
      dashboard: string;
      dimension: string;
      measurement: string;
      object: string;
    }) {
      return replaceVariables(this.value, params);
    },
    label: 'dashboard 订阅主题',
    text: 'dashboard 订阅主题',
  },
  DEVICE_FIRMWARE_UPGRADE_RESPONSE_MESSAGE: {
    value: '/device/firmware/upgrade/response/{taskId}',
    formatTopicValue(taskId) {
      return replaceVariables(this.value, {
        taskId,
      });
    },
    label: '云平台固件升级响应订阅主题',
    text: '云平台固件升级响应订阅主题',
  },
  GATEWAY_BOX_FIRMWARE_UPGRADE_PROGRESS_INFO_MESSAGE: {
    value: '/box/firmware/upgrade/progress/{accessId}',
    formatTopicValue(accessId) {
      return replaceVariables(this.value, {
        accessId,
      });
    },
    label: '网关盒子固件升级进度信息订阅主题',
    text: '网关盒子固件升级进度信息订阅主题',
  },
  DATA_COLLECT_SUB: {
    value: '/data/collect/message/{collectorId}',
    formatTopicValue(collectorId) {
      return replaceVariables(this.value, {
        collectorId,
      });
    },
    label: '数据采集订阅主题',
    text: '数据采集订阅主题',
  },
  DEVICE_MESSAGE_SUB: {
    value: '/device/{productId}/{deviceId}/message/property/report',
    formatTopicValue(deviceId: string, productId: string) {
      return replaceVariables(this.value, {
        deviceId,
        productId,
      });
    },
    label: '设备消息订阅主题(实时)',
    text: '设备消息订阅主题(实时)',
  },
  DEVICE_OPERATION_MESSAGE_SUB: {
    value: '/device/{product}/{deviceId}/online,offline',
    formatTopicValue(deviceId: string, productId: string) {
      return replaceVariables(this.value, {
        deviceId,
        productId,
      });
    },
    label: '设备操作消息',
    text: '设备操作消息',
  },
  DEVICE_FIRMWARE_PROGRESS_MESSAGE: {
    value:
      '/device/firmware/{progressType}/progress/{productId}/{deviceId}/{version}/{firmwareId}',
    formatTopicValue(
      deviceId: string,
      productId: string,
      version: string,
      firmwareId: string,
      progressType: ProgressType,
    ) {
      return replaceVariables(this.value, {
        deviceId,
        productId,
        version,
        firmwareId,
        progressType,
      });
    },
    label: '设备固件进度消息',
    text: '设备固件进度消息',
  },
};
