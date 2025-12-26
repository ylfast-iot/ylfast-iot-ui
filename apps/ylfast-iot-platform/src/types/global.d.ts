/**
 * 枚举字典接口
 */
export interface EnumDict<T = any> {
  value: T;
  text: string;
  [key: string]: any;
}

interface ImportMetaEnv {
  readonly VITE_GLOB_WS_URL: string;
}
