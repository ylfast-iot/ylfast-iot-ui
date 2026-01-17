import type { VxeGridProps } from '#/adapter';
import type { VbenFormSchema } from '#/adapter/form';
import type { YlDcFormSchema } from '#/components/yl-dc-form/src/types';

import { markRaw } from 'vue';

import { $t } from '@vben/locales';

import {
  CERTIFICATE_AUTH_METHOD_ENUMS,
  CERTIFICATE_FORMAT_ENUMS,
  CERTIFICATE_MODE_ENUMS,
  CERTIFICATE_TYPE_ENUMS,
} from '#/enums/certificate';

import CertificateConfigForm from './components/CertificateConfigForm.vue';
import YlCardSelector from './components/YlCardSelector.vue';

/**
 * 获取表格列配置
 */
export const getColumns = (): VxeGridProps['columns'] => [
  { type: 'checkbox', width: 60, fixed: 'left' },
  {
    field: 'name',
    title: $t('certificate.fields.name'),
    minWidth: 200,
    fixed: 'left',
  },
  {
    field: 'type',
    title: $t('certificate.fields.standard'),
    width: 140,
    formatter: ({ cellValue }: any) => {
      return (
        CERTIFICATE_TYPE_ENUMS[cellValue as keyof typeof CERTIFICATE_TYPE_ENUMS]
          ?.label || cellValue
      );
    },
  },
  {
    field: 'format',
    title: $t('certificate.fields.format'),
    width: 120,
    cellRender: {
      name: 'YlTag',
      props: (row: any) => ({
        color:
          CERTIFICATE_FORMAT_ENUMS[
            row.format as keyof typeof CERTIFICATE_FORMAT_ENUMS
          ]?.color || 'default',
        text:
          CERTIFICATE_FORMAT_ENUMS[
            row.format as keyof typeof CERTIFICATE_FORMAT_ENUMS
          ]?.label || row.format,
      }),
    },
  },
  {
    field: 'authenticationMethod',
    title: $t('certificate.fields.authMethod'),
    width: 140,
    formatter: ({ cellValue }: any) => {
      return (
        CERTIFICATE_AUTH_METHOD_ENUMS[
          cellValue as keyof typeof CERTIFICATE_AUTH_METHOD_ENUMS
        ]?.label || cellValue
      );
    },
  },
  {
    field: 'mode',
    title: $t('certificate.fields.mode'),
    width: 110,
    formatter: ({ cellValue }: any) => {
      return (
        CERTIFICATE_MODE_ENUMS[cellValue as keyof typeof CERTIFICATE_MODE_ENUMS]
          ?.label || cellValue
      );
    },
  },
  {
    field: 'description',
    title: $t('certificate.fields.description'),
    minWidth: 250,
  },
  {
    field: 'createTime',
    title: $t('common.createTime'),
    width: 180,
    formatter: 'formatDateTime',
  },
  {
    title: $t('common.action.action'),
    width: 180,
    fixed: 'right',
    slots: { default: 'action' },
  },
];

/**
 * 获取搜索表单配置
 */
export function getSearchFormSchemas(): YlDcFormSchema[] {
  return [
    {
      component: 'Input',
      field: 'name',
      label: $t('certificate.fields.name'),
      componentProps: {
        allowClear: true,
      },
    },
    {
      component: 'RadioButtonGroup',
      field: 'type',
      label: $t('certificate.fields.standard'),
      componentProps: {
        options: Object.values(CERTIFICATE_TYPE_ENUMS),
        allowClear: true,
        optionType: 'button',
        size: 'small',
      },
    },
    {
      component: 'RadioButtonGroup',
      field: 'format',
      label: $t('certificate.fields.format'),
      componentProps: {
        options: Object.values(CERTIFICATE_FORMAT_ENUMS),
        allowClear: true,
        optionType: 'button',
        size: 'small',
      },
    },
    {
      component: 'RadioButtonGroup',
      field: 'mode',
      label: $t('certificate.fields.mode'),
      componentProps: {
        options: Object.values(CERTIFICATE_MODE_ENUMS),
        allowClear: true,
        optionType: 'button',
        size: 'small',
      },
    },
    {
      component: 'RadioButtonGroup',
      field: 'authenticationMethod',
      label: $t('certificate.fields.authMethod'),
      componentProps: {
        options: Object.values(CERTIFICATE_AUTH_METHOD_ENUMS),
        allowClear: true,
        optionType: 'button',
        size: 'small',
      },
    },
  ];
}

/**
 * 弹窗表单配置
 */
