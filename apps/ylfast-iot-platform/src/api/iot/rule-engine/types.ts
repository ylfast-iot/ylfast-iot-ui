import type { Term } from '#/adapter';

/**
 * 国际化描述结构。
 */
export interface I18nSpec {
  /** 国际化编码 */
  code?: string;
  /** 默认文案 */
  defaultMessage?: unknown;
  /** 嵌套国际化参数 */
  args?: I18nSpec[];
}

/**
 * 条件类型定义。
 */
export interface SceneTermType {
  /** 类型标识 */
  id: string;
  /** 类型名称 */
  name: string;
}

/**
 * 对象关系描述。
 */
export interface RelationSpec {
  /** 关系定义标识 */
  relation?: string;
  /** 关系目标对象类型 */
  objectType?: string;
  /** 关系方向 */
  direction?: string;
}

/**
 * 变量关联对象描述。
 */
export interface VariableObjectSpec {
  /** 对象类型 */
  objectType?: string;
  /** 对象 ID */
  objectId?: string;
  /** 关系描述 */
  related?: RelationSpec;
  /** 对象来源 */
  objectSource?: VariableSource;
}

/**
 * 动态变量来源描述。
 */
export interface VariableSource {
  /** 来源类型 */
  source?: 'fixed' | 'relation' | 'upper';
  /** 固定值 */
  value?: unknown;
  /** 上游变量键 */
  upperKey?: string;
  /** 关系对象描述 */
  relation?: VariableObjectSpec;
  /** 额外配置 */
  options?: Record<string, unknown>;
}

/**
 * 设备选择值。
 */
export interface SelectorValue {
  /** 实际值 */
  value?: unknown;
  /** 展示名称 */
  name?: string;
}

/**
 * 设备选择器描述。
 */
export interface DeviceSelectorSpec extends VariableSource {
  /** 选择器标识 */
  selector: string;
  /** 选择器值列表 */
  selectorValues?: SelectorValue[];
}

/**
 * 定时配置。
 */
export interface TimerSpec {
  /** 触发方式 */
  trigger?: 'cron' | 'month' | 'multi' | 'week';
  /** 日程标签 */
  scheduleTags?: string[];
  /** Cron 表达式 */
  cron?: string;
  /** 周期范围 */
  when?: number[];
  /** 执行模式 */
  mod?: 'once' | 'period';
  /** 单个周期配置 */
  period?: TimerPeriod;
  /** 多个周期配置 */
  periods?: TimerPeriod[];
  /** 单次执行配置 */
  once?: TimerOnce;
  /** 组合触发配置 */
  multi?: TimerMulti;
}

/**
 * 单次定时配置。
 */
export interface TimerOnce {
  /** 执行时间 */
  time: string;
}

/**
 * 周期定时配置。
 */
export interface TimerPeriod {
  /** 开始时间 */
  from?: string;
  /** 结束时间 */
  to?: string;
  /** 间隔值 */
  every: number;
  /** 间隔单位 */
  unit?: 'hours' | 'minutes' | 'seconds';
}

/**
 * 组合定时配置。
 */
export interface TimerMulti {
  /** 子定时配置 */
  spec?: TimerSpec[];
  /** 组合关系 */
  type?: 'and' | 'or';
  /** 最小触发时间间隔 */
  timeSpanSecond?: number;
}

/**
 * 设备触发操作参数。
 */
export interface FunctionParameter {
  /** 参数名称 */
  name?: string;
  /** 参数值 */
  value?: unknown;
}

/**
 * 设备触发操作描述。
 */
export interface DeviceOperation {
  /** 操作类型 */
  operator:
    | 'invokeFunction'
    | 'offline'
    | 'online'
    | 'readProperty'
    | 'reportEvent'
    | 'reportProperty'
    | 'writeProperty';
  /** 延时执行配置 */
  timer?: TimerSpec;
  /** 事件标识 */
  eventId?: string;
  /** 读取属性列表 */
  readProperties?: string[];
  /** 写属性参数 */
  writeProperties?: Record<string, unknown>;
  /** 功能标识 */
  functionId?: string;
  /** 功能参数 */
  functionParameters?: FunctionParameter[];
}

