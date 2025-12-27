/**
 * 单个消息的多语言配置
 * 例如: { "zh_CN": "首页", "en_US": "Home", "en": "Home" }
 */
export type I18nMessage = Record<string, string>;

/**
 * 完整的国际化数据
 * 例如: { "name": { "zh_CN": "名称", "en_US": "Name" } }
 */
export type I18nMessagesData = Record<string, I18nMessage>;

/**
 * 表格数据行类型（用于内部展示）
 */
export interface I18nMessageRow {
  key: string;
  id: string; // 用于 table 的 rowKey
  translations: I18nMessage;
}

/**
 * 组件 Props
 */
export interface YlI18nMessagesProps {
  /**
   * 双向绑定的数据
   */
  value?: I18nMessagesData;
  modelValue?: I18nMessagesData;

  /**
   * 支持的语言列表
   * @default ['zh_CN', 'en_US', 'en']
   */
  languages?: string[];

  /**
   * 组件大小
   * @default 'middle'
   */
  size?: 'large' | 'middle' | 'small';

  /**
   * 只读模式
   * @default false
   */
  readonly?: boolean;

  /**
   * 是否显示工具栏（添加键、导入导出等）
   * @default true
   */
  showToolbar?: boolean;

  /**
   * 表格高度（支持数字或字符串，如 '400px'）
   */
  height?: number | string;

  /**
   * 是否显示边框
   * @default true
   */
  bordered?: boolean;

  /**
   * 注册回调
   */
  onRegister?: (action: YlI18nMessagesActionType) => void;

  /**
   * 值变化回调
   */
  onChange?: (value: I18nMessagesData) => void;

  /**
   * update:modelValue 事件
   */
  'onUpdate:modelValue'?: (value: I18nMessagesData) => void;
}

/**
 * 组件暴露的方法
 */
export interface YlI18nMessagesActionType {
  /**
   * 设置组件属性
   */
  setProps: (props: Partial<YlI18nMessagesProps>) => Promise<void>;

  /**
   * 获取当前值
   */
  getValue: () => I18nMessagesData;

  /**
   * 设置值
   */
  setValue: (value: I18nMessagesData) => Promise<void>;

  /**
   * 添加新键
   */
  addKey: (key: string, translations?: I18nMessage) => Promise<void>;

  /**
   * 删除键
   */
  removeKey: (key: string) => Promise<void>;

  /**
   * 更新键名
   */
  updateKey: (oldKey: string, newKey: string) => Promise<void>;

  /**
   * 更新翻译值
   */
  updateTranslation: (
    key: string,
    language: string,
    value: string,
  ) => Promise<void>;

  /**
   * 添加语言
   */
  addLanguage: (language: string) => Promise<void>;

  /**
   * 删除语言
   */
  removeLanguage: (language: string) => Promise<void>;

  /**
   * 导入数据
   */
  importData: (data: I18nMessagesData) => Promise<void>;

  /**
   * 导出数据
   */
  exportData: () => I18nMessagesData;

  /**
   * 清空所有数据
   */
  clear: () => Promise<void>;
}

/**
 * useYlI18nMessages Hook 返回类型
 */
export type UseYlI18nMessagesReturnType = [
  (instance: YlI18nMessagesActionType) => void,
  YlI18nMessagesActionType,
];
