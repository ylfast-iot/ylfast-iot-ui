export interface BasicModel {
  id?: string;
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
