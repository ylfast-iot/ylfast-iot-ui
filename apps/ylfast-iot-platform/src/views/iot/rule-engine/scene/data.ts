import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { $t } from '@vben/locales';

export const getColumns = (): VxeGridProps['columns'] => [
  {
    field: 'name',
    title: $t('scene.name', '场景名称'),
    minWidth: 150,
  },
  {
    field: 'triggerType',
    title: $t('scene.triggerType', '触发方式'),
    width: 120,
    slots: { default: 'triggerType' },
  },
  {
    field: 'state',
    title: $t('scene.state', '状态'),
    width: 100,
    slots: { default: 'state' },
  },
  {
    field: 'description',
    title: $t('scene.description', '说明'),
    minWidth: 200,
  },
  {
    field: 'createTime',
    title: $t('common.createTime'),
    width: 180,
    formatter: 'formatDateTime',
  },
  {
    field: 'action',
    title: $t('common.action.action'),
    width: 180,
    fixed: 'right',
    slots: { default: 'action' },
  },
];

export const getSearchFormSchemas = (): YlDcFormSchema[] => [
  {
    field: 'name',
    label: $t('scene.name', '场景名称'),
    component: 'Input',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
  },
];

export const getTriggerTypeName = (type?: string) => {
  if (!type) return '-';
  const map: Record<string, string> = {
    timer: $t('scene.trigger.timer', '定时触发'),
    manual: $t('scene.trigger.manual', '手动触发'),
    device: $t('scene.trigger.device', '设备触发'),
  };
  return map[type] || type;
};
