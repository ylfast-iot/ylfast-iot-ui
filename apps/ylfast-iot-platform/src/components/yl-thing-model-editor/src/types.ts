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
  type: ThingModelChangeType;
  action: ThingModelChangeAction;
  records?: any | any[];
  value?: any;
}

export type BeforeChangeFn = (
  context: BeforeChangeContext,
) => boolean | Promise<boolean>;
