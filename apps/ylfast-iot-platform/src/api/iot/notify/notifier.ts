import type { IotNotifyTemplateApi } from './template';

import { requestClient } from '#/api/request';

/**
 * 发送通知请求 (包含临时模板)
 */
export interface SendNotifyRequest {
  /**
   * 通知模版
   */
  template: IotNotifyTemplateApi.NotifyTemplate;
  /**
   * 上下文数据
   */
  context?: Record<string, any>;
}

/**
 * 消息通知管理 API
 */
export const IotNotifierApi = {
  /**
   * 指定通知器（配置）以及临时模版发送通知
   * POST /iot/notifier/{notifierId}/_send
   */
  sendNotify: (notifierId: string, data: SendNotifyRequest) => {
    return requestClient.post(`/iot/notifier/${notifierId}/_send`, data);
  },

  /**
   * 根据配置 ID 和模版 ID 发送消息通知
   * POST /iot/notifier/{notifierId}/{templateId}/_send
   */
  sendNotifyWithTemplate: (
    notifierId: string,
    templateId: string,
    context: Record<string, any>,
  ) => {
    return requestClient.post(
      `/iot/notifier/${notifierId}/${templateId}/_send`,
      context,
    );
  },
};
