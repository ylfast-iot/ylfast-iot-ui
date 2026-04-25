import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { $t } from '@vben/locales';

import {
  getAlarmConfigTargetTypeSupports,
  getDefaultAlarmLevel,
} from '#/api/iot';

export interface AlarmTargetTypeCardOption {
  /** 卡片描述文案 */
  description?: string;
  /** 卡片颜色主题 */
  color: string;
  /** 卡片图标 */
  icon: string;
  /** 卡片标题 */
  label: string;
  /** 目标类型值 */
  value: string;
}

export interface AlarmLevelOption {
  /** 级别标签 */
  label: string;
  /** 级别值 */
  value: number;
}

export interface AlarmTargetTypeSelectOption {
  /** 选项标签 */
  label: string;
  /** 选项值 */
  value: string;
}

export interface AlarmLevelCardOption extends AlarmLevelOption {
  /** 卡片颜色主题 */
  color: string;
  /** 卡片图标 */
  icon: string;
}

export interface AlarmOptionMapOf<
  T extends AlarmLevelOption | AlarmTargetTypeCardOption,
> {
  /** 值到标签的映射 */
  labelMap: Map<number | string, string>;
  /** 选项列表 */
  options: T[];
}

interface AlarmConfigStateOption {
  /** 标签颜色 */
  color: string;
  /** 标签文案 */
  label: string;
  /** 状态值 */
  value: 'disabled' | 'enabled';
}

const targetTypeColors = [
  'blue',
  'orange',
  'cyan',
  'green',
  'purple',
  'red',
] as const;

const alarmStateOptions: AlarmConfigStateOption[] = [
  {
    color: 'success',
    label: $t('common.enable'),
    value: 'enabled',
  },
  {
    color: 'error',
    label: $t('common.disable'),
    value: 'disabled',
  },
];

const alarmLevelCardStyles = [
  { color: 'red', icon: 'lucide:siren' },
  { color: 'orange', icon: 'lucide:shield-alert' },
  { color: 'cyan', icon: 'lucide:triangle-alert' },
  { color: 'blue', icon: 'lucide:shield' },
  { color: 'purple', icon: 'lucide:bell-ring' },
] as const;

/**
 * 推断告警目标类型展示图标。
 */
function resolveTargetTypeIcon(id: string) {
  const lowerId = id.toLowerCase();

  if (lowerId.includes('product')) {
    return 'lucide:package';
  }
  if (lowerId.includes('device')) {
    return 'lucide:cpu';
  }
  if (lowerId.includes('gateway')) {
    return 'lucide:router';
  }
  if (lowerId.includes('user')) {
    return 'lucide:user-round';
  }
  if (lowerId.includes('organization') || lowerId.includes('org')) {
    return 'lucide:building-2';
  }
  if (lowerId.includes('scene')) {
    return 'lucide:workflow';
  }
  return 'lucide:box';
}

/**
 * 获取告警配置状态下拉选项。
 */
export const getAlarmConfigStateOptions = () =>
  alarmStateOptions.map((item) => ({
    label: item.label,
    value: item.value,
  }));

/**
 * 获取告警配置状态标签选项。
 */
export const getAlarmConfigStateTagOptions = () => alarmStateOptions;

/**
 * 获取告警目标类型卡片选项。
 */
export const fetchAlarmTargetTypeCardOptions = async (): Promise<
  AlarmTargetTypeCardOption[]
> => {
  const supports = await getAlarmConfigTargetTypeSupports();

  return supports.map(
    (item, index): AlarmTargetTypeCardOption => ({
      color: targetTypeColors[index % targetTypeColors.length] || 'blue',
      description:
        item.supportTriggers && item.supportTriggers.length > 0
          ? `${$t('alarm.config.detail.targetTypeSupportPrefix')}${item.supportTriggers.join(' / ')}`
          : undefined,
      icon: resolveTargetTypeIcon(item.id),
      label: item.name,
      value: item.id,
    }),
  );
};

/**
 * 获取告警目标类型映射。
 */
export const fetchAlarmTargetTypeMap = async (): Promise<
  AlarmOptionMapOf<AlarmTargetTypeCardOption>
> => {
  const options = await fetchAlarmTargetTypeCardOptions();
  const labelMap = new Map(options.map((item) => [item.value, item.label]));

  return {
    labelMap,
    options,
  };
};

/**
 * 获取告警目标类型下拉选项。
 */
export const fetchAlarmTargetTypeSelectOptions = async (): Promise<
  AlarmTargetTypeSelectOption[]
> => {
  const options = await fetchAlarmTargetTypeCardOptions();

  return options.map((item) => ({
    label: item.label,
    value: item.value,
  }));
};

/**
 * 获取告警级别下拉选项。
 */
export const fetchAlarmLevelOptions = async (): Promise<AlarmLevelOption[]> => {
  const defaultLevel = await getDefaultAlarmLevel();

  return (defaultLevel.levels || []).map((item) => ({
    label: item.title,
    value: item.level,
  }));
};

/**
 * 获取告警级别卡片选项。
 */
export const fetchAlarmLevelCardOptions = async (): Promise<
  AlarmLevelCardOption[]
> => {
  const options = await fetchAlarmLevelOptions();

  return options.map((item, index) => ({
    ...item,
    color:
      alarmLevelCardStyles[index % alarmLevelCardStyles.length]?.color ||
      'blue',
    icon:
      alarmLevelCardStyles[index % alarmLevelCardStyles.length]?.icon ||
      'lucide:shield',
  }));
};

/**
 * 获取告警级别映射。
 */
export const fetchAlarmLevelMap = async (): Promise<
  AlarmOptionMapOf<AlarmLevelOption>
> => {
  const options = await fetchAlarmLevelOptions();
  const labelMap = new Map(options.map((item) => [item.value, item.label]));

  return {
    labelMap,
    options,
  };
};

/**
 * 获取列表列定义。
 */
export const getColumns = (): VxeGridProps['columns'] => [
  {
    field: 'name',
    minWidth: 180,
    title: $t('alarm.config.fields.name'),
  },
  {
    field: 'targetType',
    minWidth: 160,
    slots: { default: 'targetType' },
    title: $t('alarm.config.fields.targetType'),
  },
  {
    field: 'level',
    minWidth: 140,
    slots: { default: 'level' },
    title: $t('alarm.config.fields.level'),
  },
  {
    field: 'state',
    minWidth: 120,
    slots: { default: 'state' },
    title: $t('common.status'),
  },
  {
    field: 'createTime',
    formatter: 'formatDateTime',
    minWidth: 180,
    title: $t('common.createTime'),
  },
  {
    field: 'action',
    align: 'center',
    fixed: 'right',
    minWidth: 220,
    slots: { default: 'action' },
    title: $t('common.action.label'),
  },
];

/**
 * 获取搜索表单配置。
 */
export const getSearchFormSchemas = (): YlDcFormSchema[] => [
  {
    component: 'Input',
    field: 'name',
    label: $t('alarm.config.fields.name'),
    termTypes: ['like', 'eq'],
  },
  {
    component: 'ApiSelect',
    componentProps: {
      api: fetchAlarmTargetTypeCardOptions,
      placeholder: $t('common.placeholder.select'),
    },
    field: 'targetType',
    label: $t('alarm.config.fields.targetType'),
    termTypes: ['eq'],
  },
  {
    component: 'Select',
    componentProps: {
      options: getAlarmConfigStateOptions(),
      placeholder: $t('common.placeholder.select'),
    },
    field: 'state',
    label: $t('common.status'),
    termTypes: ['eq'],
  },
];
