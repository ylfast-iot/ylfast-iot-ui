import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { $t } from '@vben/locales';

import { CHANNEL_TYPE_ENUMS } from '#/enums/channel-type';

export const getColumns = (): VxeGridProps['columns'] => [
  {
    field: 'name',
    title: $t('gateway.name'),
    minWidth: 180,
    slots: { default: 'name' },
  },
  {
    field: 'provider',
    title: $t('gateway.provider'),
    minWidth: 150,
    slots: { default: 'provider' },
  },
  {
    field: 'channel',
    title: $t('gateway.channel'),
    width: 120,
    cellRender: {
      name: 'CellTag',
      options: Object.values(CHANNEL_TYPE_ENUMS).map((item) => ({
        label: item.label,
        value: item.value,
        color: item.color,
      })),
    },
  },
  {
    field: 'transport',
    title: $t('gateway.transport'),
    width: 120,
  },
  {
    field: 'state.value',
    title: $t('gateway.state'),
    width: 100,
    cellRender: {
      name: 'CellTag',
      options: [
        {
          color: 'green',
          label: $t('gateway.states.enabled'),
          value: 'enabled',
        },
        {
          color: 'red',
          label: $t('gateway.states.disabled'),
          value: 'disabled',
        },
        {
          color: 'orange',
          label: $t('gateway.states.paused'),
          value: 'paused',
        },
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
    title: $t('gateway.description'),
    minWidth: 200,
  },
  {
    field: 'action',
    title: $t('common.action.label'),
    fixed: 'right',
    width: 180,
    slots: { default: 'action' },
  },
];

export const getSearchFormSchemas = (): YlDcFormSchema[] => [
  {
    field: 'name',
    label: $t('gateway.name'),
    component: 'Input',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
  },
  {
    field: 'provider',
    label: $t('gateway.provider'),
    component: 'Input',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
  },
  {
    field: 'state',
    label: $t('gateway.state'),
    component: 'Select',
    componentProps: {
      placeholder: $t('common.placeholder.select'),
      options: [
        { label: $t('gateway.states.enabled'), value: 'enabled' },
        { label: $t('gateway.states.disabled'), value: 'disabled' },
        { label: $t('gateway.states.paused'), value: 'paused' },
      ],
    },
  },
];
