import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useDebounceFn } from '@vueuse/core';

import { UserEntityType } from '#/adapter/hsweb/user';
import { getOrganizationTree } from '#/api/system/organization';
import { queryGroupDetailTree } from '#/api/system/role';
import { passwordValidate, usernameValidate } from '#/api/system/user';

const validateUsername = useDebounceFn(usernameValidate, 500);
const validatePassword = useDebounceFn(passwordValidate, 500);

export const searchFormSchemas: YlDcFormSchema[] = [
  {
    component: 'Input',
    field: 'name',
    label: $t('user.field.name'),
    termTypes: ['like', 'nlike', 'eq'],
  },
  {
    component: 'Input',
    field: 'username',
    label: $t('user.field.username'),
    termTypes: ['like', 'nlike', 'eq'],
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: $t('user.action.enable'), value: 1 },
        { label: $t('user.action.disable'), value: 0 },
      ],
    },
    field: 'status',
    label: $t('user.field.status'),
    termTypes: ['eq', 'not'],
  },
];

export const columns: VxeGridProps['columns'] = [
  { field: 'name', minWidth: 120, title: $t('user.field.name') },
  {
    field: 'username',
    minWidth: 120,
    title: $t('user.field.username'),
    cellRender: {
      name: 'CellTag',
    },
  },
  {
    field: 'roleList',
    minWidth: 150,
    title: $t('user.field.role'),
    cellRender: {
      name: 'CellTag',
      props: {
        type: 'primary',
      },
      options: [],
    },
    slots: { default: 'roleList' },
  },
  {
    field: 'typeId',
    minWidth: 100,
    title: $t('user.field.userType'),
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
    title: $t('user.field.status'),
  },
  {
    field: 'telephone',
    minWidth: 120,
    title: $t('user.field.telephone'),
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
    title: $t('user.field.email'),
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
    title: $t('user.field.createTime'),
    formatter: 'formatDateTime',
  },

  {
    field: 'action',
    fixed: 'right',
    minWidth: 200,
    slots: { default: 'action' },
    title: $t('common.action.label'),
  },
];

// Helper for section titles
const renderSectionTitle = (title: string) => {
  return (
    <div class="mb-2 mt-4 flex items-center text-base font-bold text-gray-800 dark:text-gray-100">
      <div class="mr-2 h-4 w-1 rounded-sm bg-primary"></div>
      {title}
    </div>
  );
};

