import type { QueryParamEntity } from '#/adapter';
import type { BasicModel, PagerResult } from '#/api/basic';
import type { EnumDict } from '#/types/global';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace RuleEngineAlarmConfigApi {
  export type AlarmState = 'disabled' | 'enabled';

  export interface AlarmLevelInfo {
    /** 国际化标题 */
    i18nMessages?: Record<string, string>;
    /** 级别值 */
    level: number;
    /** 级别标题 */
    title: string;
  }

  export interface AlarmLevelEntity extends BasicModel<string> {
    /** 级别说明 */
    description?: string;
    /** 级别列表 */
    levels: AlarmLevelInfo[];
    /** 级别名称 */
    name?: string;
  }

  export interface AlarmSceneInfo {
    /** 场景 ID */
    id: string;
    /** 场景名称 */
    name: string;
    /** 场景状态 */
    state?: EnumDict<'disable' | 'started'>;
    /** 触发器类型 */
    triggerType?: string;
  }

  export interface AlarmConfigEntity extends BasicModel<string> {
    /** 创建人 ID */
    creatorId?: string;
    /** 创建人名称 */
    creatorName?: string;
    /** 配置说明 */
    description?: string;
    /** 告警级别 */
    level: number;
    /** 修改人 ID */
    modifierId?: string;
    /** 修改人名称 */
    modifierName?: string;
    /** 配置名称 */
    name: string;
    /** 关联场景 ID */
    sceneId?: string;
    /** 关联场景名称 */
    sceneName?: string;
    /** 场景触发类型 */
    sceneTriggerType?: string;
    /** 配置状态 */
    state?: EnumDict<AlarmState>;
    /** 告警目标类型 */
    targetType: string;
  }

  export interface AlarmConfigDetail extends Omit<AlarmConfigEntity, 'state'> {
    /** 关联场景列表 */
    scene?: AlarmSceneInfo[];
    /** 配置状态 */
    state?: AlarmState;
  }

  export interface AlarmTargetTypeInfo {
    /** 目标类型 ID */
    id: string;
    /** 目标类型名称 */
    name: string;
    /** 支持的触发器列表 */
    supportTriggers?: string[];
  }

  const BASE_URL = '/alarm/config';

  export const Apis = {
    defaultLevel: `${BASE_URL}/default/level`,
    detailQuery: `${BASE_URL}/detail/_query`,
    disable: `${BASE_URL}/{id}/_disable`,
    enable: `${BASE_URL}/{id}/_enable`,
    level: `${BASE_URL}/level`,
    targetTypeSupports: `${BASE_URL}/target-type/supports`,
  };

  export const basicCrudApis = buildBasicCrudApis<AlarmConfigEntity, string>(
    BASE_URL,
  );
}

/**
 * 获取告警目标类型支持列表
 */
export const getAlarmConfigTargetTypeSupports = () =>
  requestClient.get<RuleEngineAlarmConfigApi.AlarmTargetTypeInfo[]>(
    RuleEngineAlarmConfigApi.Apis.targetTypeSupports,
  );

/**
 * 启用告警配置
 */
export const enableAlarmConfig = (id: string) =>
  requestClient.post(
    parseTemplate(RuleEngineAlarmConfigApi.Apis.enable, { id }),
  );

/**
 * 禁用告警配置
 */
export const disableAlarmConfig = (id: string) =>
  requestClient.post(
    parseTemplate(RuleEngineAlarmConfigApi.Apis.disable, { id }),
  );

/**
 * 保存默认告警级别
 */
export const saveDefaultAlarmLevel = (
  levels: RuleEngineAlarmConfigApi.AlarmLevelInfo[],
) => requestClient.patch(RuleEngineAlarmConfigApi.Apis.defaultLevel, levels);

/**
 * 保存告警级别配置
 */
export const saveAlarmLevel = (
  entity: RuleEngineAlarmConfigApi.AlarmLevelEntity,
) => requestClient.patch(RuleEngineAlarmConfigApi.Apis.level, entity);

/**
 * 获取默认告警级别
 */
export const getDefaultAlarmLevel = () =>
  requestClient.get<RuleEngineAlarmConfigApi.AlarmLevelEntity>(
    RuleEngineAlarmConfigApi.Apis.defaultLevel,
  );

/**
 * 分页查询告警配置详情
 */
export const queryAlarmConfigDetailPage = (
  query: QueryParamEntity = {} as QueryParamEntity,
) =>
  requestClient.post<PagerResult<RuleEngineAlarmConfigApi.AlarmConfigDetail>>(
    RuleEngineAlarmConfigApi.Apis.detailQuery,
    query,
  );
