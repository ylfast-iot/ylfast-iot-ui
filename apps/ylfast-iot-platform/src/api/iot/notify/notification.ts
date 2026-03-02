import type { QueryParamEntity, Recordable } from '#/adapter';
import type { PagerResult } from '#/api/basic';
import type { EnumDict } from '#/types/global';

import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace IotNotificationApi {
  /**
   * 通知状态
   */
  export type NotificationState = 'read' | 'unread';

  /**
   * 订阅状态
   */
  export type SubscribeState = 'disabled' | 'enabled' | string;

  /**
   * 订阅类型支持信息
   */
  export interface SubscribeTypeInfo {
    id: string;
    name: string;
  }

  /**
   * 订阅提供商信息
   */
  export interface SubscriberProviderInfo {
    id: string;
    name: string;
    type: SubscribeTypeInfo;
    metadata: Recordable;
  }

  /**
   * 订阅实体
   */
  export interface IotNotifySubscriberEntity {
    id?: string;
    subscriberType?: string;
    subscriber?: string;
    topicProvider: string;
    providerId?: string;
    subscribeName: string;
    topicName: string;
    topicConfig?: Record<string, any>;
    description?: string;
    state?: EnumDict<SubscribeState>;
    locale?: string;
    notifyChannels?: string[];
  }

  /**
   * 通知消息实体
   */
  export interface IotNotificationEntity {
    id?: string;
    subscribeId?: string;
    subscriberType?: string;
    subscriber?: string;
    topicProvider: string;
    topicName: string;
    message: string;
    dataId?: string;
    notifyTime: number;
    code?: string;
    detailJson?: string;
    state: EnumDict<NotificationState>;
    description?: string;
  }

  const BASE_URL = '/iot/notifications';

  export const Apis = {
    subscriptionsQuery: `${BASE_URL}/subscriptions/_query`,
    changeSubscribeState: `${BASE_URL}/subscription/{id}/_{state}`,
    deleteSubscription: `${BASE_URL}/subscription/{id}`,
    subscribe: `${BASE_URL}/subscribe`,
    providers: `${BASE_URL}/providers`,
    currentProviders: `${BASE_URL}/current/providers`,
    currentTypeProviders: `${BASE_URL}/current/{type}/providers`,
    notificationsQuery: `${BASE_URL}/_query`,
    readNotification: `${BASE_URL}/{id}/read`,
    changeNotificationState: `${BASE_URL}/_{state}`,
    changeNotificationStateByProvider: `${BASE_URL}/_{state}/provider`,
  };
}

/**
 * 查询当前用户订阅信息
 * @param query 查询参数
 */
export const querySubscription = (query: QueryParamEntity) =>
  requestClient.post<PagerResult<IotNotificationApi.IotNotifySubscriberEntity>>(
    IotNotificationApi.Apis.subscriptionsQuery,
    query,
  );

/**
 * 修改通知订阅状态
 * @param id 订阅ID
 * @param state 状态
 */
export const changeSubscribeState = (
  id: string,
  state: IotNotificationApi.SubscribeState,
) =>
  requestClient.put(
    parseTemplate(IotNotificationApi.Apis.changeSubscribeState, { id, state }),
  );

/**
 * 删除订阅
 * @param id 订阅ID
 */
export const deleteSubscription = (id: string) =>
  requestClient.delete(
    parseTemplate(IotNotificationApi.Apis.deleteSubscription, { id }),
  );

/**
 * 订阅通知
 * @param data 订阅数据
 */
export const doSubscribe = (
  data: IotNotificationApi.IotNotifySubscriberEntity[],
) =>
  requestClient.patch<IotNotificationApi.IotNotifySubscriberEntity[]>(
    IotNotificationApi.Apis.subscribe,
    data,
  );

/**
 * 获取全部订阅支持 (Deprecated)
 */
export const getProviders = () =>
  requestClient.get<IotNotificationApi.SubscriberProviderInfo[]>(
    IotNotificationApi.Apis.providers,
  );

/**
 * 获取当前用户可用的订阅支持 (Deprecated)
 */
export const getCurrentProviders = () =>
  requestClient.get<IotNotificationApi.SubscriberProviderInfo[]>(
    IotNotificationApi.Apis.currentProviders,
  );

/**
 * 根据订阅类型获取当前用户可用的订阅支持 (Deprecated)
 * @param type 订阅类型
 */
export const getCurrentProvidersByType = (type: string) =>
  requestClient.get<IotNotificationApi.SubscriberProviderInfo[]>(
    parseTemplate(IotNotificationApi.Apis.currentTypeProviders, { type }),
  );

/**
 * 查询通知记录
 * @param query 查询参数
 */
export const queryMyNotifications = (query: QueryParamEntity) =>
  requestClient.post<PagerResult<IotNotificationApi.IotNotificationEntity>>(
    IotNotificationApi.Apis.notificationsQuery,
    query,
  );

/**
 * 获取通知记录 (单条并标记已读)
 * @param id 通知ID
 */
export const readNotification = (id: string) =>
  requestClient.get<IotNotificationApi.IotNotificationEntity>(
    parseTemplate(IotNotificationApi.Apis.readNotification, { id }),
  );

/**
 * 修改通知状态
 * @param idList 通知ID列表
 * @param state 状态
 */
export const changeNotificationState = (
  idList: string[],
  state: IotNotificationApi.NotificationState,
) =>
  requestClient.post<number>(
    parseTemplate(IotNotificationApi.Apis.changeNotificationState, { state }),
    idList,
  );

/**
 * 按订阅具体类型修改通知状态
 * @param providerList 渠道标识列表
 * @param state 状态
 */
export const changeNotificationStateByProvider = (
  providerList: string[],
  state: IotNotificationApi.NotificationState,
) =>
  requestClient.post<number>(
    parseTemplate(IotNotificationApi.Apis.changeNotificationStateByProvider, {
      state,
    }),
    providerList,
  );
