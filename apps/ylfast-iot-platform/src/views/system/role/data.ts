import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { queryRoleGroupNoPaging } from '#/api/system/role-group';
import { listToTree } from '#/utils/tree';

export const columns: VxeGridProps['columns'] = [
  {
    field: 'id',
    title: 'ID',
    width: 200,
  },
  {
    field: 'name',
    title: $t('common.name'),
    width: 150,
  },
  {
    field: 'state',
    title: $t('common.status'),
    slots: { default: 'state' },
    width: 100,
  },
  {
    field: 'description',
    title: $t('common.description'),
    showOverflow: true,
    formatter: ({ cellValue }) => cellValue || '--',
  },
  {
    field: 'createTime',
    title: $t('common.createTime'),
    formatter: 'formatDateTime',
    width: 160,
  },
  {
    field: 'action',
    title: $t('common.action.label'),
    fixed: 'right',
    width: 250,
    slots: { default: 'action' },
  },
];

export const searchFormSchemas: YlDcFormSchema[] = [
  {
    component: 'Input',
    field: 'name',
    label: $t('common.name'),
    termTypes: ['like', 'nlike', 'eq'],
  },
  {
    component: 'Select',
    field: 'state',
    label: $t('common.status'),
    componentProps: {
      options: [
        { label: $t('common.enable'), value: 'enabled' },
        { label: $t('common.disable'), value: 'disabled' },
      ],
    },
    termTypes: ['eq', 'not'],
  },
];

export const modalFormSchemas: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'id',
    label: 'ID',
    componentProps: {
      disabled: true,
      placeholder: $t('common.autoGenerate'),
    },
    dependencies: {
      show: (values) => !!values.id,
      triggerFields: ['id'],
    },
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: $t('common.name'),
    rules: z.string().min(1),
  },
  {
    component: 'ApiTreeSelect',
    fieldName: 'groupId',
    label: $t('role.group.title'),
    componentProps: {
      api: async () => {
        const data = await queryRoleGroupNoPaging({
          paging: false,
          sorts: [{ name: 'sortIndex', order: 'asc' }],
        });
        return listToTree(data, { id: 'id', pid: 'parentId' });
      },
      labelField: 'name',
      valueField: 'id',
      childrenField: 'children',
      placeholder: $t('common.select'),
    },
    rules: z.string().min(1),
  },
  {
    component: 'RadioGroup',
    fieldName: 'state',
    label: $t('common.status'),
    defaultValue: 'enabled',
    componentProps: {
      options: [
        { label: $t('common.enable'), value: 'enabled' },
        { label: $t('common.disable'), value: 'disabled' },
      ],
    },
    rules: z.string().min(1),
  },
  {
    component: 'Textarea',
    fieldName: 'description',
    label: $t('common.description'),
  },
];

export const groupFormSchemas: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'id',
    label: 'ID',
    componentProps: {
      disabled: true,
      placeholder: $t('common.autoGenerate'),
    },
    dependencies: {
      show: (values) => !!values.id,
      triggerFields: ['id'],
    },
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: $t('common.name'),
    rules: z.string().min(1),
  },
  {
    component: 'InputNumber',
    fieldName: 'sortIndex',
    label: $t('common.sort'),
    defaultValue: 0,
  },
  {
    component: 'Textarea',
    fieldName: 'description',
    label: $t('common.description'),
  },
];

// Permission configuration schemas
export const permissionColumns: VxeGridProps['columns'] = [
  {
    field: 'name',
    title: $t('role.permission.menu'),
    treeNode: true,
    slots: { default: 'name' },
    align: 'left',
    width: 300,
  },
  {
    field: 'actions',
    title: $t('role.permission.operation'),
    align: 'left',
    slots: { default: 'actions' },
  },
];
