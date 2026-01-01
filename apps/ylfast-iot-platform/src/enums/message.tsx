import type { JSX } from 'vue/jsx-runtime';

import type { EnumDict } from '#/types/global';

import { createIconifyIcon } from '@vben/icons';

export type DeviceMessageReplyType =
  | 'INVOKE_FUNCTION_REPLY'
  | 'READ_PROPERTY_REPLY'
  | 'SUB_DEVICE_REPLY'
  | 'WRITE_PROPERTY_REPLY';

export type DeviceMessageType =
  | 'ACK'
  | 'EVENT'
  | 'HEART_BEAT'
  | 'INVOKE_FUNCTION'
  | 'OFF_LINE'
  | 'ON_LINE'
  | 'READ_PROPERTY'
  | 'REGISTER'
  | 'REPORT_PROPERTY'
  | 'SUB_DEVICE'
  | 'UN_REGISTER'
  | 'UNKNOWN'
  | 'WRITE_PROPERTY';

type MessageType = DeviceMessageReplyType | DeviceMessageType;
export type DeviceMessageTypeValue = EnumDict<MessageType> & {
  icon?: (props: {
    color?: string;
    icon?: string;
    size: string;
  }) => JSX.Element;
  label: string;
};
export type DeviceMessageTypeEnum = {
  [key in MessageType]: DeviceMessageTypeValue;
};

export const DEVICE_MESSAGE_TYPE_ENUM: DeviceMessageTypeEnum = {
  SUB_DEVICE: {
    value: 'SUB_DEVICE',
    label: '子设备消息',
    text: '子设备消息',
  },
  SUB_DEVICE_REPLY: {
    value: 'SUB_DEVICE_REPLY',
    label: '子设备消息回复',
    text: '子设备消息回复',
  },
  REPORT_PROPERTY: {
    value: 'REPORT_PROPERTY',
    label: '属性上报',
    text: '属性上报',
  },
  READ_PROPERTY: {
    value: 'READ_PROPERTY',
    label: '读属性',
    text: '读属性',
    icon: (props) => {
      const Icon = createIconifyIcon('material-symbols:barcode-reader-rounded');
      return <Icon color={'#fff'} {...props}></Icon>;
    },
  },
  READ_PROPERTY_REPLY: {
    value: 'READ_PROPERTY_REPLY',
    label: '读属性回复',
    text: '读属性回复',
  },
  WRITE_PROPERTY: {
    value: 'WRITE_PROPERTY',
    label: '写属性',
    text: '写属性',
    icon: (props) => {
      const Icon = createIconifyIcon('material-symbols:box-edit');
      return <Icon color={'#fff'} {...props}></Icon>;
    },
  },
  WRITE_PROPERTY_REPLY: {
    value: 'WRITE_PROPERTY_REPLY',
    label: '写属性回复',
    text: '写属性回复',
  },
  INVOKE_FUNCTION: {
    value: 'INVOKE_FUNCTION',
    label: '功能调用',
    text: '功能调用',
    icon: (props) => {
      const Icon = createIconifyIcon('material-symbols:pin-invoke');
      return <Icon color={'#fff'} {...props}></Icon>;
    },
  },
  INVOKE_FUNCTION_REPLY: {
    value: 'INVOKE_FUNCTION_REPLY',
    label: '功能调用回复',
    text: '功能调用回复',
  },
  REGISTER: {
    value: 'REGISTER',
    label: '设备注册',
    text: '设备注册',
  },
  UN_REGISTER: {
    value: 'UN_REGISTER',
    label: '设备取消注册',
    text: '设备取消注册',
  },
  OFF_LINE: {
    value: 'OFF_LINE',
    label: '离线',
    text: '离线',
  },
  ON_LINE: {
    value: 'ON_LINE',
    label: '在线',
    text: '在线',
  },
  EVENT: {
    value: 'EVENT',
    label: '事件',
    text: '事件',
  },
  ACK: {
    value: 'ACK',
    label: '应答',
    text: '应答',
  },
  HEART_BEAT: {
    value: 'HEART_BEAT',
    label: '心跳',
    text: '心跳',
  },
  UNKNOWN: {
    value: 'UNKNOWN',
    label: '未知',
    text: '未知',
  },
};
