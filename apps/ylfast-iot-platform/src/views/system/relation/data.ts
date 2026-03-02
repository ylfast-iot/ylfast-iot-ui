import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { $t } from '@vben/locales';

import { getRelationTypes } from '#/api/system/relation';

export const columns: VxeGridProps['columns'] = [
  {
    field: 'name',
    title: $t('relation.name'),
    width: 150,
  },
  {
    field: 'reverseName',
    title: $t('relation.reverseName'),
    width: 150,
  },
  {
    field: 'objectTypeName',
    title: $t('relation.objectTypeName'),
    width: 150,
  },
  {
    field: 'relation',
    title: $t('relation.relation'),
    width: 150,
  },
  {
    field: 'targetTypeName',
    title: $t('relation.targetTypeName'),
    width: 150,
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
    width: 150,
    slots: { default: 'action' },
  },
];

export const searchFormSchemas: YlDcFormSchema[] = [
  {
    component: 'ApiSelect',
    field: 'objectType',
    label: $t('relation.objectType'),
    componentProps: {
      api: getRelationTypes,
      labelField: 'name',
      valueField: 'id',
      showSearch: true,
    },
    termTypes: ['eq'],
  },
  {
    component: 'Input',
    field: 'name',
    label: $t('relation.name'),
    termTypes: ['like', 'nlike', 'eq'],
  },
  {
    component: 'Input',
    field: 'relation',
    label: $t('relation.relation'),
    termTypes: ['like', 'eq'],
  },
  {
    component: 'ApiSelect',
    field: 'targetType',
    label: $t('relation.targetType'),
    componentProps: {
      api: getRelationTypes,
      labelField: 'name',
      valueField: 'id',
      showSearch: true,
    },
    termTypes: ['eq'],
  },
];

export const modalFormSchemas: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'relation',
    label: $t('relation.relation'),
    componentProps: {
      placeholder: '请输入标识',
    },
    rules: 'required',
    formItemClass: 'col-span-2',
  },
  {
    component: 'ApiSelect',
    fieldName: 'objectType',
    label: '关联方',
    defaultValue: undefined,
    componentProps: {
      api: getRelationTypes,
      labelField: 'name',
      valueField: 'id',
      showSearch: true,
      placeholder: '请选择关联方',
    },
    rules: 'required',
  },
  {
    component: 'ApiSelect',
    fieldName: 'targetType',
    defaultValue: undefined,
    label: '被关联方',
    componentProps: {
      api: getRelationTypes,
      labelField: 'name',
      valueField: 'id',
      showSearch: true,
      placeholder: '请选择被关联方',
    },
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: '正向关系名称',
    componentProps: {
      placeholder: '请输入名称',
    },
    help: '正向关系示例：用户张三是001号视频设备的管理员',
    rules: 'required',
    formItemClass: 'col-span-2',
  },
  {
    component: 'Input',
    fieldName: 'reverseName',
    label: '反向关系名称',
    componentProps: {
      placeholder: '请输入名称',
    },
    help: '反向关系示例：001号视频设备是用户张三的管辖设备',
    formItemClass: 'col-span-2',
    rules: 'required',
  },
  {
    component: 'Textarea',
    fieldName: 'description',
    label: $t('common.description'),
    componentProps: {
      placeholder: '请输入说明',
      showCount: true,
      maxlength: 200,
      autoSize: { minRows: 4 },
    },
    formItemClass: 'col-span-2',
  },
];
