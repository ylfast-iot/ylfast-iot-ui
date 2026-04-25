import type { SceneAction, SceneConditionAction, SceneTrigger } from './types';

import type { QueryParamEntity, Term } from '#/adapter';
import type { BasicModel, PagerResult } from '#/api/basic';
import type { EnumDict } from '#/types/global';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace RuleEngineSceneApi {
  export type RuleInstanceState = 'disable' | 'started';

  export interface SceneExecuteRequest {
    /** 执行上下文 */
    context?: Record<string, unknown>;
    /** 场景 ID */
    id: string;
  }

  export interface SceneRule {
    /** 动作列表 */
    actions?: SceneAction[];
    /** 分支动作列表 */
    branches?: SceneConditionAction[];
    /** 场景说明 */
    description?: string;
    /** 场景特性 */
    features?: string[];
    /** 场景 ID */
    id?: string;
    /** 场景名称 */
    name: string;
    /** 扩展配置 */
    options?: Record<string, unknown>;
    /** 是否并行执行 */
    parallel?: boolean;
    /** 条件列表 */
    terms?: Term[];
    /** 触发器配置 */
    trigger: SceneTrigger;
  }

  export interface SceneEntity extends BasicModel<string> {
    /** 动作列表 */
    actions?: SceneAction[];
    /** 分支动作列表 */
    branches?: SceneConditionAction[];
    /** 场景说明 */
    description?: string;
    /** 场景特性 */
    features?: string[];
    /** 场景名称 */
    name: string;
    /** 扩展配置 */
    options?: Record<string, unknown>;
    /** 是否并行执行 */
    parallel?: boolean;
    /** 启动时间 */
    startTime?: number;
    /** 场景状态 */
    state?: EnumDict<RuleInstanceState>;
    /** 条件列表 */
    terms?: Term[];
    /** 触发器配置 */
    trigger?: SceneTrigger;
    /** 触发器类型 */
    triggerType?: string;
  }

  const BASE_URL = '/scene';

  export const Apis = {
    batchExecute: `${BASE_URL}/batch/_execute`,
    byId: `${BASE_URL}/{id}`,
    count: `${BASE_URL}/_count`,
    disable: `${BASE_URL}/{id}/_disable`,
    enable: `${BASE_URL}/{id}/_enable`,
    execute: `${BASE_URL}/{id}/_execute`,
    exists: `${BASE_URL}/_exists`,
    query: `${BASE_URL}/_query`,
    queryNoPaging: `${BASE_URL}/_query/no-paging`,
  };

  export const basicCrudApis = buildBasicCrudApis<SceneEntity, string>(
    BASE_URL,
  );
}

/**
 * 按 ID 查询场景。
 */
export const getSceneById = (id: string) =>
  requestClient.get<RuleEngineSceneApi.SceneEntity>(
    parseTemplate(RuleEngineSceneApi.Apis.byId, { id }),
  );

/**
 * 分页查询场景。
 */
export const queryScenePage = (
  query: QueryParamEntity = {} as QueryParamEntity,
) =>
  requestClient.post<PagerResult<RuleEngineSceneApi.SceneEntity>>(
    RuleEngineSceneApi.Apis.query,
    query,
  );

/**
 * 不分页查询场景。
 */
export const querySceneList = (
  query: QueryParamEntity = {} as QueryParamEntity,
) =>
  requestClient.post<RuleEngineSceneApi.SceneEntity[]>(
    RuleEngineSceneApi.Apis.queryNoPaging,
    query,
  );

/**
 * 统计场景数量。
 */
export const countScenes = (query: QueryParamEntity = {} as QueryParamEntity) =>
  requestClient.post<number>(RuleEngineSceneApi.Apis.count, query);

/**
 * 判断场景是否存在。
 */
export const existsScene = (query: QueryParamEntity = {} as QueryParamEntity) =>
  requestClient.post<boolean>(RuleEngineSceneApi.Apis.exists, query);

/**
 * 创建场景。
 */
export const createScene = (data: RuleEngineSceneApi.SceneRule) =>
  requestClient.post<RuleEngineSceneApi.SceneEntity>('/scene', data);

/**
 * 更新场景。
 */
export const updateScene = (id: string, data: RuleEngineSceneApi.SceneRule) =>
  requestClient.put(parseTemplate(RuleEngineSceneApi.Apis.byId, { id }), data);

/**
 * 启用场景。
 */
export const enableScene = (id: string) =>
  requestClient.put(parseTemplate(RuleEngineSceneApi.Apis.enable, { id }));

/**
 * 禁用场景。
 */
export const disableScene = (id: string) =>
  requestClient.put(parseTemplate(RuleEngineSceneApi.Apis.disable, { id }));

/**
 * 手动执行场景。
 */
export const executeScene = (
  id: string,
  context: Record<string, unknown> = {},
) =>
  requestClient.post(
    parseTemplate(RuleEngineSceneApi.Apis.execute, { id }),
    context,
  );

/**
 * 批量手动执行场景。
 */
export const executeSceneBatch = (
  requests: RuleEngineSceneApi.SceneExecuteRequest[],
) => requestClient.post(RuleEngineSceneApi.Apis.batchExecute, requests);

/**
 * 删除场景。
 */
export const deleteScene = (id: string) =>
  requestClient.delete(parseTemplate(RuleEngineSceneApi.Apis.byId, { id }));
