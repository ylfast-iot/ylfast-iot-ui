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
// 联合类型 将非可选类型/接口变为可选，并制定一个为不可选
export type OmitPartial<T, K extends keyof T> = Omit<Partial<T>, K> &
  Pick<T, K>;
