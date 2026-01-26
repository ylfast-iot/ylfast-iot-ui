import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { h } from 'vue';

import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

import { NOTIFY_PROVIDER_ENUMS, NOTIFY_TYPE_ENUMS } from '#/enums/notify';

/**
 * 获取通知历史表格列定义
 */
export function getHistoryColumns() {
  return [
    {
      title: $t('notify.debug.status'),
      field: 'state',
      align: 'center',
      width: 100,
      slots: {
        default: ({ row }: any) => {
          const state = row.state?.value || row.state;
          const isSuccess = state === 'success';
          return h(Tag, { color: isSuccess ? 'success' : 'error' }, () =>
            isSuccess ? $t('notify.debug.success') : $t('notify.debug.fail'),
          );
        },
      },
    },
    {
      title: $t('notify.debug.notifyType'),
      field: 'notifyType',
      width: 120,
      align: 'center',
      slots: {
        default: ({ row }: any) => {
          const config = (NOTIFY_TYPE_ENUMS as any)[row.notifyType] || {};
          return h('div', { class: 'w-full text-center' }, [
            config.label || row.notifyType,
          ]);
        },
      },
    },
    {
      title: $t('notify.debug.provider'),
      field: 'provider',
      width: 150,
      align: 'center',
      slots: {
        default: ({ row }: any) => {
          const config = (NOTIFY_PROVIDER_ENUMS as any)[row.provider] || {};
          return h('div', { class: 'w-full text-center' }, [
            config.label || row.provider,
          ]);
        },
      },
    },
    {
      title: $t('notify.debug.time'),
      field: 'notifyTime',
      width: 180,
      align: 'center',
      slots: {
        default: ({ row }: any) => {
          return h(
            'span',
            { class: 'text-xs font-mono text-slate-500' },
            new Date(row.notifyTime).toLocaleString(),
          );
        },
      },
    },
    {
      title: $t('notify.debug.error'),
      field: 'errorStack',
      minWidth: 200,
      align: 'center',
      slots: {
        default: 'errorStack', // 使用插槽以便点击查看详情
      },
    },
  ] as any;
}

/**
 * 获取查询表单配置
 * @param templateOptions 动态模板选项，如果提供则显示模板查询项
 */
export function getHistorySearchSchemas(
  templateOptions: { label: string; value: string }[] = [],
): YlDcFormSchema[] {
  const schemas: YlDcFormSchema[] = [
    {
      field: 'state',
      label: $t('notify.debug.status'),
      component: 'Select',
      componentProps: {
        options: [
          { label: $t('notify.debug.success'), value: 'success' },
          { label: $t('notify.debug.fail'), value: 'error' },
        ],
        placeholder: $t('common.select'),
      },
    },
  ];

  // 如果有模板选项（通常是从通知配置打开），则增加模板查询下拉
  if (templateOptions.length > 0) {
    schemas.push({
      field: 'templateId',
      label: $t('notify.debug.templateId'),
      component: 'Select',
      componentProps: {
        options: templateOptions,
        placeholder: $t('common.select'),
        allowClear: true,
      },
    });
  }

  schemas.push({
    field: 'notifyTime',
    label: $t('notify.debug.time'),
    component: 'RangePicker',
    componentProps: {
      showTime: true,
      class: 'w-full',
    },
  });

  return schemas;
}
