export interface BasicModel {
  id: string;
  creatorId?: string;
  creatorName?: string;
  createTime?: number;
  modifierId?: string;
  modifierName?: string;
  modifyTime?: number;
}

export interface PagerResult<T> {
  pageIndex: number;
  pageSize: number;
  total: number;
  data: T[];
}

export interface I18nSupport {
  i18nMessages: {
    [key: string]: {
      [key: string]: string;
    };
  };
}

export interface TreeSortSupport<T = any> {
  parentId: string;

  /**
   * 树路径
   */
  path: string;

  /**
   * 排序序号
   */
  sortIndex: number;

  /**
   * 树层级
   */
  level: number;

  children: T[];
}
