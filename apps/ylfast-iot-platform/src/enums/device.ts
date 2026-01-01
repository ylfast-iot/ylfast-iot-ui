import type { EnumDict } from '#/types/global';

import { $t } from '@vben/locales';

export type DeviceType = 'DIRECT' | 'GATEWAY' | 'GATEWAY_CHILD';
export type DeviceState = 'offline' | 'online' | 'other' | 'unActive';

export interface DeviceTypeEnumDict extends EnumDict<DeviceType> {
  color?: string;
}

export const DEVICE_TYPE: { [key in DeviceType]: DeviceType } = {
  DIRECT: 'DIRECT',
  GATEWAY: 'GATEWAY',
  GATEWAY_CHILD: 'GATEWAY_CHILD',
} as const;

export const DEVICE_STATE: { [key in DeviceState]: DeviceState } = {
  offline: 'offline',
  online: 'online',
  unActive: 'unActive',
  other: 'other',
} as const;

export interface DeviceStateEnumDict extends EnumDict<DeviceState> {
  statusColor?: string;
  iconClass?: string;
}

export const DEVICE_STATE_TYPES: DeviceStateEnumDict[] = [
  {
    value: 'offline',
    get label() {
      return $t('device.state.offline');
    },
    get text() {
      return $t('device.state.offline');
    },
    statusColor: 'default',
    iconClass: 'text-gray-400',
  },
  {
    value: 'online',
    get label() {
      return $t('device.state.online');
    },
    get text() {
      return $t('device.state.online');
    },
    statusColor: 'success',
    iconClass: 'text-green-500',
  },
  {
    value: 'unActive',
    get label() {
      return $t('device.state.unActive');
    },
    get text() {
      return $t('device.state.unActive');
    },
    statusColor: 'warning',
    iconClass: 'text-orange-500',
  },
  {
    value: 'other',
    get label() {
      return $t('device.state.other');
    },
    get text() {
      return $t('device.state.other');
    },
    statusColor: 'processing',
    iconClass: 'text-blue-500',
  },
];

export const DEVICE_TYPE_ENUMS: { [key in DeviceType]: DeviceTypeEnumDict } = {
  DIRECT: {
    value: 'DIRECT',
    get label() {
      return $t('device.types.DIRECT');
    },
    get text() {
      return $t('device.types.DIRECT');
    },
    color: 'blue',
  },
  GATEWAY: {
    value: 'GATEWAY',
    get label() {
      return $t('device.types.GATEWAY');
    },
    get text() {
      return $t('device.types.GATEWAY');
    },
    color: 'purple',
  },
  GATEWAY_CHILD: {
    value: 'GATEWAY_CHILD',
    get label() {
      return $t('device.types.GATEWAY_CHILD');
    },
    get text() {
      return $t('device.types.GATEWAY_CHILD');
    },
    color: 'cyan',
  },
};

// 设备类型
export const DEVICE_TYPES: DeviceTypeEnumDict[] =
  Object.values(DEVICE_TYPE_ENUMS);