export const getFormSchemas = (_isEdit: boolean): VbenFormSchema[] => [
  {
    component: markRaw(YlCardSelector),
    fieldName: 'type',
    label: $t('certificate.fields.standard'),
    rules: 'required',
    modelPropName: 'value',
    defaultValue: 'common',
    componentProps: {
      columns: 3,
      options: [
        {
          label: $t('certificate.types.common'),
          value: 'common',
          description: $t('certificate.types.common_desc'),
          icon: 'lucide:shield-check',
          subTags: ['TLS/SSL', 'X.509'],
        },
      ],
      disabled: false,
    },
    formItemClass: 'col-span-2 mb-6',
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: $t('certificate.fields.name'),
    rules: 'required',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
      class: '!rounded-xl',
    },
    formItemClass: 'col-span-2 mb-6',
  },
  // 3. 证书格式
  {
    component: markRaw(YlCardSelector),
    fieldName: 'format',
    label: $t('certificate.fields.format'),
    rules: 'required',
    modelPropName: 'value',
    defaultValue: 'PEM',
    componentProps: {
      columns: 3,
      options: [
        {
          label: 'PEM',
          value: 'PEM',
          description: $t('certificate.formats.PEM_desc'),
          icon: 'lucide:file-text',
        },
        {
          label: 'PFX',
          value: 'PFX',
          description: $t('certificate.formats.PFX_desc'),
          icon: 'lucide:file-terminal',
        },
        {
          label: 'JKS',
          value: 'JKS',
          description: $t('certificate.formats.JKS_desc'),
          icon: 'lucide:file-code',
        },
      ],
    },
    formItemClass: 'col-span-2 mb-6',
  },
  // 4. 证书类型 (服务端/客户端)
  {
    component: 'RadioButtonGroup',
    fieldName: 'mode',
    label: $t('certificate.fields.mode'),
    rules: 'required',
    defaultValue: 'server',
    componentProps: {
      options: Object.values(CERTIFICATE_MODE_ENUMS).map((item) => ({
        ...item,
        class: '!rounded-lg',
      })),
      optionType: 'button',
    },
    formItemClass: 'col-span-2 mb-6',
  },
  // 5. 认证方式 (先隐藏)
  {
    component: 'RadioButtonGroup',
    fieldName: 'authenticationMethod',
    defaultValue: 'single',
    dependencies: {
      triggerFields: ['authenticationMethod'],
      show: false,
    },
  },
  // 6. 证书文件内容 (Cert / Keystore)
  {
    fieldName: 'config_cert',
    label: $t('certificate.fields.cert'),
    component: markRaw(CertificateConfigForm),
    modelPropName: 'value',
    rules: 'required',
    dependencies: {
      triggerFields: ['mode', 'format', 'authenticationMethod'],
    },
    componentProps: (model: any) => ({
      mode: model.mode,
      format: model.format,
      authenticationMethod: model.authenticationMethod,
      part: model.format === 'PEM' ? 'cert' : 'keystore',
    }),
    formItemClass: 'col-span-2 text-xs mb-2',
  },
  // 7. 证书私钥 / 信任库
  {
    fieldName: 'config_key',
    label: $t('certificate.fields.key'),
    component: markRaw(CertificateConfigForm),
    modelPropName: 'value',
    dependencies: {
      triggerFields: ['mode', 'format', 'authenticationMethod'],
      show: (model: any) => {
        // PFX/JKS 只有在双向认证时展示信任库
        return model.format === 'PEM'
          ? model.mode === 'server'
          : model.authenticationMethod === 'binomial';
      },
    },
    componentProps: (model: any) => ({
      mode: model.mode,
      format: model.format,
      authenticationMethod: model.authenticationMethod,
      part: model.format === 'PEM' ? 'key' : 'trustKeystore',
    }),
    formItemClass: 'col-span-2 text-xs mb-2',
  },
  // 8. 信任证书
  {
    fieldName: 'config_trust',
    label: $t('certificate.fields.trust'),
    component: markRaw(CertificateConfigForm),
    modelPropName: 'value',
    dependencies: {
      triggerFields: ['mode', 'format'],
      show: (model: any) => model.format === 'PEM' && model.mode === 'client',
    },
    componentProps: (model: any) => ({
      mode: model.mode,
      format: model.format,
      authenticationMethod: model.authenticationMethod,
      part: 'trust',
    }),
    formItemClass: 'col-span-2 text-xs mb-2',
  },
  // 9. 说明
  {
    component: 'Textarea',
    fieldName: 'description',
    label: $t('certificate.fields.description_short'),
    componentProps: {
      placeholder: $t('common.placeholder.input'),
      autoSize: { minRows: 2, maxRows: 4 },
      class: '!rounded-xl',
    },
    formItemClass: 'col-span-2',
  },
  {
    fieldName: 'id',
    label: 'ID',
    component: 'Input',
    dependencies: {
      triggerFields: ['id'],
      show: false,
    },
  },
];
