import type { UserDetail } from '#/adapter/hsweb/user';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { $t } from '@vben/locales';

export const columns: VxeGridProps<UserDetail>['columns'] = [
  {
    type: 'checkbox',
    width: 60,
  },
  {
    field: 'name',
    title: $t('common.name', '姓名'),
    minWidth: 100,
  },
  {
    field: 'username',
    title: $t('authentication.username', '用户名'),
    minWidth: 100,
  },
  {
    field: 'status', // or state. Using status as it's common in backend. Will verify.
    title: $t('common.status', '状态'),
    slots: { default: 'state' },
    minWidth: 80,
  },
  {
    field: 'action',
    title: $t('common.action.text', '操作'),
    slots: { default: 'action' },
    fixed: 'right',
    width: 120,
  },
];

export const bindUserColumns: VxeGridProps<UserDetail>['columns'] = [
  {
    type: 'checkbox',
    width: 60,
  },
  {
    field: 'name',
    title: $t('common.name', '姓名'),
    minWidth: 100,
  },
  {
    field: 'username',
    title: $t('authentication.username', '用户名'),
    minWidth: 100,
  },
];

export const searchFormSchemas: YlDcFormSchema[] = [
  {
    field: 'name',
    label: $t('common.name', '姓名'),
    component: 'Input',
  },
  {
    field: 'username',
    label: $t('authentication.username', '用户名'),
    component: 'Input',
  },
];
