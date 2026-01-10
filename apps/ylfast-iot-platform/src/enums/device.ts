import type { EnumDict } from '#/types/global';

import { $t } from '@vben/locales';

export type DeviceType = 'DIRECT' | 'GATEWAY' | 'GATEWAY_CHILD';
export type DeviceState = 'offline' | 'online' | 'other' | 'unActive';
export type DeviceStoreStrategyMode = 'COLUMN' | 'NONE' | 'ROW';

export const DEVICE_STORE_STRATEGY_MODE: {
  [key in DeviceStoreStrategyMode]: DeviceStoreStrategyMode;
} = {
  COLUMN: 'COLUMN',
  NONE: 'NONE',
  ROW: 'ROW',
} as const;

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
export type DeviceStoreStrategyModeEnumDict = EnumDict<DeviceStoreStrategyMode>;

export interface DeviceTypeEnumDict extends EnumDict<DeviceType> {
  color?: string;
}

export interface DeviceStateEnumDict extends EnumDict<DeviceState> {
  statusColor?: string;
  iconClass?: string;
}

export const DEVICE_STORE_STRATEGY_MODE_ENUMS: {
  [key in DeviceStoreStrategyMode]: DeviceStoreStrategyModeEnumDict;
} = {
  COLUMN: {
    value: 'COLUMN',
    get label() {
      return $t('device.storeStrategyMode.COLUMN');
    },
    get text() {
      return $t('device.storeStrategyMode.COLUMN');
    },
  },
  NONE: {
    value: 'NONE',
    get label() {
      return $t('device.storeStrategyMode.NONE');
    },
    get text() {
      return $t('device.storeStrategyMode.NONE');
    },
  },
  ROW: {
    value: 'ROW',
    get label() {
      return $t('device.storeStrategyMode.ROW');
    },
    get text() {
      return $t('device.storeStrategyMode.ROW');
    },
  },
};

export const DEVICE_STORE_STRATEGY_MODES: DeviceStoreStrategyModeEnumDict[] =
  Object.values(DEVICE_STORE_STRATEGY_MODE_ENUMS);

export const DEVICE_STATE_TYPE_ENUMS: {
  [key in DeviceState]: DeviceStateEnumDict;
} = {
  offline: {
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
  online: {
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
  unActive: {
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
  other: {
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
};

export const DEVICE_STATE_TYPES: DeviceStateEnumDict[] = Object.values(
  DEVICE_STATE_TYPE_ENUMS,
);

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

export function getDeviceType(type: string) {
  return (
    DEVICE_TYPE_ENUMS[type as DeviceType] || {
      label: type,
      text: type,
      value: type,
      color: 'default',
    }
  );
}

export function getDeviceState(state: string) {
  return (
    DEVICE_STATE_TYPES.find((item) => item.value === state) || {
      label: state,
      text: state,
      value: state,
      statusColor: 'default',
    }
  );
}
