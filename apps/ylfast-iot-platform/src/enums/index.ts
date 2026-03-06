import type { EnumDict } from '#/types/global';

import { $t } from '@vben/locales';

export type CommonState = 'ENABLE' | 'FORBIDDEN' | 'PAUSE';
export type GeneralState = 'disabled' | 'enabled' | 'paused';
export type SignatureMethod = 'MD5' | 'SHA256';
export type CommonStateNumber = 0 | 1 | 2;

export const SIGNATURE_METHOD: {
  [key in SignatureMethod]: EnumDict<SignatureMethod>;
} = {
  MD5: {
    value: 'MD5',
    label: 'MD5',
    text: 'MD5',
  },
  SHA256: {
    value: 'SHA256',
    label: 'SHA256',
    text: 'SHA256',
  },
} as const;

export const GENERAL_STATE: {
  [key in GeneralState]: GeneralState;
} = {
  disabled: 'disabled',
  enabled: 'enabled',
  paused: 'paused',
} as const;

export const COMMON_STATE: {
  [key in CommonState]: EnumDict<CommonStateNumber>;
} = {
  FORBIDDEN: {
    value: 0,
    get label() {
      return $t('common.state.FORBIDDEN');
    },
    get text() {
      return $t('common.state.FORBIDDEN');
    },
  },
  ENABLE: {
    value: 1,
    get label() {
      return $t('common.state.ENABLE');
    },
    get text() {
      return $t('common.state.ENABLE');
    },
  },
  PAUSE: {
    value: 2,
    get label() {
      return $t('common.state.PAUSE');
    },
    get text() {
      return $t('common.state.PAUSE');
    },
  },
} as const;
