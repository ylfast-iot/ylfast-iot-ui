import type { DefineComponent } from 'vue';

import type { QueryParamEntity, Term } from '#/adapter';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { PagerResult } from '#/api/basic';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

export interface SelectorQueryApi<T = any> {
  (
    params: QueryParamEntity,
  ): Promise<PagerResult<T>> | { data: T[]; total: number };
}

export interface SelectorEchoApi<T = any, K = any> {
  (ids: K[]): Promise<T[]> | T[];
}

/**
 * 选择器对外暴露的 Action 方法
 */
export interface SelectorActionType<T = any> {
  /** 获取当前选中行 */
  getSelection: () => T[];
  /** 清空选中 */
  clearSelection: () => void;
  /** 设置选中行 */
  setSelection: (rows: T[]) => void;
  /** 设置显示模式 (仅支持聚合组件) */
  setMode?: (mode: 'card' | 'table') => void;
  /** 打开弹窗 (仅支持弹窗组件) */
  open?: (options?: any) => Promise<{ rows: T[]; value: string | string[] }>;
  /** 关闭弹窗 (仅支持弹窗组件) */
  close?: () => void;
}

/**
 * 业务选择器基础属性 (供外部调用者使用)
 */
export interface BaseSelectorProps<T = any> {
  /** 禁用状态 */
  disabled?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 隐藏触发器 (Tag展示区) */
  hideTrigger?: boolean;
  /** 是否多选 */
  multiple?: boolean;
  /** 值 (ID 或 ID数组) */
  value?: number | number[] | string | string[];
  /** 默认选中的行数据 */
  defaultSelectedRows?: T[];
  /** 初始显示模式 */
  displayMode?: 'card' | 'table';
  /** 是否显示分页 */
  showPager?: boolean;
  /** 是否显示搜索表单 */
  showSearchForm?: boolean;
  /** 查询前置拦截 */
  beforeFetch?: (
    params: QueryParamEntity,
  ) => Promise<QueryParamEntity> | QueryParamEntity;
  /** 外部传入的查询条件 */
  paramsTerms?: Term[];
  /** 查询后置拦截 */
  afterFetch?: (result: {
    data: T[];
    total: number;
  }) => Promise<{ data: T[]; total: number }> | { data: T[]; total: number };
}

/**
 * 通用选择器完整属性 (内部实现使用)
 */
export interface CommonSelectorProps<T = any> extends BaseSelectorProps<T> {
  /** 查询 API */
  queryApi?: SelectorQueryApi<T>;
  /** 回显 API */
  echoApi?: SelectorEchoApi<T>;
  /** 静态数据源 */
  dataSource?: T[];
  /** ID 字段名 */
  idField?: string;
  /** 名称字段名 */
  nameField?: string;
  /** 弹窗标题 */
  modalTitle?: string;
  /** 搜索表单配置 */
  searchFormSchemas?: YlDcFormSchema[];
  /** 表格列配置 */
  tableColumns?: VxeGridProps['columns'];
  /** 搜索表单更多按钮 */
  showMoreButton?: boolean;
}

/**
 * Selector Hook 的统一返回格式
 */
export type SelectorHookResult<T = any, M = SelectorActionType<T>> = readonly [
  DefineComponent<any, any, any>,
  M,
];
