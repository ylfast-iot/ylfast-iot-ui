import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { markRaw } from 'vue';

import { z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { checkProtocolExists } from '#/api/iot/protocol';
import { YlCardSelect } from '#/components/yl-card-select';

import ProtocolConfig from './components/ProtocolConfig.vue';

export const getColumns = (): VxeGridProps['columns'] => [
  {
    field: 'protocolId',
    title: $t('common.id'),
    minWidth: 150,
  },
  {
    field: 'protocolName',
    title: $t('common.name'),
    minWidth: 150,
  },
  {
    field: 'protocolType',
    title: $t('common.type'),
    width: 120,
    cellRender: {
      name: 'CellTag',
      options: [
        { color: 'blue', label: $t('protocol.jar'), value: 'jar' },
        { color: 'orange', label: $t('protocol.script'), value: 'script' },
        { color: 'green', label: $t('protocol.local'), value: 'local' },
      ],
    },
  },
  {
    field: 'state',
    title: $t('common.status'),
    width: 100,
    cellRender: {
      name: 'CellTag',
      options: [
        { color: 'green', label: $t('common.enable'), value: 1 },
        { color: 'red', label: $t('common.disable'), value: 0 },
      ],
    },
  },
  {
    field: 'createTime',
    title: $t('common.createTime'),
    minWidth: 160,
    formatter: 'formatDateTime',
  },
  {
    field: 'protocolDescription',
    title: $t('common.description'),
    minWidth: 200,
  },
  {
    field: 'action',
    title: $t('common.action.label'),
    fixed: 'right',
    width: 120,
    slots: { default: 'action' },
  },
];

export const getSearchFormSchemas = (): YlDcFormSchema[] => [
  {
    field: 'protocolName',
    label: $t('common.name'),
    component: 'Input',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
  },
];

export const getModalFormSchemas = (
  providerOptions: any[],
  register?: any,
  currentId?: string,
): VbenFormSchema[] => [
  {
    fieldName: 'id',
    component: 'Input',
    dependencies: {
      show: false,
      triggerFields: ['id'],
    },
  },
  {
    fieldName: 'protocolId',
    label: $t('protocol.id'),
    component: 'Input',
    rules: z
      .string()
      .min(1, $t('common.validate.required'))
      .superRefine(async (val, ctx) => {
        if (!val) return;
        if (currentId && val === currentId) return;
        try {
          const exists = await checkProtocolExists(val);
          if (exists) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: $t('common.validate.exists'),
            });
          }
        } catch {
          // ignore
        }
      }),
    componentProps: {
      placeholder: $t('common.placeholder.input'),
      // disabled: true, // Let user edit if they want, but usually auto-filled
    },
  },
  {
    fieldName: 'protocolName',
    label: $t('common.name'),
    component: 'Input',
    rules: z.string().min(1, $t('common.validate.required')),
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
  },
  {
    fieldName: 'protocolType',
    label: $t('common.type'),
    component: markRaw(YlCardSelect),
    rules: z.string().min(1, $t('common.validate.required')),
    defaultValue: 'jar',
    modelPropName: 'value',
    componentProps: {
      options: providerOptions,
      columns: 3,
    },
  },
  {
    fieldName: 'configuration',
    label: $t('protocol.configuration'),
    hideLabel: true,
    modelPropName: 'value',
    component: markRaw(ProtocolConfig),
    componentProps: (formModel) => {
      return {
        // Pass protocolType dynamically
        protocolType: formModel.protocolType,
        register,
        onSuccess: (info: any) => {
          // Auto-fill fields on successful upload/load
          formModel.protocolId = info.id;
          formModel.protocolName = info.name;
          formModel.protocolDescription = info.description;
        },
      };
    },
    dependencies: {
      triggerFields: ['protocolType'],
    },
  },
  {
    fieldName: 'protocolDescription',
    label: $t('common.description'),
    component: 'Textarea',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
      rows: 3,
    },
  },
];
