import type { YlDcFormProps } from '#/components/yl-dc-form';

import { useVbenVxeGrid } from '#/adapter';

export type TableCardMode = 'all' | 'card' | 'table';
export type TableCardSingleMode = Exclude<TableCardMode, 'all'>;

type VxeGridProps<RowType extends Record<string, any>> = Parameters<
  typeof useVbenVxeGrid<RowType>
>[0];

export interface YlVxeTableCardProps<RowType extends Record<string, any> = any>
  extends VxeGridProps<RowType> {
  /**
   * 模式
   * table: 仅表格
   * card: 仅卡片
   * all: 两者都支持（显示切换按钮）
   * @default 'all'
   */
  mode?: TableCardMode;

  /**
   * 当 mode 为 'all' 时的默认模式
   * @default 'table'
   */
  defaultMode?: TableCardSingleMode;

  // --- 卡片专用配置 (Isolated) ---
  cardOptions?: {
    cols?: {
      lg?: number;
      md?: number;
      sm?: number;
      xl?: number;
      xs?: number;
      xxl?: number;
    };
    minWidth?: number;
  };

  /**
   * 搜索表单模式
   * 当 searchFormMode 为 'default' 时的为原始默认模式
   * 为 ‘dc-form’ 时则为动态条件表单
   * @default 'default'
   */
  searchFormMode?: 'default' | 'yl-dc-form';

  /**
   * 默认搜索表单配置选项
   * searchFormMode = ‘default’ 时生效
   */
  formOptions?: VxeGridProps<RowType>['formOptions'];

  /**
   * 动态条件表单配置
   * searchFormMode = ‘dc-form’ 时生效
   */
  ylDcFromOptions?: YlDcFormProps;
}

export interface YlVxeTableCardInstance {
  resize: () => void;
  // ... 其他方法
}
