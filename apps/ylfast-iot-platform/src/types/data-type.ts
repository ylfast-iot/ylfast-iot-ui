import type { RuleObject } from 'ant-design-vue/es/form';

import type { PropertyMetadata } from './metadata';

export type Recordable<T = any> = Record<string, T>;

export type DataType =
  | 'ARRAY'
  | 'BOOLEAN'
  | 'DATE'
  | 'DOUBLE'
  | 'ENUM'
  | 'FILE'
  | 'FLOAT'
  | 'GEO'
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

// 地理位置类型
export interface GeoTypeDef extends DataTypeDef {
  latProperty: string; // 精度字段
  lngProperty: string; // 纬度字段
}

// 文件类型
export interface FileTypeDef extends DataTypeDef {
  bodyType: 'base64' | 'url'; // 文件类型
}

// 单位
export type Unit = {
  description: string;
  id: string;
  name: string;
  symbol: string;
};

// 布尔类型
export interface BooleanTypeDef extends DataTypeDef {
  trueText?: string; // 为true时的文本，默认 ‘是’
  falseText?: string; // 为false时的文档，默认‘否’
  trueValue?: string; // 为true时的值 ，默认 ‘true’
  falseValue?: string; // 为false时的值，默认 ‘false’
  valueType?: 'BOOLEAN' | 'NUMBER' | 'STRING'; // 值类型

  // 旧版本定义方式（兼容）
  boolMap?: {
    [key in 'false' | 'true']: {
      name: string; // 文本名称
      value: any; // 文本值
    };
  };
}

// 日期类型
export interface DateTypeDef extends DataTypeDef {
  date: {
    format: string; // 格式化 ， timestamp | 标准格式
    isRange: boolean; // 是否范围组件，默认false
    mode: 'date' | 'datetime' | 'decade' | 'month' | 'time' | 'year'; // datetime 显示日期 + 时间，date 只显示日期, .....其他
    valueType: 'LONG' | 'STRING'; // 后端返回的真实值类型 LONG = 时间戳, STRING = 字符串
  };
}

// 对象类型
export type ObjectProperty = {
  [key: string]: any;
  // 是否必填 默认false
  required?: boolean;
} & PropertyMetadata;
export interface ObjectDef extends DataTypeDef {
  // 对象的属性定义列表
  object: ObjectProperty[];
}

// 数组类型
export interface ArrayDef extends DataTypeDef {
  /**
   * 数组元素类型 (兼容之前的版本)
   * @deprecated
   * @see elementType
   */
  array: DataTypeDef;

  /**
   * 元素类型
   */
  elementType: DataTypeDef;
}

// 数字类型
export interface NumberTypeDef extends DataTypeDef {
  unit?: string; // 单位 (存储Unit.id)
  scale?: number; // 缩放
  max?: number; // 最大值
  min?: number; // 最小值
}

// 字符类型
export interface StringTypeDef extends DataTypeDef {
  maxLength?: number; // 字符串最大长度
}

// 枚举
export type EnumItem = {
  description?: string; // 描述
  label?: string; // 枚举标签
  propertyValueType: DataTypeDef; // 枚举值类型
  value: any; // 枚举值
};
// 枚举类型
export type EnumTypeDef = {
  elementValueType: DataTypeDef; // 元素数据类型类型
  enums: EnumItem[]; // 枚举项
  multi: boolean; // 是否多个枚举（一般用于渲染多选的枚举组件）
} & DataTypeDef;
