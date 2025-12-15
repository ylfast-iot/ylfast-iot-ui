import type { DataType } from '#/types/data-type';
import type { EnumDict } from '#/types/global';

import { $t } from '@vben/locales';

export const DATA_TYPES: EnumDict<DataType>[] = [
  {
    value: 'STRING',
    get label() {
      return $t('dataType.types.STRING');
    },
    get text() {
      return $t('dataType.types.STRING');
    },
  },
  {
    value: 'PASSWORD',
    get label() {
      return $t('dataType.types.PASSWORD');
    },
    get text() {
      return $t('dataType.types.PASSWORD');
    },
  },
  {
    value: 'INTEGER',
    get label() {
      return $t('dataType.types.INTEGER');
    },
    get text() {
      return $t('dataType.types.INTEGER');
    },
  },
  {
    value: 'LONG',
    get label() {
      return $t('dataType.types.LONG');
    },
    get text() {
      return $t('dataType.types.LONG');
    },
  },
  {
    value: 'SHORT',
    get label() {
      return $t('dataType.types.SHORT');
    },
    get text() {
      return $t('dataType.types.SHORT');
    },
  },
  {
    value: 'DOUBLE',
    get label() {
      return $t('dataType.types.DOUBLE');
    },
    get text() {
      return $t('dataType.types.DOUBLE');
    },
  },
  {
    value: 'FLOAT',
    get label() {
      return $t('dataType.types.FLOAT');
    },
    get text() {
      return $t('dataType.types.FLOAT');
    },
  },
  {
    value: 'BOOLEAN',
    get label() {
      return $t('dataType.types.BOOLEAN');
    },
    get text() {
      return $t('dataType.types.BOOLEAN');
    },
  },
  {
    value: 'DATE',
    get label() {
      return $t('dataType.types.DATE');
    },
    get text() {
      return $t('dataType.types.DATE');
    },
  },
  {
    value: 'ENUM',
    get label() {
      return $t('dataType.types.ENUM');
    },
    get text() {
      return $t('dataType.types.ENUM');
    },
  },
  {
    value: 'OBJECT',
    get label() {
      return $t('dataType.types.OBJECT');
    },
    get text() {
      return $t('dataType.types.OBJECT');
    },
  },
  {
    value: 'ARRAY',
    get label() {
      return $t('dataType.types.ARRAY');
    },
    get text() {
      return $t('dataType.types.ARRAY');
    },
  },
  {
    value: 'GEO',
    get label() {
      return $t('dataType.types.GEO');
    },
    get text() {
      return $t('dataType.types.GEO');
    },
  },
  {
    value: 'FILE',
    get label() {
      return $t('dataType.types.FILE');
    },
    get text() {
      return $t('dataType.types.FILE');
    },
  },
];

export const DATA_TYPE_OPTIONS = DATA_TYPES;
