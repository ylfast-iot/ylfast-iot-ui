import type { QueryParamEntity } from '#/adapter';
import type { PagerResult } from '#/api/basic';
import type { EnumDict } from '#/types/global';

import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace IotNotifyHistoryApi {
  /**
   * 通知状态
   */
  export type NotifyState = 'error' | 'success';

  /**
   * 通知记录实体
   */
  export interface NotifyHistory {
    /** ID */
    id: string;
    /** 通知ID (配置ID) */
    notifierId: string;
    /** 状态 */
    state: EnumDict<NotifyState>;
    /** 错误类型 */
    errorType?: string;
    /** 异常栈 */
    errorStack?: string;
    /** 模版ID */
    templateId?: string;
    /** 模版内容 */
    template?: string;
    /** 上下文 */
    context?: Record<string, any>;
    /** 服务商 */
    provider: string;
    /** 通知类型 */
    notifyType: string;
    /** 通知时间 */
    notifyTime: number;
  }

  const BASE_URL = '/iot/notify/history';
  export const Apis = {
    queryByConfig: `${BASE_URL}/config/{configId}/_query`,
    queryByTemplate: `${BASE_URL}/template/{templateId}/_query`,
  };
}

/**
 * 根据通知配置ID查询通知记录
 * @param configId 通知配置ID
 * @param query 查询参数
 */
export const queryHistoryByConfigId = (
  configId: string,
  query: QueryParamEntity,
) =>
  requestClient.post<PagerResult<IotNotifyHistoryApi.NotifyHistory>>(
    parseTemplate(IotNotifyHistoryApi.Apis.queryByConfig, { configId }),
    query,
  );

/**
 * 根据通知模版ID查询通知记录
 * @param templateId 通知模版ID
 * @param query 查询参数
 */
export const queryHistoryByTemplateId = (
  templateId: string,
  query: QueryParamEntity,
) =>
  requestClient.post<PagerResult<IotNotifyHistoryApi.NotifyHistory>>(
    parseTemplate(IotNotifyHistoryApi.Apis.queryByTemplate, { templateId }),
    query,
  );