const BasicInfoTitle = () => renderSectionTitle($t('user.group.basic'));
const AccountInfoTitle = () => renderSectionTitle($t('user.group.account'));

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
  // --- 基础信息 ---
  {
    component: BasicInfoTitle,
    fieldName: 'divider_basic',
    formItemClass: 'col-span-2',
    label: '',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: $t('user.placeholder.name'),
    },
    fieldName: 'name',
    formItemClass: 'col-span-2',
    label: $t('user.field.name'),
    rules: z.string().min(1, $t('user.placeholder.name')),
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: $t('user.placeholder.telephone'),
    },
    fieldName: 'telephone',
    label: $t('user.field.telephone'),
    rules: z
      .string()
      .regex(/^1[3-9]\d{9}$/, $t('user.validate.telephoneFormat'))
      .optional()
      .or(z.literal(''))
      .or(z.null())
      .or(z.undefined()),
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: $t('user.placeholder.email'),
    },
    fieldName: 'email',
    label: $t('user.field.email'),
    rules: z
      .string()
      .email($t('user.validate.emailFormat'))
      .optional()
      .or(z.literal(''))
      .or(z.null())
      .or(z.undefined()),
  },
  {
    component: 'ApiSelect',
    componentProps: {
      api: async (params: any) => {
        const data = await queryGroupDetailTree(params);
        return data.map((group) => ({
          label: group.groupName,
          options: (group.roles || []).map((role) => ({
            label: role.name,
            value: role.id,
          })),
        }));
      },
      mode: 'multiple',
      placeholder: $t('user.placeholder.role'),
    },
    fieldName: 'roleIdList',
    label: $t('user.field.role'),
    dependencies: {
      triggerFields: ['username'],
      disabled: (values) => values.username === 'admin',
      rules: (values) => {
        return values.username === 'admin'
          ? z.any().optional()
          : z.array(z.string()).min(1, $t('user.placeholder.role'));
      },
    },
  },
  {
    component: 'ApiTreeSelect',
    componentProps: {
      api: getOrganizationTree,
      fieldNames: {
        children: 'children',
        label: 'name',
        value: 'id',
      },
      multiple: true,
      placeholder: $t('user.placeholder.organization'),
      treeDefaultExpandAll: true,
    },
    defaultValue: undefined,
    fieldName: 'orgIdList',
    label: $t('user.field.organization'),
  },

  // --- 账号信息 ---
  {
    component: AccountInfoTitle,
    fieldName: 'divider_account',
    formItemClass: 'col-span-2',
    label: '',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: $t('user.placeholder.username'),
    },
    fieldName: 'username',
    formFieldProps: {
      validateOnChange: false,
      validateOnInput: false,
      validateOnModelUpdate: true,
      validateOnBlur: true,
    },
    formItemClass: 'col-span-2',
    label: $t('user.field.username'),
    dependencies: {
      triggerFields: ['id'],
      disabled: (values) => !!values.id,
      rules(values) {
        return values.id
          ? z.string().min(1, $t('user.placeholder.username'))
          : z
              .string()
              .min(1, $t('user.placeholder.username'))
              .superRefine(async (val, ctx) => {
                const res = await validateUsername(val);
                if (!res.passed) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: res.reason || $t('user.validate.usernameExists'),
                  });
                }
              });
      },
    },
  },
  {
    component: 'InputPassword',
    componentProps: {
      placeholder: $t('user.placeholder.password'),
    },
    fieldName: 'password',
    formFieldProps: {
      validateOnChange: false,
      validateOnInput: false,
      validateOnModelUpdate: true,
      validateOnBlur: true,
    },
    label: $t('user.field.password'),
    dependencies: {
      // Only show if ID does not exist (add mode)
      if: (values) => !values.id,
      triggerFields: ['id'],
    },
    rules: z
      .string()
      .min(1, $t('user.placeholder.password'))
      .superRefine(async (val, ctx) => {
        const res = await validatePassword(val);
        if (!res.passed) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: res.reason || $t('user.validate.passwordStrength'),
          });
        }
      }),
  },
  {
    component: 'InputPassword',
    componentProps: {
      placeholder: $t('user.placeholder.confirmPassword'),
    },
    fieldName: 'confirmPassword',
    label: $t('user.field.confirmPassword'),
    dependencies: {
      // Only show if ID does not exist (add mode)
      if: (values) => !values.id,
      triggerFields: ['id', 'password'],
      required: () => true,
      rules: (values) => {
        return z
          .string()
          .min(1, $t('user.placeholder.confirmPassword'))
          .refine(
            (val) => val === values.password,
            $t('user.validate.passwordMismatch'),
          );
      },
    },
  },
  {
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: $t('user.action.enable'), value: 1 },
        { label: $t('user.action.disable'), value: 0 },
      ],
    },
    defaultValue: 1,
    fieldName: 'status',
    label: $t('user.field.status'),
    dependencies: {
      show: false,
      triggerFields: ['status'],
    },
  },
];

export const resetPasswordSchemas: VbenFormSchema[] = [
  {
    component: 'InputPassword',
    componentProps: {
      placeholder: $t('user.placeholder.password'),
    },
    fieldName: 'password',
    formFieldProps: {
      validateOnChange: false,
      validateOnInput: false,
      validateOnModelUpdate: true,
      validateOnBlur: true,
    },
    label: $t('user.field.newPassword'),
    dependencies: {
      triggerFields: ['password'],
      required: () => true,
      rules: () => {
        return z
          .string()
          .min(1, $t('user.placeholder.password'))
          .superRefine(async (val, ctx) => {
            const res = await validatePassword(val);
            if (!res.passed) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: res.reason || $t('user.validate.passwordStrength'),
              });
            }
          });
      },
    },
  },
  {
    component: 'InputPassword',
    componentProps: {
      placeholder: $t('user.placeholder.confirmPassword'),
    },
    fieldName: 'confirmPassword',
    label: $t('user.field.confirmPassword'),
    dependencies: {
      triggerFields: ['password'],
      rules: (values) => {
        return z
          .string()
          .min(1, $t('user.placeholder.confirmPassword'))
          .refine(
            (val) => val === values.password,
            $t('user.validate.passwordMismatch'),
          );
      },
    },
  },
];
