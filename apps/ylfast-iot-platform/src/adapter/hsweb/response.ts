/**
 * Hsweb 响应数据适配器
 */

import type { HswebPageResponse, HswebResponse } from './types';

/**
 * 适配 Hsweb 响应格式到 Vben 标准格式
 * Hsweb: { status, message, result }
 * Vben: { code, data, message }
 */
export function adaptHswebResponse<T = any>(
  hswebResponse: HswebResponse<T>,
): {
  code: number;
  data: T;
  message?: string;
} {
  const isSuccess = hswebResponse.status === 200;
  return {
    // Vben 成功状态码为 0
    code: isSuccess ? 0 : hswebResponse.status || -1,
    data: hswebResponse.result as T,
    message: hswebResponse.message,
  };
}

/**
 * 适配 Hsweb 分页响应格式到 Vben/VxeTable 格式
 * Hsweb: { status, message, result: { data, pageIndex, pageSize, total } }
 * VxeTable: { items, total }
 */
export function adaptHswebPageResponse<T = any>(
  hswebResponse: HswebPageResponse<T>,
): {
  code: number;
  data: {
    items: T[];
    total: number;
  };
  message?: string;
} {
  const isSuccess = hswebResponse.status === 200;
  const result = hswebResponse.result;
  return {
    code: isSuccess ? 0 : hswebResponse.status || -1,
    data: {
      items: result?.data || [],
      total: result?.total || 0,
    },
    message: hswebResponse.message,
  };
}

/**
 * 检查 Hsweb 响应是否成功
 */
export function isHswebSuccess(response: HswebResponse): boolean {
  return response.status === 200;
}

/**
 * 从 Hsweb 响应中提取数据
 */
export function extractHswebData<T = any>(response: HswebResponse<T>): T {
  if (!isHswebSuccess(response)) {
    throw new Error(response.message || '请求失败');
  }
  return response.result as T;
}

/**
 * 从 Hsweb 分页响应中提取数据
 */
export function extractHswebPageData<T = any>(
  response: HswebPageResponse<T>,
): T[] {
  if (!isHswebSuccess(response)) {
    throw new Error(response.message || '请求失败');
  }
  return response.result?.data || [];
}
