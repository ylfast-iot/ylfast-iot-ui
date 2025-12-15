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

export const ALARM_LEVELS: EnumDict<AlarmLevel>[] = [
  {
    value: 'LEVEL0',
    get label() {
      return $t('thingModel.event.typeInfo');
    },
    get text() {
      return $t('thingModel.event.typeInfo');
    },
    color: 'green',
  },
  {
    value: 'LEVEL1',
    get label() {
      return $t('thingModel.event.typeWarn');
    },
    get text() {
      return $t('thingModel.event.typeWarn');
    },
    color: 'orange',
  },
  {
    value: 'LEVEL2',
    get label() {
      return $t('thingModel.event.typeError');
    },
    get text() {
      return $t('thingModel.event.typeError');
    },
    color: 'red',
  },
  {
    value: 'LEVEL3',
    get label() {
      return $t('thingModel.event.level3');
    },
    get text() {
      return $t('thingModel.event.level3');
    },
    color: 'blue',
  },
  {
    value: 'LEVEL4',
    get label() {
      return $t('thingModel.event.level4');
    },
    get text() {
      return $t('thingModel.event.level4');
    },
    color: 'purple',
  },
  {
    value: 'LEVEL5',
    get label() {
      return $t('thingModel.event.level5');
    },
    get text() {
      return $t('thingModel.event.level5');
    },
    color: 'cyan',
  },
  {
    value: 'LEVEL6',
    get label() {
      return $t('thingModel.event.level6');
    },
    get text() {
      return $t('thingModel.event.level6');
    },
    color: 'magenta',
  },
  {
    value: 'LEVEL7',
    get label() {
      return $t('thingModel.event.level7');
    },
    get text() {
      return $t('thingModel.event.level7');
    },
    color: 'volcano',
  },
];
