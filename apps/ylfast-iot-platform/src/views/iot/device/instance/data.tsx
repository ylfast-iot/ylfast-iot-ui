import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { markRaw } from 'vue';

import { z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { IotDeviceProductApi } from '#/api';
import { YlImageUpload } from '#/components/yl-image-upload';
import { COMMON_STATE } from '#/enums';

/**
 * 通用产品 API 查询 function
 */
export const fetchProductOptions = () =>
  IotDeviceProductApi.basicCrudApis
    .postQueryNoPaging({
      terms: [
        {
          column: 'state',
          termType: 'eq',
          value: COMMON_STATE.ENABLE.value,
        },
      ],
    })
    .then((res) =>
      res.map((item) => ({
        label: item.productName,
        value: item.id,
        transport: item.transport,
        protocolId: item.protocolId,
        deviceType: item.deviceType,
        productName: item.productName,
      })),
    );

export const searchFormSchemas: YlDcFormSchema[] = [
  {
    component: 'Input',
    field: 'sn',
    label: $t('device.instance.sn'),
    termTypes: ['like', 'eq'],
  },
  {
    component: 'Input',
    field: 'deviceName',
    label: $t('device.instance.name'),
    termTypes: ['like', 'nlike', 'eq'],
  },
  {
    component: 'ApiSelect',
    defaultValue: undefined,
    componentProps: {
      api: fetchProductOptions,
      placeholder: $t('common.placeholder.select'),
    },
    field: 'productId',
    label: $t('device.instance.product'),
    termTypes: ['eq'],
  },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 50 },
  {
    field: 'sn',
    minWidth: 150,
    title: $t('device.instance.sn'),
  },
  {
    field: 'deviceName',
    minWidth: 150,
    title: $t('device.instance.name'),
  },
  {
    field: 'productName',
    minWidth: 150,
    title: $t('device.instance.product'),
  },
  {
    field: 'enableStatus',
    minWidth: 100,
    slots: { default: 'status' },
    title: $t('device.instance.status'),
  },
  {
    field: 'registerTime',
    formatter: 'formatDateTime',
    minWidth: 160,
    title: $t('device.instance.createTime'),
  },
  {
    field: 'description',
    minWidth: 150,
    title: $t('device.instance.description'),
  },
  {
    field: 'action',
    fixed: 'right',
    minWidth: 150,
    align: 'center',
    slots: { default: 'action' },
    title: $t('common.action.label'),
  },
];

export const modalFormSchemas: VbenFormSchema[] = [
  // Hidden fields for data integrity during submit
  {
    component: 'Input',
    fieldName: 'deviceType',
    label: 'Device Type',
    dependencies: {
      triggerFields: ['deviceType'],
      show: () => false,
    },
  },
  {
    component: 'Input',
    fieldName: 'deviceState',
    label: 'Device State',
    dependencies: {
      triggerFields: ['deviceState'],
      show: () => false,
    },
  },
  {
    component: 'Input',
    fieldName: 'enableStatus',
    label: 'Enable Status',
    dependencies: {
      triggerFields: ['enableStatus'],
      show: () => false,
    },
  },
  {
    component: 'Input',
    fieldName: 'transport',
    label: 'Transport',
    dependencies: {
      triggerFields: ['transport'],
      show: () => false,
    },
  },
  {
    component: 'Input',
    fieldName: 'protocolId',
    label: 'Protocol ID',
    dependencies: {
      triggerFields: ['protocolId'],
      show: () => false,
    },
  },
  {
    component: 'Input',
    fieldName: 'productName',
    label: 'Product Name',
    dependencies: {
      triggerFields: ['productName'],
      show: () => false,
    },
  },
  // Visible Fields

  // Row 1 & 2: Cover (Left) | ID & SN (Right)
  {
    component: markRaw(YlImageUpload),
    fieldName: 'deviceCoverUrl',
    formItemClass:
      'col-span-1 row-span-2 h-full mb-0 [&>div]:h-full [&>div>div]:h-full [&>div>div>div]:h-full',
    label: $t('device.instance.cover'),
    componentProps: {
      height: '100%',
    },
    hideLabel: true,
  },
  {
    component: 'Input',
    fieldName: 'id',
    label: $t('device.instance.id'),
    formItemClass: 'col-span-3',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
  },
  {
    component: 'Input',
    fieldName: 'sn',
    label: $t('device.instance.sn'),
    formItemClass: 'col-span-3',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
  },
  {
    component: 'Input',
    fieldName: 'deviceName',
    label: $t('device.instance.name'),
    formItemClass: 'col-span-4',
    rules: z.string().min(1, $t('common.placeholder.input')),
  },
  {
    component: 'ApiSelect',
    defaultValue: undefined,
    componentProps: {
      api: fetchProductOptions,
      placeholder: $t('common.placeholder.select'),
    },
    fieldName: 'productId',
    label: $t('device.instance.product'),
    formItemClass: 'col-span-4',
    rules: z.string().min(1, $t('common.placeholder.select')),
  },

  {
    component: 'Textarea',
    fieldName: 'description',
    formItemClass: 'col-span-4',
    label: $t('device.instance.description'),
    componentProps: {
      placeholder: $t('common.placeholder.input'),
      rows: 3,
    },
  },
];
