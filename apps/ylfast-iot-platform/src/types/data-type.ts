import type { RuleObject } from 'ant-design-vue/es/form';

export type Recordable<T = any> = Record<string, T>;

export type DataType =
  | 'ARRAY'
  | 'BOOLEAN'
  | 'DATE'
  | 'DOUBLE'
  | 'ENUM'
  | 'FLOAT'
  | 'INTEGER'
  | 'LONG'
  | 'OBJECT'
  | 'PASSWORD'
  | 'SHORT'
  | 'STRING';

export type Rule = RuleObject & {
  trigger?: 'blur' | 'change' | ['change', 'blur'];
};

export interface DataTypeDef {
  // 设备类型
  type: DataType;
  // 描述
  description?: string;
  // 扩展配置
  expands?: Recordable;
}

// 单位
export type Unit = {
  description: string;
  id: string;
  name: string;
  symbol: string;
};

// 数字类型
export interface NumberTypeDef extends DataTypeDef {
  unit?: Unit; // 单位
  scale?: number; // 缩放
  max?: number; // 最大值
  min?: number; // 最小值
}

// 浮点
export type FloatTypeDef = DataTypeDef & {
  type: 'FLOAT';
};

// 枚举
export type EnumItem = {
  description?: string; // 描述
  label?: string; // 枚举标签
  propertyValueType: DataTypeDef; // 枚举值类型
  value: any; // 枚举值
};

export type EmunTypeDef = {
  elementValueType: DataTypeDef; // 元素数据类型类型
  enums: EnumItem[]; // 枚举项
  multi: boolean; // 是否多个枚举（一般用于渲染多选的枚举组件）
} & DataTypeDef;
