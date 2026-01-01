export type ThingModelChangeType =
  | 'events'
  | 'expands'
  | 'functions'
  | 'properties';

export type ThingModelChangeAction =
  | 'add'
  | 'batch-delete'
  | 'copy'
  | 'delete'
  | 'import'
  | 'update';

export interface BeforeChangeContext {
  /** 变更类型：属性、功能、事件或扩展配置 (复数形式) */
  type: ThingModelChangeType;
  /** 执行的动作：新增、更新、删除、批量删除、导入或复制 */
  action: ThingModelChangeAction;
  /** 当前操作涉及的行记录数据（单条或数组），主要用于增、删、改、复制等增量场景 */
  records?: any | any[];
  /** 变更后的完整数据对象，主要用于 JSON 编辑或导入等全量替换场景 */
  value?: any;
}

export type BeforeChangeFn = (
  context: BeforeChangeContext,
) => boolean | Promise<boolean>;

export interface AfterChangeContext extends BeforeChangeContext {
  /** 变更前的完整物模型元数据，用于回退 */
  oldMetadata?: any;
  /** 变更后的完整物模型元数据 */
  newMetadata?: any;
}

export type AfterChangeFn = (
  context: AfterChangeContext,
) => boolean | Promise<boolean>;
