import type { BasicModel } from '#/api/basic';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace SystemRelationApi {
  export interface RelationEntity extends BasicModel {
    /** 源对象类型 */
    objectType: string;
    /** 源对象名称 */
    objectTypeName: string;
    /** 关系标识 */
    relation: string;
    /** 关系名称 */
    name: string;
    /** 反向关系名称 */
    reverseName?: string;
    /** 目标对象类型 */
    targetType: string;
    /** 目标对象名称 */
    targetTypeName: string;
    /** 说明 */
    description?: string;
    /** 扩展信息 */
    expands?: Record<string, any>;
  }

  export interface ObjectTypeInfo {
    /** 类型ID */
    id: string;
    /** 名称 */
    name: string;
    /** 说明 */
    description?: string;
    /** 可建立关系的其他类型ID */
    relatable?: string[];
  }

  export interface RelatedObjectInfo {
    /** ID */
    id: string;
    /** 名称 */
    name: string;
  }

  export interface RelatedInfo {
    /** 对象ID */
    objectId: string;
    /** 关系标识 */
    relation: string;
    /** 关系名称 */
    relationName: string;
    /** 关系扩展信息 */
    relationExpands?: Record<string, any>;
    /** 关联对象的类型 */
    relatedType: string;
    /** 关联的目标对象列表 */
    related?: RelatedObjectInfo[];
  }

  export interface SaveRelationRequest {
    /** 关系类型 */
    relatedType?: string;
    /** 关系标识 */
    relation: string;
    /** 关系目标列表 */
    related?: RelatedObjectInfo[];
    /** 说明 */
    description?: string;
  }

  export const BASE_URL = '/relation';

  export const Apis = {
    types: `${BASE_URL}/types`,
    typeRelations: `${BASE_URL}/{type}/relations`,
    relatedInfo: `${BASE_URL}/{type}/{id}/related`,
    bind: `${BASE_URL}/{type}/{id}/_bind`,
    validate: `${BASE_URL}/_validate`,
  };

  export const basicCrudApis = buildBasicCrudApis<RelationEntity, string>(
    BASE_URL,
  );
}

/**
 * 关系管理 API
 */

// 获取所有的关系对象类型
export function getRelationTypes() {
  return requestClient.get<SystemRelationApi.ObjectTypeInfo[]>(
    SystemRelationApi.Apis.types,
  );
}

// 获取指定类型的关系定义
export function getRelationTypesByObject(type: string) {
  return requestClient.get<SystemRelationApi.ObjectTypeInfo[]>(
    parseTemplate(SystemRelationApi.Apis.typeRelations, { type }),
  );
}

// 查询指定类型数据的关系信息
export function getRelationInfo(type: string, id: string) {
  return requestClient.get<SystemRelationApi.RelatedInfo[]>(
    parseTemplate(SystemRelationApi.Apis.relatedInfo, { type, id }),
  );
}

// 保存指定类型数据的关系信息
export function saveRelated(
  type: string,
  id: string,
  data: SystemRelationApi.SaveRelationRequest[],
) {
  return requestClient.patch(
    parseTemplate(SystemRelationApi.Apis.bind, { type, id }),
    data,
  );
}

// 验证关系标识是否合法
export function validateRelation(
  objectType: string,
  relation: string,
  targetType: string,
) {
  return requestClient.get<any>(SystemRelationApi.Apis.validate, {
    params: { objectType, relation, targetType },
  });
}
