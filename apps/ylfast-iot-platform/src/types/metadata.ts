import type { DataTypeDef, ObjectProperty } from './data-type';

// 元信息
export interface Metadata {
  name: string;
  id: string;
  description?: string;
  expands?: {
    [key: string]: any;
  };
  [key: string]: any;
}

// 属性
export interface PropertyMetadata extends Metadata {
  /**
   * 值类型定义
   */
  valueType: DataTypeDef;
}

export interface FunctionMetadata extends Metadata {
  // 功能输入参数定义
  inputParams: ObjectProperty[];
  // 功能输出类型定义
  output: DataTypeDef;
  // 是否异步
  async: boolean;

  expands?: {
    [key: string]: any;
    // 继承至产品
    inheritedProduct?: boolean;
  };
}

export interface EventMetadata extends Metadata {
  // 事件输出类型定义
  output: DataTypeDef;

  expands?: {
    [key: string]: any;
    // 继承至产品
    inheritedProduct?: boolean;
  };
}

export interface DeviceEventMetadata extends EventMetadata {
  // 事件类型
  eventType: {
    /**
     * type == ALARM 时生效 告警级别
     */
    alarmLevel?: string;
    // 事件类型
    type: 'ALARM' | 'SIMPLE';
  };
}

export type DeviceMetadataType =
  | 'events'
  | 'expands'
  | 'functions'
  | 'properties';

// 设备物模型
export interface DeviceMetadata extends Metadata {
  // 设备属性
  properties: DevicePropertyMetadata[];
  // 设备事件
  events: DeviceEventMetadata[];
  // 设备功能
  functions: FunctionMetadata[];

  // 扩展配置
  expands?: {
    [key: string]: any;
    // 属性分组相关
    propertyGroups: {
      // 分组id
      id: string;
      // 分组名称
      name: string;
    }[];
    // 属性映射
    propertyMapping: {
      // key为平台属性id value为原始id
      [key: string]: string;
    };
  };
}

type AccessMode = 'READ' | 'REPORT' | 'WRITE';
type SourceType = 'DEVICE' | 'RULE';

// 设备属性
export interface DevicePropertyMetadata extends PropertyMetadata {
  // 属性来源
  source: {
    accessType: AccessMode[];
    // 規則
    rule?: {
      configuration: {
        convertScripts?: {
          decode: string;
          encode: string;
        };
        scriptEngineType?: 'javascript';
        scriptType?: 'javascript';
      };
      // 模式 高級、简单
      mode: 'advanced' | 'simple';
    };
    type: SourceType;
  };
  // 扩展
  expands: {
    [key: string]: any;

    // 分组相关
    groupId?: string;

    // 继承至产品
    inheritedProduct?: boolean;
    // 前端是否显示当前属性
    propertyValueWebDisplay?: boolean;
    // 属性值存储配置
    storageType?: {
      // 是否忽略存储
      ignore: boolean;
      // 是否存储为json字符串
      'json-string': boolean;
    };
  };
}
