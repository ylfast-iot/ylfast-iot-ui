type LogicType = 'and' | 'or';

export type Recordable = Record<string, any>;

interface Column {
  name: string;
  opts?: Recordable;
  type?: string;
}

export interface Term {
  // 字段名
  column?: string;
  // 条件值
  value?: any;
  // 多个条件关联类型
  type?: LogicType;
  // 动态条件类型
  termType?: TermType;
  // 拓展选项
  options?: string[];
  // 嵌套条件
  terms?: Array<Term>;
}

export interface SqlTerm extends Term {
  sql: string;
}

export interface Sort extends Column {
  // 排序方式
  order: 'asc' | 'desc';
  // 指定的值优先排序
  value?: any;
}

/**
 * sql 参数对象
 */
export interface Param {
  // 条件
  terms?: Term[];
  // 包含的字段
  includes?: string[];
  // 排除的字段
  excludes?: string[];
}

export interface QueryParam extends Param {
  // 是否分页 （默认true）
  paging?: boolean;
  // 第一页索引 (默认0)
  firstPageIndex?: number;
  // 当前页索引 (默认0)
  pageIndex?: number;
  // 每页数量 (默认25)
  pageSize?: number;
  // 排序字段
  sorts?: Sort[];
  // 上下文参数
  context?: Recordable;
}

export interface QueryParamEntity extends QueryParam {
  // where条件表达式,与terms参数不能共存.语法: name = 张三 and age > 16
  where?: string;
  // orderBy条件表达式,与sorts参数不能共存.语法: age asc,createTime desc
  orderBy?: string;
  // 设置了此值后将不重复执行count查询总数
  total?: number;
  // 使用map方式传递查询条件.与terms参数不能共存.格式: {"name$like":"张三"}
  filter?: Recordable;
  // 是否进行并行分页
  parallelPager?: boolean;
}

export type TermType =
  | 'btw'
  | 'empty'
  | 'eq'
  | 'gt'
  | 'gte'
  | 'in'
  | 'isnull'
  | 'like'
  | 'lt'
  | 'lte'
  | 'nbtw'
  | 'nempty'
  | 'nin'
  | 'nlike'
  | 'not'
  | 'notnull';
