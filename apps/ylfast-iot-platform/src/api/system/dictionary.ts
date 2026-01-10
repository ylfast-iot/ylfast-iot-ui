import type { QueryParamEntity } from '#/adapter';
import type { I18nSupport, TreeSortSupport } from '#/api/basic';
import type { EnumDict } from '#/types/global';

import { requestClient } from '#/api/request';

export namespace SystemDictionaryApi {
  export interface Dictionary extends I18nSupport {
    /**
     * 字典id
     */
    id: string;

    /**
     * 字典名称
     */
    name: string;
    /**
     * 分类标识
     * system（系统标识，不可更改）、....
     */
    classified: string;
    describe: string;
    createTime: number;
    creatorId: string;
    /**
     * 状态,0禁用,1启用
     */
    status: number;

    /**
     * 字典项
     */
    items: DictionaryItem[];
  }

  export interface DictionaryItem
    extends EnumDict<string>,
      I18nSupport,
      TreeSortSupport {
    id: string;
    /**
     * 数据字典ID
     * @see Dictionary.id
     */
    dictId: string;

    /**
     *选项名称
     */
    name: string;

    /**
     * 选项值
     */
    value: string;

    /**
     * 文本内容
     */
    text: string;

    /**
     * 值类型
     */
    valueType: string;

    /**
     * 状态,0禁用,1启用
     */
    status: number;
    /**
     * 说明
     */
    describe: string;

    /**
     * 搜索码 用于快速搜索码
     */
    searchCode: string;

    /**
     * 序列号,同一个字典中的选项不能重复,且不能修改.
     */
    ordinal: number;
  }

  export interface DictDefine<T = any> {
    id: string;
    alias: string;
    comments: string;
    items: EnumDict<T>;
  }

  export interface ClassDictDefine extends DictDefine {
    /**
     * 字段
     */
    filed: string;
  }
}

// Dictionary APIs
export const saveDictionary = (params: SystemDictionaryApi.Dictionary) =>
  requestClient.request<SystemDictionaryApi.Dictionary>('/dictionary', {
    data: params,
    method: 'PATCH',
  });

export const queryDictionaryList = (params: QueryParamEntity) =>
  requestClient.post<SystemDictionaryApi.Dictionary[]>(
    '/dictionary/_query/no-paging',
    params,
  );

export const deleteDictionary = (id: string) =>
  requestClient.delete<boolean>(`/dictionary/${id}`);

/**
 * 查询字典详情(POST)
 * @param params
 */
export const postQueryDictionaryDetail = (params: QueryParamEntity) =>
  requestClient.post<SystemDictionaryApi.Dictionary[]>(
    '/dictionary/detail/_query',
    params,
  );
/**
 * 查询字典详情(GET)
 * @param params
 */
export const getQueryDictionaryDetail = (params: QueryParamEntity) =>
  requestClient.get<SystemDictionaryApi.Dictionary[]>(
    '/dictionary/detail/_query',
    {
      params,
    },
  );

/**
 * 获取数据字段的所有选项
 * @param id 字典id
 */
export const getItemDefineById = <T = any>(id: string) => {
  return requestClient.get<EnumDict<T>[]>(`/dictionary/${id}/items`);
};

/**
 * 获取全部数据字典
 */
export const getAllDict = () =>
  requestClient.get<
    (SystemDictionaryApi.ClassDictDefine | SystemDictionaryApi.DictDefine)[]
  >('/dictionary/_all');

// Dictionary Item APIs
export const saveDictionaryItem = (
  params: SystemDictionaryApi.DictionaryItem,
) =>
  requestClient.request<SystemDictionaryApi.DictionaryItem>(
    '/dictionary-item',
    {
      data: params,
      method: 'PATCH',
    },
  );

export const queryDictionaryItemPost = (params: QueryParamEntity) =>
  requestClient.post<{
    data: SystemDictionaryApi.DictionaryItem[];
    total: number;
  }>('/dictionary-item/_query', params);

export const deleteDictionaryItem = (id: string) =>
  requestClient.delete<boolean>(`/dictionary-item/${id}`);

export const checkDictionaryItemExists = (params: any) =>
  requestClient.post<boolean>('/dictionary-item/_exists', params);
