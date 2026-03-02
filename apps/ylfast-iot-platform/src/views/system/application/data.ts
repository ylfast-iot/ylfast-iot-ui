import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { $t } from '@vben/locales';

import { getProviderConfig } from '#/enums/application';

export const searchFormSchemas: YlDcFormSchema[] = [
  {
    component: 'Input',
    field: 'name',
    label: $t('application.name', '应用名称'),
    termTypes: ['like', 'eq'],
  },
  {
    component: 'Select',
    field: 'state',
    label: $t('application.state', '状态'),
    componentProps: {
      options: [
        { label: $t('common.enable', '启用'), value: 'enabled' },
        { label: $t('common.disable', '禁用'), value: 'disabled' },
      ],
    },
    termTypes: ['eq'],
  },
];

export const columns: VxeGridProps['columns'] = [
  {
    title: $t('application.name', '应用名称'),
    field: 'name',
    minWidth: 150,
  },
  {
    title: $t('application.provider', '应用类型/提供商'),
    field: 'provider',
    minWidth: 150,
    formatter: ({ cellValue }: { cellValue: string }) => {
      const config = getProviderConfig(cellValue);
      return config ? config.label : cellValue;
    },
  },
  {
    title: $t('application.code', '应用编码'),
    field: 'code',
    minWidth: 120,
  },
  {
    title: $t('application.state', '状态'),
    field: 'state',
    minWidth: 100,
    slots: { default: 'state' },
  },
  {
    title: $t('application.connectState', '连接状态'),
    field: 'connectState',
    minWidth: 100,
    slots: { default: 'connectState' },
  },
  {
    title: $t('common.action.action', '操作'),
    field: 'action',
    fixed: 'right',
    width: 200,
    slots: { default: 'action' },
  },
];
