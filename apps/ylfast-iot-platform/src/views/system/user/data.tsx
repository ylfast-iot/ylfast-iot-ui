import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { z } from '@vben/common-ui';

import { UserEntityType } from '#/adapter/hsweb/user';

export const searchFormSchemas: YlDcFormSchema[] = [
  {
    component: 'Input',
    field: 'name',
    label: '姓名',
    termTypes: ['like', 'nlike', 'eq'],
  },
  {
    component: 'Input',
    field: 'username',
    label: '用户名',
    termTypes: ['like', 'nlike', 'eq'],
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 },
      ],
    },
    field: 'status',
    label: '状态',
    termTypes: ['eq', 'not'],
  },
];

export const columns: VxeGridProps['columns'] = [
  { field: 'name', minWidth: 120, title: '姓名' },
  {
    field: 'username',
    minWidth: 120,
    title: '用户名',
    cellRender: {
      name: 'CellTag',
    },
  },
  {
    field: 'typeId',
    minWidth: 100,
    title: '用户类型',
    cellRender: {
      name: 'CellTag',
      options: UserEntityType.values().map((item) => {
        return {
          label: item.text,
          value: item.value,
          color: item.color,
        };
      }),
    },
  },
  {
    field: 'status',
    minWidth: 100,
    slots: { default: 'status' },
    title: '状态',
  },
  {
    field: 'telephone',
    minWidth: 120,
    title: '手机号',
    cellRender: {
      name: 'CustomRender',
      props: {
        renderComponent(params: any) {
          return <div>{params.row.telephone || '--'}</div>;
        },
      },
    },
  },
  {
    field: 'email',
    minWidth: 120,
    title: '邮箱',
    cellRender: {
      name: 'CustomRender',
      props: {
        renderComponent(params: any) {
          return <div>{params.row.email || '--'}</div>;
        },
      },
    },
  },
  {
    field: 'createTime',
    minWidth: 160,
    title: '创建时间',
    formatter: 'formatDateTime',
  },

  {
    field: 'action',
    fixed: 'right',
    minWidth: 160,
    slots: { default: 'action' },
    title: '操作',
  },
];

export const modalFormSchemas: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'id',
    label: 'ID',
    dependencies: {
      show: false,
      triggerFields: ['id'],
    },
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: '姓名',
    rules: z.string().min(1, '请输入姓名'),
  },
  {
    component: 'Input',
    fieldName: 'username',
    label: '用户名',
    rules: z.string().min(1, '请输入用户名'),
  },
  {
    component: 'InputPassword',
    fieldName: 'password',
    label: '密码',
    // 编辑时不强制，创建时强制，这里简单处理，后续可以在view中动态控制
  },
  {
    component: 'Input',
    fieldName: 'email',
    label: '邮箱',
  },
  {
    component: 'Input',
    fieldName: 'telephone',
    label: '电话',
  },
  {
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 },
      ],
    },
    defaultValue: 1,
    fieldName: 'status',
    label: '状态',
  },
];
