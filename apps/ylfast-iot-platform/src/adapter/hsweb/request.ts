/**
 * Hsweb 请求适配器
 */

import type { HswebPageParams, HswebQueryParams } from './types';

/**
 * 适配 VxeTable 分页参数到 Hsweb 格式
 * VxeTable: { page, pageSize, sort }
 * Hsweb: { pageIndex, pageSize, sorts }
 */
export function adaptToHswebPageParams(params: {
  [key: string]: any;
  page?: number;
  pageSize?: number;
  sort?: { field?: string; order?: string };
}): HswebPageParams {
  const { page = 1, pageSize = 10, sort, ...rest } = params;

  const hswebParams: HswebPageParams = {
    // Hsweb 页码从 0 开始，VxeTable 从 1 开始
    pageIndex: page - 1,
    pageSize,
  };

  // 处理排序
  if (sort?.field) {
    hswebParams.sorts = [
      {
        name: sort.field,
        order: (sort.order?.toLowerCase() as 'asc' | 'desc') || 'asc',
      },
    ];
  }

  // 处理其他查询参数
  if (Object.keys(rest).length > 0) {
    const terms: any[] = [];
    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        terms.push({
          column: key,
          termType: 'like', // 默认使用模糊查询，可根据需要调整
          value,
        });
      }
    });
    if (terms.length > 0) {
      hswebParams.terms = terms;
    }
  }

  return hswebParams;
}

/**
 * 构建 Hsweb 查询条件
 */
export function buildHswebTerms(
  filters: Record<string, any>,
  termTypeMap?: Record<string, string>,
): HswebQueryParams['terms'] {
  const terms: any[] = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      terms.push({
        column: key,
        termType: termTypeMap?.[key] || 'like',
        value,
      });
    }
  });

  return terms.length > 0 ? terms : undefined;
}

/**
 * 构建 Hsweb 排序参数
 */
export function buildHswebSorts(
  sortField?: string,
  sortOrder?: 'asc' | 'desc' | string,
): HswebQueryParams['sorts'] {
  if (!sortField) {
    return undefined;
  }

  return [
    {
      name: sortField,
      order: (sortOrder?.toLowerCase() as 'asc' | 'desc') || 'asc',
    },
  ];
}
