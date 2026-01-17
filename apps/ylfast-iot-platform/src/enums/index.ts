import type { EnumDict } from '#/types/global';

import { $t } from '@vben/locales';

export type CommonState = 'ENABLE' | 'FORBIDDEN' | 'PAUSE';
export type GeneralState = 'disabled' | 'enabled' | 'paused';
export type CommonStateNumber = 0 | 1 | 2;

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
