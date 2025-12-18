import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';
import type {YlDcFormSchema} from "#/components/yl-dc-form";

export const dictionaryModalSchemas: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'id',
    label: $t('common.id'),
    rules: 'required',
    help: $t('dictionary.idHelp'),
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: $t('common.name'),
    rules: 'required',
  },
  {
    component: 'RadioGroup',
    fieldName: 'status',
    label: $t('common.status'),
    defaultValue: 1,
    componentProps: {
      options: [
        { label: $t('common.enable'), value: 1 },
        { label: $t('common.disable'), value: 0 },
      ],
    },
    rules: 'required',
  },
  {
    component: 'Textarea',
    fieldName: 'describe',
    label: $t('common.description'),
  },
];

export const dictionaryItemModalSchemas: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: $t('common.name'),
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'value',
    label: $t('dictionary.value'),
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'text',
    label: $t('dictionary.text'),
    rules: 'required',
  },
  {
    component: 'RadioGroup',
    fieldName: 'status',
    label: $t('common.status'),
    defaultValue: 1,
    componentProps: {
      options: [
        { label: $t('common.enable'), value: 1 },
        { label: $t('common.disable'), value: 0 },
      ],
    },
    rules: 'required',
  },
  {
    component: 'InputNumber',
    fieldName: 'ordinal',
    label: $t('common.sort'),
    defaultValue: 0,
  },
  {
    component: 'Textarea',
    fieldName: 'describe',
    label: $t('common.description'),
  },
];

export const dictionaryItemColumns: VxeGridProps['columns'] = [
  {
    field: 'name',
    title: $t('common.name'),
    minWidth: 150,
  },
  {
    field: 'value',
    title: $t('dictionary.value'),
    minWidth: 150,
  },
  {
    field: 'text',
    title: $t('dictionary.text'),
    minWidth: 150,
  },
  {
    field: 'status',
    title: $t('common.status'),
    slots: { default: 'status' },
    width: 100,
  },
  {
    field: 'action',
    title: $t('common.action.label'),
    slots: { default: 'action' },
    fixed: 'right',
    width: 200,
  },
];

export const searchFormSchemas: YlDcFormSchema[] = [
  {
    component: 'Input',
    field: 'name',
    label: $t('common.name'),
    componentProps: {
      allowClear: true,
    },
  },
  {
    component: 'Input',
    field: 'value',
    label: $t('dictionary.value'),
    componentProps: {
      allowClear: true,
    },
  },
  {
    component: 'Input',
    field: 'searchCode',
    label: $t('common.searchCode', '搜索码'),
    componentProps: {
      allowClear: true,
    },
  },
  {
    component: 'Input',
    field: 'text',
    label: $t('dictionary.text'),
    componentProps: {
      allowClear: true,
    },
  },
  {
    component: 'Select',
    field: 'status',
    label: $t('common.status'),
    componentProps: {
      allowClear: true,
      options: [
        { label: $t('common.enable'), value: 1 },
        { label: $t('common.disable'), value: 0 },
      ],
    },
  },
];
