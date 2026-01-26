import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { markRaw } from 'vue';

import { $t } from '@vben/locales';

import { getAllProductTypeTree } from '#/api/iot/device/product-type';
import { YlCardSelect } from '#/components/yl-card-select';
import { YlImageUpload } from '#/components/yl-image-upload';
import { DEVICE_TYPE_ENUMS, DEVICE_TYPES } from '#/enums/device';

export const getColumns = (): VxeGridProps['columns'] => [
  {
    field: 'productName',
    title: $t('device.product.productName'), // 产品名称
    minWidth: 150,
  },
  {
    field: 'deviceType',
    title: $t('device.instance.type'), // 设备类型
    width: 120,
    cellRender: {
      name: 'CellTag',
      options: Object.values(DEVICE_TYPE_ENUMS),
    },
  },
  {
    field: 'transport',
    title: $t('device.instance.transport'), // 传输协议
    width: 100,
  },
  {
    field: 'protocolName',
    title: $t('device.instance.protocol'), // 协议名称
    minWidth: 120,
  },
  {
    field: 'state',
    title: $t('common.status'), // 状态
    width: 100,
    cellRender: {
      name: 'CellTag',
      options: [
        { label: $t('common.enable'), value: 1, color: 'processing' },
        { label: $t('common.disable'), value: 0, color: 'error' },
      ],
    },
  },
  {
    field: 'createTime',
    title: $t('common.createTime'), // 创建时间
    minWidth: 160,
    formatter: 'formatDateTime',
  },
  {
    field: 'description',
    title: $t('common.description'), // 说明
    minWidth: 200,
  },
  {
    field: 'action',
    title: $t('common.action.label'), // 操作
    fixed: 'right',
    width: 120,
    slots: { default: 'action' },
  },
];

export const getSearchFormSchemas = (): YlDcFormSchema[] => [
  {
    field: 'productName',
    label: $t('device.product.productName'),
    component: 'Input',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
  },
  {
    field: 'deviceType',
    label: $t('device.instance.type'),
    component: 'Select',
    componentProps: {
      options: DEVICE_TYPES,
      placeholder: $t('common.placeholder.select'),
    },
  },
];

// Icon mapping for card select
const deviceTypeIcons: Record<string, string> = {
  DIRECT: 'lucide:link',
  GATEWAY: 'lucide:network',
  GATEWAY_CHILD: 'lucide:cpu',
};

const deviceTypeOptions = DEVICE_TYPES.map((item) => ({
  label: item.label,
  value: item.value,
  color: item.color,
  icon: deviceTypeIcons[item.value] || 'lucide:box',
  description: item.value, // Simple description or add to i18n
}));

export const getModalFormSchemas = (): VbenFormSchema[] => [
  {
    fieldName: 'productType',
    component: 'Input',
    dependencies: {
      show: false,
      triggerFields: ['productType'],
    },
  },
  {
    fieldName: 'coverUrl',
    hideLabel: true,
    label: $t('device.instance.cover'),
    component: markRaw(YlImageUpload),
    componentProps: {
      height: '100%',
    },
    formItemClass:
      'col-span-1 row-span-2 h-full mb-0 [&>div]:h-full [&>div>div]:h-full [&>div>div>div]:h-full',
  },
  {
    fieldName: 'id',
    label: $t('common.id'),
    component: 'Input',
    formItemClass: 'col-span-3',
    dependencies: {
      triggerFields: ['id'],
    },
  },
  {
    fieldName: 'productName',
    label: $t('device.product.productName'),
    component: 'Input',
    rules: 'required',
    formItemClass: 'col-span-3',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
    },
  },
  {
    fieldName: 'productTypeId',
    label: $t('device.product.productType'),
    component: 'ApiTreeSelect',
    rules: 'required',
    formItemClass: 'col-span-4',
    componentProps: (value) => {
      return {
        api: getAllProductTypeTree.bind(null, {
          paging: false,
          excludes: ['key'],
        }),
        childrenField: 'children',
        // 菜单接口转options格式
        labelField: 'name',
        valueField: 'id',
        placeholder: $t('common.placeholder.select'),
        onChange: (_value: any, label: any) => {
          value.productType = label[0];
        },
      };
    },
  },
  {
    fieldName: 'deviceType',
    label: $t('device.instance.type'),
    component: markRaw(YlCardSelect), // Use custom component
    rules: 'required',
    formItemClass: 'col-span-4',
    modelPropName: 'value',
    componentProps: {
      options: deviceTypeOptions,
      columns: 3,
    },
    dependencies: {
      disabled: (values) => !!values.id,
      triggerFields: ['id'],
    },
  },
  {
    fieldName: 'description',
    label: $t('common.description'),
    component: 'Textarea',
    formItemClass: 'col-span-4',
    componentProps: {
      placeholder: $t('common.placeholder.input'),
      rows: 3,
    },
  },
];
