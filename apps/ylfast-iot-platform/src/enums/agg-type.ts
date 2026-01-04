import type { EnumDict } from '#/types/global';

export type AggType =
  | 'AVG'
  | 'COUNT'
  | 'DISTINCT_COUNT'
  | 'FIRST'
  | 'MAX'
  | 'MIN'
  | 'NONE'
  | 'SUM'
  | 'TOP';

export type AggTypeOption = { [key in AggType]: EnumDict<AggType> };

export const AGG_TYPE_ENUM: AggTypeOption = {
  MIN: {
    value: 'MIN',
    label: '最小值',
    text: '最小值',
  },
  MAX: {
    value: 'MAX',
    label: '最大值',
    text: '最大值',
  },
  AVG: {
    value: 'AVG',
    label: '平均值',
    text: '平均值',
  },
  SUM: {
    value: 'SUM',
    label: '求和',
    text: '求和',
  },
  COUNT: {
    value: 'COUNT',
    label: '计数',
    text: '计数',
  },
  FIRST: {
    value: 'FIRST',
    label: '第一个',
    text: '第一个',
  },
  TOP: {
    value: 'TOP',
    label: '取值',
    text: '取值',
  },
  DISTINCT_COUNT: {
    value: 'DISTINCT_COUNT',
    label: '去重计数',
    text: '去重计数',
  },
  NONE: {
    value: 'NONE',
    label: '无',
    text: '无',
  },
};
