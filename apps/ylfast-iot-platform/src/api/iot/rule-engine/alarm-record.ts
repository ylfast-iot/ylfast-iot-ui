import type { TermSpec } from './types';

import type { QueryParamEntity } from '#/adapter';
import type { BasicModel, PagerResult } from '#/api/basic';
import type { EnumDict } from '#/types/global';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace RuleEngineAlarmRecordApi {
  export type AlarmHandleState = 'processed' | 'unprocessed';
  export type AlarmRecordState = 'normal' | 'warning';

  export interface AlarmHandleInfo {
    /** 告警原因描述 */
    actualDesc?: string;
    /** 告警配置 ID */
    alarmConfigId: string;
    /** 告警配置来源 */
    alarmConfigSource?: string;
    /** 告警记录 ID */
    alarmRecordId: string;
    /** 告警时间 */
    alarmTime: number;
    /** 处理说明 */
    describe?: string;
    /** 处理状态 */
    handleState?: AlarmHandleState;
    /** 处理时间 */
    handleTime?: number;
    /** 告警级别 */
    level: number;
    /** 告警记录创建人 ID */
    recordCreatorId?: string;
    /** 告警源 ID */
    sourceId?: string;
    /** 告警源名称 */
    sourceName?: string;
    /** 告警源类型 */
    sourceType?: string;
    /** 告警记录状态 */
    state?: AlarmRecordState;
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
    /** 处理类型 */
    type?: string;
  }

  export interface AlarmHandleHistoryEntity extends BasicModel<string> {
    /** 告警原因描述 */
    actualDesc?: string;
    /** 告警配置 ID */
    alarmId: string;
    /** 告警记录 ID */
    alarmRecordId: string;
    /** 告警时间 */
    alarmTime?: number;
    /** 处理描述 */
    description: string;
    /** 处理时间 */
    handleTime?: number;
    /** 处理类型 */
    handleType?: EnumDict<string>;
    /** 告警级别 */
    level?: number;
    /** 告警流水号 */
    serialNumber?: string;
    /** 告警源 ID */
    sourceId?: string;
    /** 告警源名称 */
    sourceName?: string;
    /** 告警源类型 */
    sourceType?: string;
    /** 处理状态 */
    state?: EnumDict<AlarmHandleState>;
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

  export interface AlarmRecordEntity extends BasicModel<string> {
    /** 告警原因描述 */
    actualDesc?: string;
    /** 告警配置 ID */
    alarmConfigId: string;
    /** 告警配置来源 */
    alarmConfigSource?: string;
    /** 告警名称 */
    alarmName: string;
    /** 首次告警时间 */
    alarmTime?: number;
    /** 描述 */
    description?: string;
    /** 处理时间 */
    handleTime?: number;
    /** 处理类型 */
    handleType?: EnumDict<string>;
    /** 最近一次告警时间 */
    lastAlarmTime?: number;
    /** 告警级别 */
    level?: number;
    /** 告警源 ID */
    sourceId?: string;
    /** 告警源名称 */
    sourceName?: string;
    /** 告警源类型 */
    sourceType?: string;
    /** 告警状态 */
    state?: EnumDict<AlarmRecordState>;
    /** 目标 ID */
    targetId?: string;
    /** 目标唯一键 */
    targetKey?: string;
    /** 目标名称 */
    targetName?: string;
    /** 目标类型 */
    targetType?: string;
    /** 条件规格 */
    termSpec?: TermSpec;
    /** 触发条件描述 */
    triggerDesc?: string;
  }

  const BASE_URL = '/alarm/record';

  export const Apis = {
    byId: `${BASE_URL}/{id}`,
    count: `${BASE_URL}/_count`,
    exists: `${BASE_URL}/_exists`,
    handle: `${BASE_URL}/_handle`,
    handleByDimension: `${BASE_URL}/{dimensionType}/_handle`,
    handleHistoryByDimension: `${BASE_URL}/handle-history/{dimensionType}/{recordId}/_query`,
    handleHistoryByRecord: `${BASE_URL}/{id}/handle-history/_query`,
    handleHistoryQuery: `${BASE_URL}/handle-history/_query`,
    query: `${BASE_URL}/_query`,
    queryByDimension: `${BASE_URL}/{dimensionType}/_query`,
    queryNoPaging: `${BASE_URL}/_query/no-paging`,
  };

  export const basicCrudApis = buildBasicCrudApis<AlarmRecordEntity, string>(
    BASE_URL,
  );
}

/**
 * 按 ID 查询告警记录。
 */
export const getAlarmRecordById = (id: string) =>
  requestClient.get<RuleEngineAlarmRecordApi.AlarmRecordEntity>(
    parseTemplate(RuleEngineAlarmRecordApi.Apis.byId, { id }),
  );

/**
 * 分页查询告警记录。
 */
export const queryAlarmRecordPage = (
  query: QueryParamEntity = {} as QueryParamEntity,
) =>
  requestClient.post<PagerResult<RuleEngineAlarmRecordApi.AlarmRecordEntity>>(
    RuleEngineAlarmRecordApi.Apis.query,
    query,
  );

/**
 * 不分页查询告警记录。
 */
export const queryAlarmRecordList = (
  query: QueryParamEntity = {} as QueryParamEntity,
) =>
  requestClient.post<RuleEngineAlarmRecordApi.AlarmRecordEntity[]>(
    RuleEngineAlarmRecordApi.Apis.queryNoPaging,
    query,
  );

/**
 * 统计告警记录数量。
 */
export const countAlarmRecords = (
  query: QueryParamEntity = {} as QueryParamEntity,
) => requestClient.post<number>(RuleEngineAlarmRecordApi.Apis.count, query);

/**
 * 判断告警记录是否存在。
 */
export const existsAlarmRecord = (
  query: QueryParamEntity = {} as QueryParamEntity,
) => requestClient.post<boolean>(RuleEngineAlarmRecordApi.Apis.exists, query);

/**
 * 按维度分页查询告警记录。
 */
export const queryAlarmRecordPageByDimension = (
  dimensionType: string,
  query: QueryParamEntity = {} as QueryParamEntity,
) =>
  requestClient.post<PagerResult<RuleEngineAlarmRecordApi.AlarmRecordEntity>>(
    parseTemplate(RuleEngineAlarmRecordApi.Apis.queryByDimension, {
      dimensionType,
    }),
    query,
  );

/**
 * 处理告警记录。
 */
export const handleAlarmRecord = (
  data: RuleEngineAlarmRecordApi.AlarmHandleInfo,
) => requestClient.post(RuleEngineAlarmRecordApi.Apis.handle, data);

/**
 * 按维度处理告警记录。
 */
export const handleAlarmRecordByDimension = (
  dimensionType: string,
  data: RuleEngineAlarmRecordApi.AlarmHandleInfo,
) =>
  requestClient.post(
    parseTemplate(RuleEngineAlarmRecordApi.Apis.handleByDimension, {
      dimensionType,
    }),
    data,
  );

/**
 * 分页查询告警处理历史。
 */
export const queryAlarmHandleHistoryPage = (
  query: QueryParamEntity = {} as QueryParamEntity,
) =>
  requestClient.post<
    PagerResult<RuleEngineAlarmRecordApi.AlarmHandleHistoryEntity>
  >(RuleEngineAlarmRecordApi.Apis.handleHistoryQuery, query);

/**
 * 按告警记录分页查询处理历史。
 */
export const queryAlarmHandleHistoryPageByRecord = (
  id: string,
  query: QueryParamEntity = {} as QueryParamEntity,
) =>
  requestClient.post<
    PagerResult<RuleEngineAlarmRecordApi.AlarmHandleHistoryEntity>
  >(
    parseTemplate(RuleEngineAlarmRecordApi.Apis.handleHistoryByRecord, { id }),
    query,
  );

/**
 * 按维度与记录分页查询处理历史。
 */
export const queryAlarmHandleHistoryPageByDimension = (
  dimensionType: string,
  recordId: string,
  query: QueryParamEntity = {} as QueryParamEntity,
) =>
  requestClient.post<
    PagerResult<RuleEngineAlarmRecordApi.AlarmHandleHistoryEntity>
  >(
    parseTemplate(RuleEngineAlarmRecordApi.Apis.handleHistoryByDimension, {
      dimensionType,
      recordId,
    }),
    query,
  );