/**
 * 防抖与抑制配置。
 */
export interface ShakeLimit {
  /** 是否启用 */
  enabled?: boolean;
  /** 时间窗口 */
  time?: number;
  /** 阈值 */
  threshold?: number;
  /** 是否连续触发 */
  continuous?: boolean;
  /** 是否优先告警 */
  alarmFirst?: boolean;
  /** 是否优先输出 */
  outputFirst?: boolean;
  /** 是否滚动计算 */
  rolling?: boolean;
}

/**
 * 场景触发器描述。
 */
export interface SceneTrigger {
  /** 触发器类型 */
  type: string;
  /** 防抖配置 */
  shakeLimit?: ShakeLimit;
  /** 设备触发配置 */
  device?: DeviceTrigger;
  /** 定时触发配置 */
  timer?: TimerTrigger;
  /** 自定义触发配置 */
  configuration?: Record<string, unknown>;
}

/**
 * 设备触发配置。
 */
export interface DeviceTrigger extends DeviceSelectorSpec {
  /** 产品 ID */
  productId: string;
  /** 设备操作配置 */
  operation: DeviceOperation;
}

/**
 * 定时触发配置。
 */
export type TimerTrigger = TimerSpec;

/**
 * 通知动作配置。
 */
export interface NotifyAction {
  /** 通知类型 */
  notifyType: string;
  /** 通知器 ID */
  notifierId: string;
  /** 模板 ID */
  templateId: string;
  /** 模板变量 */
  variables?: Record<string, unknown>;
}

/**
 * 延时动作配置。
 */
export interface DelayAction {
  /** 延时时长 */
  time: number;
  /** 时间单位 */
  unit?: 'hours' | 'minutes' | 'seconds';
}

/**
 * 设备动作配置。
 */
export interface DeviceAction extends DeviceSelectorSpec {
  /** 产品 ID */
  productId: string;
  /** 设备消息体 */
  message?: Record<string, unknown>;
}

/**
 * 告警动作配置。
 */
export interface AlarmAction {
  /** 告警动作模式 */
  mode?: 'relieve' | 'trigger';
}

/**
 * 场景动作描述。
 */
export interface SceneAction {
  /** 执行器标识 */
  executor: string;
  /** 通知动作配置 */
  notify?: NotifyAction;
  /** 延时动作配置 */
  delay?: DelayAction;
  /** 设备动作配置 */
  device?: DeviceAction;
  /** 告警动作配置 */
  alarm?: AlarmAction;
  /** 输出过滤条件 */
  terms?: Term[];
  /** 自定义执行器配置 */
  configuration?: Record<string, unknown>;
  /** 扩展信息 */
  options?: Record<string, unknown>;
  /** 动作 ID */
  actionId?: number;
}

/**
 * 分支动作组。
 */
export interface SceneActions {
  /** 是否并行执行 */
  parallel?: boolean;
  /** 动作列表 */
  actions?: SceneAction[];
}

/**
 * 场景条件分支。
 */
export interface SceneConditionAction {
  /** 分支条件 */
  when?: Term[];
  /** 防抖配置 */
  shakeLimit?: ShakeLimit;
  /** 命中后的动作组 */
  then?: SceneActions[];
  /** 是否仍然继续执行 */
  executeAnyway?: boolean;
  /** 分支 ID */
  branchId?: number;
  /** 分支名称 */
  branchName?: string;
  /** 分支扩展配置 */
  options?: Record<string, unknown>;
}

/**
 * 条件描述结构。
 */
