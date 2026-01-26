import type { Term } from '#/adapter';

export interface YlApiSelectProps {
  /** 绑定值 */
  value?: any;
  /** 是否多选 */
  multiple?: boolean;
  /** 是否允许手动输入 */
  allowInput?: boolean;
  /** API 函数 */
  api?: (arg?: any) => Promise<any>;
  /** API 参数 */
  params?: Record<string, any>;
  /** 查询条件 */
  terms?: Term[];
  /** 结果字段名 */
  resultField?: string;
  /** Label 字段名 */
  labelField?: string;
  /** Value 字段名 */
  valueField?: string;
  /** 占位符 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否为树形选择 */
  isTree?: boolean;
  /** 子节点字段名 */
  childrenField?: string;
  /** 是否允许搜索 */
  allowSearch?: boolean;
  /** 多选时值的格式化分隔符 (如 ",") */
  arrayValueFormat?: string;
}
