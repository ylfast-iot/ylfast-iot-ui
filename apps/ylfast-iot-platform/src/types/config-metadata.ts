import type { DataType, DataTypeDef, Recordable, Rule } from './data-type';

export interface ConfigMetadata {
  /**
   * 配置名称
   */
  name: string;
  /**
   * 描述
   */
  description?: string;
  /**
   * 文档信息
   */
  document?: string;
  /**
   * 配置范围
   */
  scopes?: string[];

  /**
   * 扩展配置
   */
  expands?: Recordable;
  /**
   * 配置属性定义
   */
  properties: ConfigPropertyMetadata[];
}

export interface ConfigPropertyMetadata {
  /**
   * 属性id
   */
  property: string;
  /**
   * 属性名称
   */
  name?: string;
  /**
   * 属性描述
   */
  description?: string;
  /**
   * 数据类型
   */
  type: PropertyValueType;

  /**
   * 扩展配置 (Keep this for compatibility or other extra props not in type.expands)
   */
  expands?: Recordable;
}

export interface PropertyValueType extends DataTypeDef {
  type: DataType;
  expands?: {
    [key: string]: any;
    componentProps?: Record<string, any>; // 组件属性
    configMetadata?: ConfigMetadata; // 嵌套对象配置
    defaultValue?: any; // 默认值
    disabled?: boolean; // 是否禁用
    ifShow?: boolean; // 是否显示
    linkageProperty?: string; // 属性联动
    linkagePropertyBooleanMapConfig?: {
      // key为属性标识 value为联动配置
      [key: string]: ConfigMetadata | ConfigPropertyMetadata | null;
    }; // 布尔映射
    linkagePropertyEnumMapConfig?: {
      // key为属性标识 value为联动配置
      [key: string]: ConfigMetadata | ConfigPropertyMetadata | null;
    }; // 属性联动枚举映射
    maxLength?: number; // 最大长度
    required?: boolean; // 是否必填
    rules?: Rule | Rule[]; // 表单验证规则
    span?: number; // 栅格占位
  };
  [key: string]: any;
}
