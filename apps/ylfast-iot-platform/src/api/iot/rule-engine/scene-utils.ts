import type { RuleEngineSceneApi } from './scene';
import type {
  SelectorInfo as SceneSelectorInfo,
  TermColumn as SceneTermColumn,
  Variable as SceneVariable,
  SimplePropertyMetadata,
} from './types';

import { requestClient } from '#/api/request';

export namespace RuleEngineSceneUtilsApi {
  export interface SceneActionInfo {
    /** 动作描述 */
    description?: string;
    /** 动作名称 */
    name: string;
    /** 动作提供者 */
    provider: string;
  }

  export interface SceneAggregationInfo {
    /** 聚合函数 ID */
    id: string;
    /** 聚合函数名称 */
    name: string;
  }

  export interface SceneTriggerInfo {
    /** 触发器描述 */
    description?: string;
    /** 触发器名称 */
    name: string;
    /** 触发器提供者 */
    provider: string;
  }

  export type SelectorInfo = SceneSelectorInfo;
  export type TermColumn = SceneTermColumn;
  export type Variable = SceneVariable;

  const BASE_URL = '/scene';

  export const Apis = {
    actionSupports: `${BASE_URL}/action/supports`,
    aggregationSupports: `${BASE_URL}/aggregation/supports`,
    deviceSelectors: `${BASE_URL}/device-selectors`,
    parseArrayChildTermColumn: `${BASE_URL}/parse-array-child-term-column`,
    parseTermColumn: `${BASE_URL}/parse-term-column`,
    parseVariables: `${BASE_URL}/parse-variables`,
    triggerSupports: `${BASE_URL}/trigger/supports`,
  };
}

/**
 * 获取场景触发器支持列表。
 */
export const getSceneTriggerSupports = () =>
  requestClient.get<RuleEngineSceneUtilsApi.SceneTriggerInfo[]>(
    RuleEngineSceneUtilsApi.Apis.triggerSupports,
  );

/**
 * 获取场景动作支持列表。
 */
export const getSceneActionSupports = () =>
  requestClient.get<RuleEngineSceneUtilsApi.SceneActionInfo[]>(
    RuleEngineSceneUtilsApi.Apis.actionSupports,
  );

/**
 * 获取聚合函数支持列表。
 */
export const getSceneAggregationSupports = () =>
  requestClient.get<RuleEngineSceneUtilsApi.SceneAggregationInfo[]>(
    RuleEngineSceneUtilsApi.Apis.aggregationSupports,
  );

/**
 * 解析场景条件列。
 */
export const parseSceneTermColumns = (rule: RuleEngineSceneApi.SceneRule) =>
  requestClient.post<RuleEngineSceneUtilsApi.TermColumn[]>(
    RuleEngineSceneUtilsApi.Apis.parseTermColumn,
    rule,
  );

/**
 * 解析数组子元素条件列。
 */
export const parseSceneArrayChildTermColumns = (
  metadata: SimplePropertyMetadata,
) =>
  requestClient.post<RuleEngineSceneUtilsApi.TermColumn[]>(
    RuleEngineSceneUtilsApi.Apis.parseArrayChildTermColumn,
    metadata,
  );

/**
 * 解析场景变量。
 */
export const parseSceneVariables = (
  rule: RuleEngineSceneApi.SceneRule,
  params?: {
    action?: number;
    branch?: number;
    branchGroup?: number;
  },
) =>
  requestClient.post<RuleEngineSceneUtilsApi.Variable[]>(
    RuleEngineSceneUtilsApi.Apis.parseVariables,
    rule,
    { params },
  );

/**
 * 获取设备选择器支持列表。
 */
export const getSceneDeviceSelectors = () =>
  requestClient.get<RuleEngineSceneUtilsApi.SelectorInfo[]>(
    RuleEngineSceneUtilsApi.Apis.deviceSelectors,
  );
