export interface BasicModel {
  id?: string;
  creatorId?: string;
  creatorName?: string;
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
