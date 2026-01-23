import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { $t } from '@vben/locales';

import { getPluginTypes } from '#/api/iot/plugin';

/**
 * 获取插件类型选项
 */
export const fetchPluginTypeOptions = () =>
  getPluginTypes().then((res) =>
    res.map((item) => ({
      label: item.name || item.text,
      value: item.id || item.value,
    })),
  );

export const getColumns = (): VxeGridProps['columns'] => [
  {
    field: 'id',
    title: $t('plugin.id'),
    minWidth: 150,
  },
  {
    field: 'name',
    title: $t('plugin.name'),
    minWidth: 150,
  },
  {
    field: 'type',
    title: $t('plugin.type'),
    width: 140,
    slots: { default: 'type' },
  },
  {
    field: 'version',
    title: $t('plugin.version'),
    width: 100,
  },
  {
    field: 'provider',
    title: $t('plugin.provider'),
    width: 100,
  },
  {
    field: 'createTime',
    title: $t('common.createTime'),
    minWidth: 160,
    formatter: 'formatDateTime',
  },
  {
    field: 'description',
    title: $t('common.description'),
    minWidth: 200,
  },
  {
    field: 'action',
    title: $t('common.action.label'),
    fixed: 'right',
    width: 120,
    slots: { default: 'action' },
  },
];

export const getSearchFormSchemas = (): YlDcFormSchema[] => [
  {
    field: 'name',
    label: $t('plugin.name'),
    component: 'Input',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
  },
  {
    field: 'type',
    label: $t('plugin.type'),
    component: 'ApiSelect',
    componentProps: {
      api: fetchPluginTypeOptions,
      placeholder: $t('common.placeholder.select'),
    },
  },
];
