import type { QueryParamEntity } from '#/adapter';
import type { BasicModel, TreeSortSupport } from '#/api/basic';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';

/**
 * @description 产品分类API
 */
export namespace IotProductTypeApi {
  const BASE_URL = '/iot/product/type';

  /**
   * @description 产品分类实体
   */
  export interface ProductType
    extends BasicModel,
      TreeSortSupport<ProductType> {
    /**
     * @description 标识
     */
    key: string;
    /**
     * @description 名称
     */
    name: string;
    /**
     * @description 物模型
     */
    metadata?: string;
    /**
     * @description 说明
     */
    description?: string;
  }

  export const Apis = {
    /**
     * @description 获取全部分类(树结构)
     */
    getAllTree: `${BASE_URL}/_tree`,
    /**
     * @description 获取全部分类
     */
    getAll: `${BASE_URL}`,
  };

  /**
   * @description 基础增删改查接口
   */
  export const basicCrudApis = buildBasicCrudApis<ProductType, string>(
    BASE_URL,
  );
}

/**
 * @description 获取全部分类(树结构)
 * @param query
 */
export function getAllProductTypeTree(query?: QueryParamEntity) {
  return requestClient.get<IotProductTypeApi.ProductType[]>(
    IotProductTypeApi.Apis.getAllTree,
    { params: query },
  );
}

/**
 * @description 获取全部分类(树结构, 带查询条件)
 * @param query
 */
export function getAllProductTypeTreeByQuery(query: QueryParamEntity) {
  return requestClient.post<IotProductTypeApi.ProductType[]>(
    IotProductTypeApi.Apis.getAllTree,
    query,
  );
}

/**
 * @description 获取全部分类（平铺列表）
 * @param query
 */
export function getAllProductType(query?: QueryParamEntity) {
  return requestClient.get<IotProductTypeApi.ProductType[]>(
    IotProductTypeApi.Apis.getAll,
    { params: query },
  );
}
