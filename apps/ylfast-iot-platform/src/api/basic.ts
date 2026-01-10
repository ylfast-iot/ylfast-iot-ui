import type { QueryParamEntity } from '#/adapter';

import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

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

export interface ValidateResult {
  /**
   * 是否通过
   */
  passed: boolean;
  /**
   * 原因
   */
  reason?: string;
}

// 通用公共接口
export const BasicApiConstants = {
  delete: {
    /**
     * 根据ID删除
     */
    DELETE_BY_ID: '{id}',
    /**
     * 批量删除 （post body: {ids: [id1, id2, ...]}）
     */
    POST_DELETE_BATCH: 'batch',
  },

  // query
  query: {
    /**
     * GET xx/_query/no-paging?pageIndex=0&pageSize=20&where=name is 张三&orderBy=id desc
     *
     */
    GET_QUERY_NO_PAGING: '_query/no-paging', // 使用GET方式分页动态查询(不返回总数),此操作不返回分页总数,如果需要获取全部数据,请设置参数paging=false

    /**
     *       POST xx/_query/no-paging
     *       {
     *           "pageIndex":0,
     *           "pageSize":20,
     *           "where":"name like 张%", //放心使用,没有SQL注入
     *           "orderBy":"id desc",
     *           "terms":[ //高级条件
     *               {
     *                   "column":"name",
     *                   "termType":"like",
     *                   "value":"张%"
     *               }
     *           ]
     *       }
     */
    POST_QUERY_NO_PAGING: '_query/no-paging', // 使用POST方式分页动态查询(不返回总数),此操作不返回分页总数,如果需要获取全部数据,请设置参数paging=false

    /**
     *      GET xx/_query/no-paging?pageIndex=0&pageSize=20&where=name is 张三&orderBy=id desc
     */
    GET_QUERY: '_query', // 使用GET方式分页动态查询

    /**
     *       POST xx/_query
     *
     *       {
     *           "pageIndex":0,
     *           "pageSize":20,
     *           "where":"name like 张%", //放心使用,没有SQL注入
     *           "orderBy":"id desc",
     *           "terms":[ //高级条件
     *               {
     *                   "column":"name",
     *                   "termType":"like",
     *                   "value":"张%"
     *               }
     *           ]
     *       }
     *
     */
    POST_QUERY: '_query', // 使用POST方式分页动态查询

    /**
     * POST方式动态查询数量.
     *       POST xx/_count
     *
     *       {
     *           "pageIndex":0,
     *           "pageSize":20,
     *           "where":"name like 张%", //放心使用,没有SQL注入
     *           "orderBy":"id desc",
     *           "terms":[ //高级条件
     *               {
     *                   "column":"name",
     *                   "termType":"like",
     *                   "value":"张%"
     *               }
     *           ]
     *       }
     */
    POST_COUNT: '_count',
    /**
     * GET方式动态查询数量.
     *      GET xx/_count?pageIndex=0&pageSize=20&where=name is 张三&orderBy=id desc
     */
    GET_COUNT: '_count',

    /**
     * 使用POST方式判断数据是否存在
     */
    POST_EXISTS: '_exists',
    /**
     * 使用GET方式判断数据是否存在.
     *      GET xx/_exists?where=name is 张三
     */
    GET_EXISTS: '_exists',

    /**
     * 根据ID查询.
     * GET xx/{id}
     */
    GET_BY_ID: '{id}',
  },

  save: {
    // save
    PATCH_SAVE: '', // 保存数据 如果传入了id,并且对应数据存在,则尝试覆盖,不存在则新增.
    POST_INSERT_BATCH: '_batch', // 批量新增数据
    POST_ADD: '', // 新增单个数据,并返回新增后的数据
    // put
    PUT_UPDATE: '{id}', // 根据id更新数据
  },
};

export interface SaveResult {
  added: number;
  updated: number;
  total: number;
}

export interface BasicCrudApis<E = any, K = number | string> {
  /**
   * 批量删除
   * @param ids
   */
  deleteBatch(ids: K[]): Promise<boolean>;

  /**
   * 根据ID删除
   * @param id
   */
  deleteById(id: K): Promise<E>;

  /**
   * 保存数据,如果传入了id,并且对应数据存在,则尝试覆盖,不存在则新增.
   * @param data
   * @returns SaveResult
   */
  patchSave(data: Partial<E>): Promise<SaveResult>;

  /**
   * 批量新增数据
   * @param data
   * @returns 插入数量
   */
  postInsertBatch(data: E[]): Promise<number>;

  /**
   * 新增单个数据,并返回新增后的数据
   * @param data
   * @returns 新增后的数据
   */
  postAdd(data: E): Promise<E>;

