import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridProps } from '@vben/plugins/vxe-table';

import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { getAllMenuTree } from '#/api/system/menu';

/**
 * 获取所有视图组件路径
 */
const componentKeys: string[] = Object.keys(
  import.meta.glob('../../**/*.vue'), // Adjust glob pattern to scan all .vue files within the views directory
)
  .map((v) => {
    const path = v.replace('../../', ''); // Adjust path replacement based on the glob pattern
    const finalPath = path.endsWith('.vue') ? path.slice(0, -4) : path;
    const componentKey = finalPath.replace(/^views\//, '');
    return componentKey;
  })
  .filter((v) => !v.startsWith('.'));
const componentOptions = componentKeys.map((key) => ({ value: key }));

export const searchFormSchemas: YlDcFormSchema[] = [
  {
    component: 'Input',
    field: 'name',
    label: $t('menu.name'),
    termTypes: ['like', 'nlike', 'eq'],
  },
  {
    component: 'Input',
    label: $t('menu.code'),
    field: 'code',
    termTypes: ['like', 'nlike', 'eq'],
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: $t('menu.enable'), value: 1 },
        { label: $t('menu.disable'), value: 0 },
      ],
    },
    field: 'status',
    label: $t('menu.status'),
    termTypes: ['eq', 'not'],
  },
];

export const columns: VxeGridProps['columns'] = [
  {
    field: 'name',
    minWidth: 200,
    title: $t('menu.name'),
    treeNode: true,
    align: 'left',
  },
  { field: 'code', minWidth: 150, title: $t('menu.code') },
  {
    field: 'icon',
    title: $t('menu.icon'),
    width: 80,
    align: 'center',
    cellRender: {
      name: 'VbenIcon', // Assuming VbenIcon renderer is available, or I'll check how to render icon
      props: (params: any) => ({ icon: params.row.icon }),
    },
  },
  { field: 'url', minWidth: 150, title: $t('menu.url') },
  { field: 'component', minWidth: 150, title: $t('menu.component') },
  { field: 'sortIndex', title: $t('menu.sort'), width: 80 },
  {
    field: 'status',
    minWidth: 100,
    slots: { default: 'status' },
    title: $t('menu.status'),
  },
  {
    field: 'action',
    fixed: 'right',
    minWidth: 160,
    slots: { default: 'action' },
    title: $t('common.action.label'),
  },
];

export const modalFormSchemas: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'id',
    label: 'ID',
    componentProps: {
      disabled: true,
      placeholder: $t('common.autoGenerate'),
    },
    dependencies: {
      triggerFields: ['id'],
      show: (values) => !!values.id,
    },
    formItemClass: 'col-span-2',
  },
  {
    component: 'ApiTreeSelect',
    fieldName: 'parentId',
    label: $t('menu.parent'),
    formItemClass: 'col-span-2',
    componentProps: {
      labelField: 'name',
      valueField: 'id',
      childrenField: 'children',
      params: {
        pageIndex: 0,
        pageSize: 9999,
        paging: false,
        sorts: [
          {
            name: 'sortIndex',
            order: 'asc',
          },
        ],
        terms: [
          {
            value: '%show":false%',
            termType: 'nlike',
            column: 'options',
          },
          {
            terms: [
              {
                terms: [
                  {
                    column: 'owner',
                    termType: 'eq',
                    value: 'iot',
                  },
                  {
                    column: 'owner',
                    termType: 'isnull',
                    value: '1',
                    type: 'or',
                  },
                ],
              },
              {
                type: 'or',
                terms: [
                  {
                    value: '%show":false%',
                    termType: 'nlike',
                    column: 'options',
                  },
                ],
              },
            ],
          },
        ],
      },
      api: getAllMenuTree,
      placeholder: $t('menu.parentPlaceholder'),
      allowClear: true,
    },
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: $t('menu.name'),
    componentProps: {
      placeholder: $t('menu.namePlaceholder'),
    },
    rules: z.string().min(1, $t('menu.nameRequired')),
  },
  {
    component: 'Input',
    fieldName: 'code',
    label: $t('menu.code'),
    componentProps: {
      placeholder: $t('menu.codePlaceholder'),
    },
    rules: z.string().min(1, $t('menu.codeRequired')),
  },
  {
    component: 'IconPicker',
    fieldName: 'icon',
    label: $t('menu.icon'),
  },
  {
    component: 'InputNumber',
    fieldName: 'sortIndex',
    label: $t('menu.sort'),
    defaultValue: 0,
  },
  {
    component: 'Input',
    fieldName: 'url',
    label: $t('menu.url'),
    formItemClass: 'col-span-2',
    componentProps: {
      placeholder: $t('menu.urlPlaceholder'),
    },
  },
  {
    component: 'AutoComplete',
    fieldName: 'component',
    label: $t('menu.component'),
    formItemClass: 'col-span-2',
    componentProps: {
      placeholder: $t('menu.componentPlaceholder'),
      options: componentOptions,
      filterOption: (input: string, option: { value: string }) => {
        return option.value.toLowerCase().includes(input.toLowerCase());
      },
    },
  },
  {
    component: 'RadioButtonGroup',
    fieldName: 'status',
    label: $t('menu.status'),
    defaultValue: 1,
    formItemClass: 'col-span-2',
    componentProps: {
      options: [
        { label: $t('menu.enable'), value: 1 },
        { label: $t('menu.disable'), value: 0 },
      ],
    },
  },
  {
    component: 'Textarea',
    fieldName: 'describe',
    label: $t('menu.describe'),
    formItemClass: 'col-span-2',
  },
];
