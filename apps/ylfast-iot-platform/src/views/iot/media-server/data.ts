import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { h, markRaw } from 'vue';

import { z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import ClusterConfig from './components/ClusterConfig.vue';
import ClusterToggle from './components/ClusterToggle.vue';
import MediaServerConfigForm from './components/MediaServerConfigForm.vue';

export const getColumns = (): VxeGridProps['columns'] => [
  {
    field: 'name',
    title: $t('mediaServer.name'),
    minWidth: 180,
  },
  {
    field: 'provider',
    title: $t('mediaServer.provider'),
    width: 150,
    cellRender: {
      name: 'CellTag',
    },
  },
  {
    field: 'enabled',
    title: $t('mediaServer.enabled'),
    width: 100,
    cellRender: {
      name: 'CellTag',
      options: [
        { color: 'green', label: $t('common.enable'), value: true },
        { color: 'red', label: $t('common.disable'), value: false },
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
    field: 'action',
    title: $t('common.action.label'),
    fixed: 'right',
    width: 150,
    slots: { default: 'action' },
  },
];

export const getSearchFormSchemas = (): YlDcFormSchema[] => [
  {
    field: 'name',
    label: $t('mediaServer.name'),
    component: 'Input',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
  },
];

const renderSectionTitle = (title: string) => {
  return h(
    'div',
    {
      class:
        'mb-2 mt-4 flex items-center text-sm font-bold text-slate-800 dark:text-slate-200',
    },
    [h('div', { class: 'mr-2 h-4 w-1 rounded-sm bg-primary' }), title],
  );
};

const BasicInfoTitle = () => renderSectionTitle($t('common.basicInfo'));
const MediaServerConfigTitle = () =>
  renderSectionTitle($t('mediaServer.configuration'));

export const getModalFormSchemas = (
  providerOptions: any[],
  registerShared: any,
  registerCluster: any,
  isEdit: boolean = false,
): VbenFormSchema[] => [
  {
    fieldName: 'divider_basic',
    component: BasicInfoTitle,
    formItemClass: 'col-span-2',
  },
  {
    fieldName: 'id',
    label: 'ID',
    component: 'Input',
    dependencies: {
      show: false,
      triggerFields: ['id'],
    },
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
    formItemClass: 'col-span-2',
  },
  {
    fieldName: 'name',
    label: $t('mediaServer.name'),
    component: 'Input',
    rules: z.string().min(1, $t('common.validate.required')),
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
    formItemClass: 'col-span-1',
  },
  {
    fieldName: 'provider',
    label: $t('mediaServer.provider'),
    component: 'Select',
    defaultValue: undefined,
    rules: 'selectRequired',
    componentProps: {
      options: providerOptions,
      placeholder: $t('common.placeholder.select'),
      disabled: isEdit,
    },
    formItemClass: 'col-span-1',
  },
  {
    fieldName: 'divider_config',
    component: MediaServerConfigTitle,
    formItemClass: 'col-span-2',
  },
  {
    fieldName: 'shareCluster',
    label: '',
    component: markRaw(ClusterToggle),
    modelPropName: 'value',
    defaultValue: true,
    formItemClass: 'col-span-2',
  },
  {
    fieldName: 'configuration',
    label: '',
    modelPropName: 'value',
    component: markRaw(MediaServerConfigForm),
    dependencies: {
      show: (model) => !!model.shareCluster,
      triggerFields: ['shareCluster', 'provider'],
    },
    componentProps: (model) => ({
      provider: model.provider,
      register: registerShared,
    }),
    formItemClass: 'col-span-2',
  },
  {
    fieldName: 'cluster',
    label: '',
    component: markRaw(ClusterConfig),
    modelPropName: 'value',
    dependencies: {
      show: (model) => !model.shareCluster,
      triggerFields: ['shareCluster', 'provider'],
    },
    componentProps: (model) => ({
      provider: model.provider,
      register: registerCluster,
    }),
    formItemClass: 'col-span-2',
  },
];
