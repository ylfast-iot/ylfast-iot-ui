import type { TermSpec } from './types';

import type { QueryParamEntity } from '#/adapter';
import type { PagerResult } from '#/api/basic';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace RuleEngineAlarmHistoryApi {
  export interface AlarmHistoryInfo {
    /** 告警原因描述 */
    actualDesc?: string;
    /** 告警配置 ID */
    alarmConfigId: string;
    /** 告警配置名称 */
    alarmConfigName?: string;
    /** 告警配置来源 */
    alarmConfigSource?: string;
    /** 告警信息 */
    alarmInfo?: string;
    /** 告警记录 ID */
    alarmRecordId: string;
    /** 告警时间 */
    alarmTime: number;
    /** 创建人 ID */
    creatorId?: string;
    /** 描述 */
    description?: string;
    /** 历史记录 ID */
    id: string;
    /** 告警级别 */
    level: number;
    /** 告警源 ID */
    sourceId?: string;
    /** 告警源名称 */
    sourceName?: string;
    /** 告警源类型 */
    sourceType?: string;
    /** 目标 ID */
    targetId?: string;
    /** 目标名称 */
    targetName?: string;
    /** 目标类型 */
    targetType?: string;
    /** 条件规格 */
    termSpec?: TermSpec;
    /** 触发条件描述 */
    triggerDesc?: string;
  }

  const BASE_URL = '/alarm/history';

  export const Apis = {
    query: `${BASE_URL}/_query`,
    queryByAlarmConfig: `${BASE_URL}/{alarmConfigId}/_query`,
    queryByAlarmRecord: `${BASE_URL}/alarm-record/{recordId}/_query`,
    queryByDimension: `${BASE_URL}/{dimensionType}/{alarmConfigId}/_query`,
  };

  export const basicCrudApis = buildBasicCrudApis<AlarmHistoryInfo, string>(
    BASE_URL,
  );
}

/**
 * 分页查询告警历史。
 */
export const queryAlarmHistoryPage = (
  query: QueryParamEntity = {} as QueryParamEntity,
) =>
  requestClient.post<PagerResult<RuleEngineAlarmHistoryApi.AlarmHistoryInfo>>(
    RuleEngineAlarmHistoryApi.Apis.query,
    query,
  );

/**
 * 按告警配置分页查询告警历史。
 */
export const queryAlarmHistoryPageByConfig = (
  alarmConfigId: string,
  query: QueryParamEntity = {} as QueryParamEntity,
) =>
  requestClient.post<PagerResult<RuleEngineAlarmHistoryApi.AlarmHistoryInfo>>(
    parseTemplate(RuleEngineAlarmHistoryApi.Apis.queryByAlarmConfig, {
      alarmConfigId,
    }),
    query,
  );

/**
 * 按告警记录分页查询告警历史。
 */
export const queryAlarmHistoryPageByRecord = (
  recordId: string,
  query: QueryParamEntity = {} as QueryParamEntity,
) =>
  requestClient.post<PagerResult<RuleEngineAlarmHistoryApi.AlarmHistoryInfo>>(
    parseTemplate(RuleEngineAlarmHistoryApi.Apis.queryByAlarmRecord, {
      recordId,
    }),
    query,
  );

/**
 * 按维度分页查询告警历史。
 */
export const queryAlarmHistoryPageByDimension = (
  dimensionType: string,
  alarmConfigId: string,
  query: QueryParamEntity = {} as QueryParamEntity,
) =>
  requestClient.post<PagerResult<RuleEngineAlarmHistoryApi.AlarmHistoryInfo>>(
    parseTemplate(RuleEngineAlarmHistoryApi.Apis.queryByDimension, {
      alarmConfigId,
      dimensionType,
    }),
    query,
  );
