import type { Component } from 'vue';

import type { ComponentType } from '#/adapter/component/components';
import type { Term, TermType } from '#/adapter/hsweb/QueryParams';

export type ConditionType = TermType;

type LocalStorageConf = {
  storageKey: string;
};

export type YlDcFormCondition = {
  column: string;
  key: string;
  termType: TermType;
  type: 'and' | 'or';
  value: any;
};

export type YlDcFormGroup = {
  conditions: YlDcFormCondition[];
  key: string;
  type: 'and' | 'or';
};

export type DynamicCondition = {
  groups: YlDcFormGroup[];
  key: string;
  name: string;
};

type ApiStorageConf = {
  delApi: (key: string) => Promise<any>;
  getAllApi: () => Promise<DynamicCondition[]>;
  getApi: (key: string) => Promise<DynamicCondition>;
  // api请求结果字段 支持 xx.xx.xx
  resultField: string;
  saveApi: (condition: DynamicCondition) => Promise<any>;
  updateApi: (condition: DynamicCondition) => Promise<any>;
};

export type ConditionStorageOption = {
  conf: ApiStorageConf | LocalStorageConf;
  mode: 'api' | 'localstorage';
};

export interface YlDcFormSchema {
  field: string;
  label: string;
  defaultValue?: any;
  // 支持的条件类型
  termTypes?: TermType[];
  // 条件类型对应的组件 优先级高于 component
  termTypeComponents?: {
    [key in ConditionType]?: {
      component: ComponentType;
      componentProps?: Record<string, any>;
    };
  };
  // 所有条件共用的组件
  component?: ComponentType;
  // 所有条件共用的组件属性
  componentProps?: Record<string, any>;
  // 格式化值
  valueFormatter?: (value: any) => any;
}

export interface YlDcFormProps {
  terms?: Term[];
  // 渲染搜索表单schema
  formSchemas: YlDcFormSchema[];
  // 大小
  size?: 'large' | 'middle' | 'small';
  // 条件存储方式 本地、远程api
  storeOption?: ConditionStorageOption;
  // 是否显示筛选更多按钮
  showMoreButton?: boolean;
  // 布局选项
  layoutOption?: {
    // 响应式配置
    breakpoints?: {
      lg?: number; // ≥ 992px
      md?: number; // ≥ 768px
      sm?: number; // ≥ 576px
      xl?: number; // ≥ 1200px
      xs?: number; // < 576px
      xxl?: number; // ≥ 1600px
    };
    cols?: number;
  };

  // 事件
  onRegister?: (action: YlDcFormActionType) => void;
  onSave?: (terms: Term[]) => void;
  onSearch?: (terms: Term[]) => void;
  onReset?: (terms: Term[]) => void;

  /**
   * 容器变化事件，一般用于其他组件当高度变化后需要重新resize 的场景
   */
  onResize?: (data?: any) => void;
}

export interface YlDcFormActionType {
  // 搜索
  search: () => Promise<void>;
  // 保存
  save: () => Promise<void>;
  setFieldsValue: <T>(values: T) => Promise<void>;
  resetFields: () => Promise<void>;
  getFieldsValue: () => Record<string, any>;
  clearValidate: (name?: string | string[]) => Promise<void>;
  updateSchema: (
    data: Partial<YlDcFormSchema> | Partial<YlDcFormSchema>[],
  ) => Promise<void>;
  resetSchema: (
    data: Partial<YlDcFormSchema> | Partial<YlDcFormSchema>[],
  ) => Promise<void>;
  setProps: (props: Partial<YlDcFormProps>) => Promise<void>;
  removeSchemaByField: (field: string | string[]) => Promise<void>;
  appendSchemaByField: (
    schema: YlDcFormSchema,
    prefixField: string | undefined,
    first?: boolean | undefined,
  ) => Promise<void>;
  // 条件管理
  saveCondition: (name: string) => Promise<void>;
  loadCondition: (key: string) => Promise<void>;
  deleteCondition: (key: string) => Promise<void>;
  getAllConditions: () => Promise<DynamicCondition[]>;
}

export type UseYlDcFormReturnType = [Component, YlDcFormActionType];
