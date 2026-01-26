/**
 * TransparentParser组件的Props类型
 */
export interface TransparentParserProps {
  /**
   * 产品ID
   */
  productId?: string;
  /**
   * 设备ID（可选，用于区分产品/设备模式）
   */
  deviceId?: string;
  /**
   * 名称（用于显示标题）
   */
  name?: string;
  /**
   * 默认的Header Key选项
   */
  defaultHeaderKeys?: (DefaultHeaderOption | string)[];
  /**
   * 设备详情对象（用于详情页集成）
   */
  device?: any;
  /**
   * 产品详情对象（用于详情页集成）
   */
  product?: any;
}

/**
 * Header键值对
 */
export interface HeaderKeyValue {
  key: string;
  value: string;
}

export interface DefaultHeaderOption {
  label: string;
  value: string;
}
