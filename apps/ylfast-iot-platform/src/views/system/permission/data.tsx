import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { markRaw } from 'vue';

import { z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import ActionListInput from './components/ActionListInput.vue';

export const searchFormSchemas: YlDcFormSchema[] = [
  {
    component: 'Input',
    field: 'id',
    label: $t('permission.field.id'),
    termTypes: ['like', 'nlike', 'eq'],
  },
  {
    component: 'Input',
    field: 'name',
    label: $t('permission.field.name'),
    termTypes: ['like', 'nlike', 'eq'],
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: $t('permission.action.enable'), value: 1 },
        { label: $t('permission.action.disable'), value: 0 },
      ],
    },
    field: 'status',
    label: $t('permission.field.status'),
    termTypes: ['eq', 'not'],
  },
];

export const columns: VxeGridProps['columns'] = [
  { field: 'id', minWidth: 120, title: $t('permission.field.id') },
  { field: 'name', minWidth: 120, title: $t('permission.field.name') },
  {
    field: 'describe',
    minWidth: 150,
    title: $t('permission.field.describe'),
    cellRender: {
      name: 'CustomRender',
      props: {
        renderComponent(params: any) {
          return <div>{params.row.describe || '--'}</div>;
        },
      },
    },
  },
  {
    field: 'status',
    minWidth: 100,
    slots: { default: 'status' },
    title: $t('permission.field.status'),
  },
  {
    field: 'action',
    fixed: 'right',
    minWidth: 160,
    slots: { default: 'action' },
    title: $t('common.action.label'),
  },
];

export const modalFormSchemas: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'id',
    label: $t('permission.field.id'),
    help: $t('permission.text.idHelp'),
    componentProps: {
      placeholder: $t('permission.placeholder.id'),
    },
    rules: z.string().min(1, $t('permission.placeholder.id')),
    // 只有新增时可编辑ID
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: $t('permission.field.name'),
    componentProps: {
      placeholder: $t('permission.placeholder.name'),
    },
    rules: z.string().min(1, $t('permission.placeholder.name')),
  },
  {
    component: markRaw(ActionListInput),
    fieldName: 'actions',
    label: '',
    componentProps: {
      height: '360px',
    },
    formItemClass: 'col-span-full',
    modelPropName: 'value',
    defaultValue: [],
  },
];
