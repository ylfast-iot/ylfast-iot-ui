/**
 * Hsweb 响应类型定义
 */

import type { QueryParamEntity } from '#/adapter';

/**
 * Hsweb 标准响应格式
 */
export interface HswebResponse<T = any> {
  /**
   * 响应状态码 (200 表示成功)
   */
  status: number;

  /**
   * 响应消息
   */
  message?: string;

  /**
   * 实际数据
   */
  result?: T;

  /**
   * 时间戳
   */
  timestamp?: number;
}

/**
 * Hsweb 分页响应格式
 */
export interface HswebPageResponse<T = any> {
  /**
   * 响应状态码 (200 表示成功)
   */
  status: number;

  /**
   * 响应消息
   */
  message?: string;

  /**
   * 分页数据
   */
  result?: {
    /**
     * 当前页数据列表
     */
    data: T[];

    /**
     * 当前页码（从0开始）
     */
    pageIndex: number;

    /**
     * 每页大小
     */
    pageSize: number;

    /**
     * 总记录数
     */
    total: number;
  };

  /**
   * 时间戳
   */
  timestamp?: number;
}

/**
 * Hsweb 分页请求参数
 */
export interface HswebPageParams extends QueryParamEntity {
  [key: string]: any;
}

/**
 * 通用查询参数
 */
export interface HswebQueryParams extends HswebPageParams {
  [key: string]: any;
}
