import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { $t } from '@vben/locales';

export const getSearchFormSchemas = (): YlDcFormSchema[] => {
  return [
    {
      field: 'name',
      label: $t('notify.template.fields.name'),
      component: 'Input',
      termTypes: ['like'],
    },
    {
      field: 'type',
      label: $t('notify.template.fields.type'),
      component: 'Select',
      termTypes: ['eq'],
    },
    {
      field: 'provider',
      label: $t('notify.template.fields.provider'),
      component: 'Select',
      termTypes: ['eq'],
    },
  ];
};

export const getColumns = () => {
  return [
    {
      field: 'name',
      title: $t('notify.template.fields.name'),
      minWidth: 150,
    },
    {
      field: 'type',
      title: $t('notify.template.fields.type'),
      width: 120,
    },
    {
      field: 'provider',
      title: $t('notify.template.fields.provider'),
      width: 150,
    },
    {
      field: 'description',
      title: $t('notify.template.fields.description'),
      minWidth: 200,
    },
    {
      field: 'id',
      title: $t('common.action.label'),
      width: 120,
      fixed: 'right' as any,
      slots: { default: 'action' },
    },
  ];
};
