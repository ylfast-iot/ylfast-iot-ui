import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { h, markRaw } from 'vue';

import { z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import ClusterConfig from './components/ClusterConfig.vue';
import ClusterToggle from './components/ClusterToggle.vue';
import NetworkConfigForm from './components/NetworkConfigForm.vue';

export const getColumns = (): VxeGridProps['columns'] => [
  {
    field: 'name',
    title: $t('network.name'),
    minWidth: 180,
    slots: { default: 'name' },
  },
  {
    field: 'type',
    title: $t('network.type'),
    width: 150,
    cellRender: {
      name: 'CellTag',
      options: [
        { label: $t('network.types.TCP_SERVER'), value: 'TCP_SERVER' },
        { label: $t('network.types.UDP_SERVER'), value: 'UDP_SERVER' },
        { label: $t('network.types.MQTT_CLIENT'), value: 'MQTT_CLIENT' },
        { label: $t('network.types.MQTT_SERVER'), value: 'MQTT_SERVER' },
        { label: $t('network.types.HTTP_SERVER'), value: 'HTTP_SERVER' },
        { label: $t('network.types.WS_SERVER'), value: 'WS_SERVER' },
      ],
    },
  },
  {
    field: 'address',
    title: $t('network.address'),
    minWidth: 200,
    slots: { default: 'address' },
  },
  {
    field: 'state',
    title: $t('network.state'),
    width: 100,
    cellRender: {
      name: 'CellTag',
      options: [
        { color: 'green', label: $t('common.enable'), value: 'enabled' },
        { color: 'red', label: $t('common.disable'), value: 'disabled' },
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
    field: 'description',
    title: $t('network.description'),
    minWidth: 200,
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
    label: $t('network.name'),
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
const NetworkConfigTitle = () =>
  renderSectionTitle($t('network.configuration'));

export const getModalFormSchemas = (
  typeOptions: any[],
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
    rules: z.string().min(1, $t('common.validate.required')),
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
    dependencies: {
      show: false,
      triggerFields: ['id'],
    },
    formItemClass: 'col-span-2',
  },
  {
    fieldName: 'name',
    label: $t('network.name'),
    component: 'Input',
    rules: z.string().min(1, $t('common.validate.required')),
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
    formItemClass: 'col-span-1',
  },
  {
    fieldName: 'type',
    label: $t('network.type'),
    component: 'Select',
    defaultValue: undefined,
    rules: 'selectRequired',
    componentProps: {
      options: typeOptions,
      placeholder: $t('common.placeholder.select'),
      disabled: isEdit,
    },
    formItemClass: 'col-span-1',
  },
  {
    fieldName: 'divider_config',
    component: NetworkConfigTitle,
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
    component: markRaw(NetworkConfigForm),
    dependencies: {
      show: (model) => !!model.shareCluster,
      triggerFields: ['shareCluster', 'type'],
    },
    componentProps: (model) => ({
      type: model.type,
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
      triggerFields: ['shareCluster', 'type'],
    },
    componentProps: (model) => ({
      type: model.type,
      register: registerCluster,
    }),
    formItemClass: 'col-span-2',
  },
  {
    fieldName: 'description',
    label: $t('network.description'),
    component: 'Textarea',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
      rows: 3,
    },
    formItemClass: 'col-span-2',
  },
];
