import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { $t } from '@vben/locales';

import { getAllProductTypeTree } from '#/api/iot/device/product-type';

export const getColumns = (): VxeGridProps['columns'] => [
  {
    field: 'name',
    title: $t('device.productType.name'), // 名称
    treeNode: true,
    minWidth: 200,
  },
  {
    field: 'key',
    title: $t('device.productType.key'), // 标识
    minWidth: 150,
  },
  {
    field: 'sortIndex',
    title: $t('common.sort'), // 排序
    width: 100,
  },
  {
    field: 'description',
    title: $t('common.description'), // 描述
    minWidth: 200,
  },
  {
    field: 'action',
    title: $t('common.action.label'), // 操作
    fixed: 'right',
    width: 180,
    slots: { default: 'action' },
  },
];

export const getSearchFormSchemas = (): YlDcFormSchema[] => [
  {
    field: 'name',
    label: $t('device.productType.name'),
    component: 'Input',
    termTypes: ['like', 'eq', 'nlike'],
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
  },
  {
    field: 'key',
    label: $t('device.productType.key'),
    component: 'Input',
    termTypes: ['like', 'eq', 'nlike'],
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
  },
];

export const getModalFormSchemas = (): VbenFormSchema[] => [
  {
    fieldName: 'id',
    component: 'Input',
    dependencies: {
      show: false,
      triggerFields: ['id'],
    },
  },
  {
    fieldName: 'parentId',
    label: $t('common.parent'), // 上级
    component: 'ApiTreeSelect',
    componentProps: {
      api: getAllProductTypeTree.bind(null, {
        paging: false,
        excludes: ['key'],
      }),
      labelField: 'name',
      valueField: 'id',
      childrenField: 'children',
      placeholder: $t('common.placeholder.select'),
    },
  },
  {
    fieldName: 'name',
    label: $t('device.productType.name'),
    component: 'Input',
    rules: 'required',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
  },
  {
    fieldName: 'key',
    label: $t('device.productType.key'),
    component: 'Input',
    rules: 'required',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
  },
  {
    fieldName: 'sortIndex',
    label: $t('common.sort'),
    component: 'InputNumber',
    defaultValue: 0,
    componentProps: {
      min: 0,
    },
  },
  {
    fieldName: 'description',
    label: $t('common.description'),
    component: 'Textarea',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
      rows: 4,
    },
  },
];
