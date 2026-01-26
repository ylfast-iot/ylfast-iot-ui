import type { DataType } from '#/types/data-type';
import type { EnumDict } from '#/types/global';

import { $t } from '@vben/locales';

type DataTypeEnum = {
  [key in DataType]: EnumDict<DataType>;
};

export const DATA_TYPE_ENUM: DataTypeEnum = {
  BYTE: {
    value: 'BYTE',
    get label() {
      return $t('dataType.types.BYTE');
    },
    get text() {
      return $t('dataType.types.BYTE');
    },
  },
  STRING: {
    value: 'STRING',
    get label() {
      return $t('dataType.types.STRING');
    },
    get text() {
      return $t('dataType.types.STRING');
    },
  },
  PASSWORD: {
    value: 'PASSWORD',
    get label() {
      return $t('dataType.types.PASSWORD');
    },
    get text() {
      return $t('dataType.types.PASSWORD');
    },
  },
  INTEGER: {
    value: 'INTEGER',
    get label() {
      return $t('dataType.types.INTEGER');
    },
    get text() {
      return $t('dataType.types.INTEGER');
    },
  },
  LONG: {
    value: 'LONG',
    get label() {
      return $t('dataType.types.LONG');
    },
    get text() {
      return $t('dataType.types.LONG');
    },
  },
  SHORT: {
    value: 'SHORT',
    get label() {
      return $t('dataType.types.SHORT');
    },
    get text() {
      return $t('dataType.types.SHORT');
    },
  },
  DOUBLE: {
    value: 'DOUBLE',
    get label() {
      return $t('dataType.types.DOUBLE');
    },
    get text() {
      return $t('dataType.types.DOUBLE');
    },
  },
  FLOAT: {
    value: 'FLOAT',
    get label() {
      return $t('dataType.types.FLOAT');
    },
    get text() {
      return $t('dataType.types.FLOAT');
    },
  },
  BOOLEAN: {
    value: 'BOOLEAN',
    get label() {
      return $t('dataType.types.BOOLEAN');
    },
    get text() {
      return $t('dataType.types.BOOLEAN');
    },
  },
  DATE: {
    value: 'DATE',
    get label() {
      return $t('dataType.types.DATE');
    },
    get text() {
      return $t('dataType.types.DATE');
    },
  },
  ENUM: {
    value: 'ENUM',
    get label() {
      return $t('dataType.types.ENUM');
    },
    get text() {
      return $t('dataType.types.ENUM');
    },
  },
  OBJECT: {
    value: 'OBJECT',
    get label() {
      return $t('dataType.types.OBJECT');
    },
    get text() {
      return $t('dataType.types.OBJECT');
    },
  },
  ARRAY: {
    value: 'ARRAY',
    get label() {
      return $t('dataType.types.ARRAY');
    },
    get text() {
      return $t('dataType.types.ARRAY');
    },
  },
  GEO: {
    value: 'GEO',
    get label() {
      return $t('dataType.types.GEO');
    },
    get text() {
      return $t('dataType.types.GEO');
    },
  },
  FILE: {
    value: 'FILE',
    get label() {
      return $t('dataType.types.FILE');
    },
    get text() {
      return $t('dataType.types.FILE');
    },
  },
};

export const DATA_TYPE_OPTIONS = Object.values(DATA_TYPE_ENUM);