  /**
   * 根据ID更新数据
   * @param id
   * @param data
   * @returns 更新后的数据
   */
  putUpdate(id: K, data: Partial<E>): Promise<E>;

  /**
   * 根据ID查询
   * @param id
   * @returns 查询结果
   */
  getById(id: K): Promise<E>;

  /**
   * 分页查询
   * @param params
   */
  getQuery(params: QueryParamEntity): Promise<PagerResult<E>>;

  /**
   * POST方式分页查询
   * @param params
   */
  postQuery(params: QueryParamEntity): Promise<PagerResult<E>>;

  /**
   * 分页查询(不分页)
   * @param params
   */
  getQueryNoPaging(params: QueryParamEntity): Promise<E[]>;

  /**
   * POST方式分页查询(不分页)
   * @param params
   */
  postQueryNoPaging(params: QueryParamEntity): Promise<E[]>;

  /**
   * 查询数量
   * @param params
   */
  getCount(params: QueryParamEntity): Promise<number>;

  /**
   * POST方式查询数量
   * @param params
   */
  postCount(params: QueryParamEntity): Promise<number>;

  /**
   * 判断数据是否存在
   * @param params
   */
  getExists(params: QueryParamEntity): Promise<boolean>;

  /**
   * POST方式判断数据是否存在
   * @param params
   */
  postExists(params: QueryParamEntity): Promise<boolean>;
}

/**
 * 构建基础的增删改查接口
 * @param baseUrl
 */
export function buildBasicCrudApis<E = any, K = number | string>(
  baseUrl: string,
): BasicCrudApis<E, K> {
  return {
    deleteBatch(ids: K | K[]) {
      if (!Array.isArray(ids)) {
        ids = [ids];
      }
      return requestClient.post(
        `${baseUrl}/${BasicApiConstants.delete.POST_DELETE_BATCH}`,
        {
          ids,
        },
      );
    },
    deleteById(id: K) {
      return requestClient.delete(
        parseTemplate(`${baseUrl}/${BasicApiConstants.delete.DELETE_BY_ID}`, {
          id,
        }),
      );
    },
    patchSave(data: Partial<E>) {
      return requestClient.request(
        `${baseUrl}/${BasicApiConstants.save.PATCH_SAVE}`,
        {
          method: 'PATCH',
          data,
        },
      );
    },
    postInsertBatch(data: E[]) {
      return requestClient.post(
        `${baseUrl}/${BasicApiConstants.save.POST_INSERT_BATCH}}`,
        data,
      );
    },
    postAdd(data: E) {
      return requestClient.post(
        `${baseUrl}/${BasicApiConstants.save.POST_ADD}`,
        data,
      );
    },
    putUpdate(id: K, data: Partial<E>) {
      return requestClient.put(
        parseTemplate(`${baseUrl}/${BasicApiConstants.save.PUT_UPDATE}`, {
          id,
        }),
        data,
      );
    },
    getById(id: K) {
      return requestClient.get(
        `${baseUrl}/${BasicApiConstants.query.GET_BY_ID}/${id}`,
      );
    },
    getQuery(params: QueryParamEntity) {
      return requestClient.get(
        `${baseUrl}/${BasicApiConstants.query.GET_QUERY}`,
        {
          params,
        },
      );
    },
    postQuery(params: QueryParamEntity) {
      return requestClient.post(
        `${baseUrl}/${BasicApiConstants.query.POST_QUERY}`,
        params,
      );
    },
    getQueryNoPaging(params: QueryParamEntity) {
      return requestClient.get(
        `${baseUrl}/${BasicApiConstants.query.GET_QUERY_NO_PAGING}`,
        {
          params,
        },
      );
    },
    postQueryNoPaging(params: QueryParamEntity) {
      return requestClient.post(
        `${baseUrl}/${BasicApiConstants.query.POST_QUERY_NO_PAGING}`,
        params,
      );
    },
    getCount(params: QueryParamEntity) {
      return requestClient.get(
        `${baseUrl}/${BasicApiConstants.query.GET_COUNT}`,
        {
          params,
        },
      );
    },
    postCount(params: QueryParamEntity) {
      return requestClient.post(
        `${baseUrl}/${BasicApiConstants.query.POST_COUNT}`,
        params,
      );
    },
    getExists(params: QueryParamEntity) {
      return requestClient.get(
        `${baseUrl}/${BasicApiConstants.query.GET_EXISTS}`,
        {
          params,
        },
      );
    },
    postExists(params: QueryParamEntity) {
      return requestClient.post(
        `${baseUrl}/${BasicApiConstants.query.POST_EXISTS}`,
        params,
      );
    },
  };
}
