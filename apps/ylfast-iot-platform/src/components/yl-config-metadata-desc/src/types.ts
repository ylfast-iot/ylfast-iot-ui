import type { ConfigMetadata } from '#/types/config-metadata';
import type { Recordable } from '#/types/data-type';

/**
 * 组件对外暴露的方法接口
 */
export interface YlConfigMetadataDescActionType {
  /**
   * 设置组件属性
   */
  setProps: (props: Partial<YlConfigMetadataDescProps>) => void;
  /**
   * 切换编辑模式
   */
  toggleEditMode: () => void;
  /**
   * 设置编辑模式
   */
  setEditMode: (mode: boolean) => void;
  /**
   * 验证表单（仅编辑模式）
   */
  validate: () => Promise<any>;
  /**
   * 重置字段（仅编辑模式）
   */
  resetFields: () => Promise<void>;
  /**
   * 设置字段值
   */
  setFieldsValue: (values: Recordable) => void;
  /**
   * 获取字段值
   */
  getFieldsValue: () => Recordable;
}

/**
 * 组件 Props 接口
 */
export interface YlConfigMetadataDescProps {
  /**
   * 边框
   */
  bordered?: boolean;
  /**
   * 列数配置
   */
  column?: number | Record<string, number>;
  /**
   * 布局方式
   */
  layout?: 'horizontal' | 'vertical';
  /**
   * 大小
   */
  size?: 'default' | 'middle' | 'small';
  /**
   * 标题
   */
  title?: string;

  /**
   * 配置元数据
   */
  metadata?: ConfigMetadata | ConfigMetadata[];
  /**
   * 数据模型
   */
  model?: Recordable;
  /**
   * v-model 支持
   */
  modelValue?: Recordable;
  /**
   * 是否为编辑模式
   * @default false
   */
  editMode?: boolean;
  /**
   * 是否显示编辑按钮
   * @default true
   */
  showEditButton?: boolean;
  /**
   * 编辑按钮文本
   */
  editButtonText?: string;
  /**
   * 取消按钮文本
   */
  cancelButtonText?: string;
  /**
   * 保存按钮文本
   */
  saveButtonText?: string;
  /**
   * 是否嵌套（内部使用）
   */
  isNested?: boolean;
  /**
   * 是否隐藏根标题
   */
  hideRootHeader?: boolean;
  /**
   * 是否隐藏嵌套标题
   */
  hideNestedHeader?: boolean;
}
