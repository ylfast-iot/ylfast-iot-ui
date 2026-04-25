import type { BasicModel } from '#/api/basic';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace RuleEngineAlarmRuleBindApi {
  export interface AlarmRuleBindEntity extends BasicModel<string> {
    /** 告警配置 ID */
    alarmId: string;
    /** 分支索引 */
    branchIndex?: number;
    /** 场景规则 ID */
    ruleId: string;
  }

  const BASE_URL = '/alarm/rule/bind';

  export const Apis = {
    batchDelete: `${BASE_URL}/_delete`,
    deleteByAlarmId: `${BASE_URL}/{alarmId}/_delete`,
    deleteByBranch: `${BASE_URL}/{alarmId}/{ruleId}/_delete`,
  };

  export const basicCrudApis = buildBasicCrudApis<AlarmRuleBindEntity, string>(
    BASE_URL,
  );
}

/**
 * 按告警配置批量删除规则绑定
 */
export const deleteAlarmRuleBindings = (alarmId: string, ruleIds: string[]) =>
  requestClient.post<number>(
    parseTemplate(RuleEngineAlarmRuleBindApi.Apis.deleteByAlarmId, { alarmId }),
    ruleIds,
  );

/**
 * 按告警配置和规则分支删除绑定
 */
export const deleteAlarmRuleBindingsByBranch = (
  alarmId: string,
  ruleId: string,
  branchIndexes: number[],
) =>
  requestClient.post<number>(
    parseTemplate(RuleEngineAlarmRuleBindApi.Apis.deleteByBranch, {
      alarmId,
      ruleId,
    }),
    branchIndexes,
  );

/**
 * 批量删除多条规则绑定
 */
export const deleteAlarmRuleBindingsBatch = (
  payload: RuleEngineAlarmRuleBindApi.AlarmRuleBindEntity[],
) =>
  requestClient.post<number>(
    RuleEngineAlarmRuleBindApi.Apis.batchDelete,
    payload,
  );