export interface TermSpec {
  /** 列标识 */
  column?: string;
  /** 展示国际化编码 */
  displayCode?: I18nSpec;
  /** 展示名称 */
  displayName?: string;
  /** 条件类型 */
  termType?: string;
  /** 条件关系 */
  type?: 'and' | 'or';
  /** 期望值 */
  expected?: unknown;
  /** 实际值 */
  actual?: unknown;
  /** 是否匹配 */
  matched?: boolean;
  /** 条件说明 */
  description?: string;
  /** 子条件 */
  children?: TermSpec[];
  /** 选项配置 */
  options?: string[];
  /** 期望值是否表达式 */
  expectIsExpr?: boolean;
  /** 是否物模型字段 */
  metadata?: boolean;
  /** 触发条件描述 */
  triggerSpec?: I18nSpec;
  /** 实际触发描述 */
  actualSpec?: I18nSpec;
}

/**
 * 简化数据类型描述。
 */
export interface MetadataDataType {
  /** 类型 ID */
  id?: string;
  /** 类型分类 */
  type?: string;
  /** 类型名称 */
  name?: string;
  /** 类型说明 */
  description?: string;
  /** 扩展配置 */
  expands?: Record<string, unknown>;
}

/**
 * 简化属性元数据。
 */
export interface SimplePropertyMetadata {
  /** 值类型 */
  valueType?: MetadataDataType;
  /** 属性标识 */
  id?: string;
  /** 属性名称 */
  name?: string;
  /** 属性说明 */
  description?: string;
  /** 扩展配置 */
  expands?: Record<string, unknown>;
  /** 来源描述 */
  source?: Record<string, string>;
}

/**
 * 函数描述。
 */
export interface FunctionInfo {
  /** 函数 ID */
  id?: string;
  /** 函数名称 */
  name?: string;
  /** 输出类型 */
  outputType?: MetadataDataType;
  /** 参数列表 */
  args?: SimplePropertyMetadata[];
}

/**
 * 属性指标描述。
 */
export interface PropertyMetric {
  /** 指标 ID */
  id: string;
  /** 指标名称 */
  name: string;
  /** 指标值 */
  value?: unknown;
  /** 是否范围值 */
  range?: boolean;
  /** 扩展配置 */
  expands?: Record<string, unknown>;
}

/**
 * 设备选择器支持信息。
 */
export interface SelectorInfo {
  /** 选择器 ID */
  id: string;
  /** 选择器名称 */
  name: string;
  /** 选择器说明 */
  description?: string;
}

/**
 * 条件列描述。
 */
export interface TermColumn {
  /** 子列 */
  children?: TermColumn[];
  /** 列编码 */
  code?: string;
  /** 描述编码 */
  codeDesc?: string;
  /** 条件列标识 */
  column: string;
  /** 数据类型 */
  dataType?: string;
  /** 描述 */
  description?: string;
  /** 全名 */
  fullName?: string;
  /** 全名国际化描述 */
  fullNameCode?: I18nSpec;
  /** 支持函数 */
  functions?: FunctionInfo[];
  /** 是否元数据列 */
  metadata?: boolean;
  /** 元数据层级名称 */
  metadataHierarchyNames?: string[];
  /** 支持指标 */
  metrics?: PropertyMetric[];
  /** 列名称 */
  name: string;
  /** 枚举选项 */
  options?: PropertyMetric[];
  /** 扩展配置 */
  others?: Record<string, unknown>;
  /** 支持的条件类型 */
  termTypes?: SceneTermType[];
}

/**
 * 场景变量描述。
 */
export interface Variable {
  /** 子变量 */
  children?: Variable[];
  /** 变量编码 */
  code?: string;
  /** 对应列 */
  column?: string;
  /** 描述 */
  description?: string;
  /** 全名 */
  fullName?: string;
  /** 全名国际化描述 */
  fullNameCode?: I18nSpec;
  /** 变量 ID */
  id: string;
  /** 是否元数据变量 */
  metadata?: boolean;
  /** 变量名称 */
  name: string;
  /** 扩展配置 */
  options?: Record<string, unknown>;
  /** 支持的条件类型 */
  termTypes?: SceneTermType[];
  /** 变量类型 */
  type?: string;
}
