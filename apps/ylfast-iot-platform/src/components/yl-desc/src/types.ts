import type { DescriptionsProps } from 'ant-design-vue';

import type { Component, CSSProperties, VNode } from 'vue';

export interface YlDescSchema {
  field: string;
  label: string;
  // Span of the item
  span?: number;
  // Show the item or not
  show?: ((data: Record<string, any>) => boolean) | boolean;
  // Custom render
  render?: (
    val: any,
    data: Record<string, any>,
  ) => null | number | string | undefined | VNode;
  // Label style
  labelStyle?: CSSProperties;
  // Content style
  contentStyle?: CSSProperties;
  // Custom slot for label
  labelSlot?: string;
  // Custom slot for content (value)
  slot?: string;
}

// Manually define properties to avoid "Failed to resolve extends base type" error in Vue compiler
export interface YlDescProps {
  // --- DescriptionsProps (Common) ---
  title?: string;
  bordered?: boolean;
  size?: DescriptionsProps['size'];
  column?: DescriptionsProps['column'];
  layout?: DescriptionsProps['layout'];
  colon?: boolean;
  labelStyle?: CSSProperties;
  contentStyle?: CSSProperties;

  // --- Custom Props ---
  // Data object
  data?: Record<string, any>;
  // Schemas
  schemas?: YlDescSchema[];
  // Register callback
  onRegister?: (action: YlDescActionType) => void;
}

export interface YlDescActionType {
  setProps: (props: Partial<YlDescProps>) => Promise<void>;
  setDescProps: (props: Partial<YlDescProps>) => void;
  updateSchema: (
    data: Partial<YlDescSchema> | Partial<YlDescSchema>[],
  ) => Promise<void>;
  resetSchema: (
    data: Partial<YlDescSchema> | Partial<YlDescSchema>[],
  ) => Promise<void>;
  getFieldsValue: () => Record<string, any>;
}

export type UseYlDescReturnType = [Component, YlDescActionType];
