import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { $t } from '@vben/locales';

import { FILE_TYPE_CATEGORY_ENUMS, getFileTypeInfo } from '#/enums/file';

/**
 * 搜索表单 Schema
 */
export function useFileSearchSchemas(): YlDcFormSchema[] {
  const schemas: YlDcFormSchema[] = [
    {
      field: 'name',
      label: $t('file.fileName'),
      component: 'Input',
      componentProps: {
        placeholder: $t('file.filter.keywordPlaceholder'),
      },
      termTypes: ['like'],
    },
    {
      field: 'extension',
      label: $t('file.fileType'),
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: Object.values(FILE_TYPE_CATEGORY_ENUMS).map((item) => ({
          label: item.label,
          value: item.value,
        })),
      },
      termTypes: ['in'],
    },
    {
      field: 'createTime',
      label: $t('file.filter.dateRange'),
      component: 'RangePicker',
      componentProps: {
        valueFormat: 'x',
      },
      termTypes: ['btw'],
    },
  ];

  return schemas;
}

/**
 * 表格列定义
 */
export function useFileTableColumns() {
  return [
    { type: 'checkbox' as const, width: 50, fixed: 'left' as any },
    {
      field: 'name',
      title: $t('file.fileName'),
      minWidth: 200,
      fixed: 'left' as any,
      slots: { default: 'nameSlot' },
    },
    {
      field: 'extension',
      title: $t('file.fileType'),
      width: 100,
      slots: { default: 'typeSlot' },
    },
    {
      field: 'length',
      title: $t('file.fileSize'),
      width: 120,
      slots: { default: 'sizeSlot' },
    },
    {
      field: 'bucket',
      title: $t('file.bucket'),
      width: 140,
      slots: { default: 'bucketSlot' },
    },
    {
      field: 'serverNodeId',
      title: $t('file.serverNode'),
      width: 150,
      slots: { default: 'nodeSlot' },
    },
    {
      field: 'createTime',
      title: $t('common.createTime'),
      width: 180,
      formatter: ({ cellValue }: any) => {
        return cellValue
          ? new Date(cellValue).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-';
      },
    },
    {
      field: 'expires',
      title: '过期时间',
      width: 180,
      formatter: ({ cellValue }: any) => {
        return cellValue
          ? new Date(cellValue).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-';
      },
    },
    {
      field: 'action',
      title: $t('common.action.label'),
      width: 180,
      align: 'center',
      fixed: 'right' as any,
      slots: { default: 'actionSlot' },
    },
  ];
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * 判断文件是否支持预览
 */
export function isSupportPreview(extension: string): boolean {
  const info = getFileTypeInfo(extension);
  // 支持图片和视频预览
  return info.value === 'IMAGE' || info.value === 'VIDEO';
}
