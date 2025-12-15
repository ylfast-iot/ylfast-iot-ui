/**
 * 枚举字典接口
 */
export interface EnumDict<T = any> {
  value: T;
  text: string;
  [key: string]: any;
}
