import type { EnumDict } from '#/types/global';

import { $t } from '@vben/locales';

export type AlarmLevel =
  | 'LEVEL0'
  | 'LEVEL1'
  | 'LEVEL2'
  | 'LEVEL3'
  | 'LEVEL4'
  | 'LEVEL5'
  | 'LEVEL6'
  | 'LEVEL7';

type AlarmLevelEnum = {
  [key in AlarmLevel]: EnumDict<AlarmLevel>;
};

export const ALARM_LEVEL_ENUMS: AlarmLevelEnum = {
  LEVEL0: {
    value: 'LEVEL0',
    get label() {
      return $t('thingModel.event.typeInfo');
    },
    get text() {
      return $t('thingModel.event.typeInfo');
    },
    color: 'green',
  },
  LEVEL1: {
    value: 'LEVEL1',
    get label() {
      return $t('thingModel.event.typeWarn');
    },
    get text() {
      return $t('thingModel.event.typeWarn');
    },
    color: 'orange',
  },
  LEVEL2: {
    value: 'LEVEL2',
    get label() {
      return $t('thingModel.event.typeError');
    },
    get text() {
      return $t('thingModel.event.typeError');
    },
    color: 'red',
  },
  LEVEL3: {
    value: 'LEVEL3',
    get label() {
      return $t('thingModel.event.level3');
    },
    get text() {
      return $t('thingModel.event.level3');
    },
    color: 'blue',
  },
  LEVEL4: {
    value: 'LEVEL4',
    get label() {
      return $t('thingModel.event.level4');
    },
    get text() {
      return $t('thingModel.event.level4');
    },
    color: 'purple',
  },
  LEVEL5: {
    value: 'LEVEL5',
    get label() {
      return $t('thingModel.event.level5');
    },
    get text() {
      return $t('thingModel.event.level5');
    },
    color: 'cyan',
  },
  LEVEL6: {
    value: 'LEVEL6',
    get label() {
      return $t('thingModel.event.level6');
    },
    get text() {
      return $t('thingModel.event.level6');
    },
    color: 'magenta',
  },
  LEVEL7: {
    value: 'LEVEL7',
    get label() {
      return $t('thingModel.event.level7');
    },
    get text() {
      return $t('thingModel.event.level7');
    },
    color: 'volcano',
  },
};

export const ALARM_LEVELS: EnumDict<AlarmLevel>[] =
  Object.values(ALARM_LEVEL_ENUMS);
