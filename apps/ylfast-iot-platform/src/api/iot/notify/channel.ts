import type { Recordable } from '#/adapter';
import type { EnumDict } from '#/types/global';
import type { PropertyMetadata } from '#/types/metadata';

import { requestClient } from '#/api/request';

/**
 * 权限范围定义
 */
export interface AuthenticationSpec {
  role?: {
    idList: string[];
  };
  permissions?: {
    actions: string[];
    id: string;
  }[];
}

/**
 * 通知渠道状态
 */
export type NotifyChannelState = 'disabled' | 'enabled';

export namespace IotNotifyChannelApi {
  /**
   * 通知通道提供商信息
   */
  export interface NotifyChannelProviderInfo {
    id: string;
    name: string;
  }

  /**
   * 通知订阅通道实体
   */
  export interface NotifyChannelConfig {
    notifierId: string;
    templateId: string;
    variables?: Record<string, any>;
  }

  export interface NotifySubscriberChannel {
    id?: string;
    name: string;
    providerId: string;
    channelProvider: string;
    channelConfiguration: NotifyChannelConfig;
    grant: {
      role: {
        idList: string[];
      };
    };
    i18nMessages?: Record<string, Record<string, string>>;
  }

  /**
   * 订阅者提供商信息 (用于列表和保存)
   */
  export interface SubscriberProviderInfo {
    id: string;
    name: string;
    provider: string;
    type: {
      id: string;
      name: string;
    };
    configuration?: Recordable;
    grant?: AuthenticationSpec;
    state: EnumDict<NotifyChannelState>;
    channels: NotifySubscriberChannel[];
    order?: number;
  }

  const BASE_URL = '/iot/notify/channel';

  export const Apis = {
    providers: `${BASE_URL}/providers`,
    save: `${BASE_URL}`,
    providerChannels: `${BASE_URL}/{providerId}`,
    delete: `${BASE_URL}/{channelId}`,
    enable: `${BASE_URL}/{providerId}/enable`,
    disable: `${BASE_URL}/{providerId}/disable`,
    updateProvider: `${BASE_URL}/{providerId}`,
    allForSave: `${BASE_URL}/all-for-save`,
    all: `${BASE_URL}/all`,
    variables: `${BASE_URL}/{providerId}/variables`,
  };
}

/**
 * 获取通知通道提供商信息
 */
export const getChannelProviders = () =>
  requestClient.get<IotNotifyChannelApi.NotifyChannelProviderInfo[]>(
    IotNotifyChannelApi.Apis.providers,
  );

/**
 * 保存通道配置
 * @param data 通道信息列表
 */
export const saveChannels = (
  data: IotNotifyChannelApi.SubscriberProviderInfo[],
) =>
  requestClient.request(IotNotifyChannelApi.Apis.save, {
    data,
    method: 'patch',
  });

/**
 * 保存单个渠道的通道配置
 * @param providerId 提供商ID
 * @param channels 通道列表
 */
export const saveProviderChannels = (
  providerId: string,
  channels: IotNotifyChannelApi.NotifySubscriberChannel[],
) =>
  requestClient.request(
    IotNotifyChannelApi.Apis.providerChannels.replace(
      '{providerId}',
      providerId,
    ),
    {
      data: channels,
      method: 'patch',
    },
  );

/**
 * 删除通道
 * @param channelId 通道ID
 */
export const deleteChannel = (channelId: string) =>
  requestClient.delete(
    IotNotifyChannelApi.Apis.delete.replace('{channelId}', channelId),
  );

/**
 * 启用订阅
 * @param providerId 提供商ID
 */
export const enableProvider = (providerId: string) =>
  requestClient.post(
    IotNotifyChannelApi.Apis.enable.replace('{providerId}', providerId),
  );

/**
 * 禁用订阅
 * @param providerId 提供商ID
 */
export const disableProvider = (providerId: string) =>
  requestClient.post(
    IotNotifyChannelApi.Apis.disable.replace('{providerId}', providerId),
  );

/**
 * 修改订阅
 * @param providerId 提供商ID
 * @param data 提供商实体配置
 */
export const updateProvider = (
  providerId: string,
  data: IotNotifyChannelApi.SubscriberProviderInfo,
) =>
  requestClient.put(
    IotNotifyChannelApi.Apis.updateProvider.replace('{providerId}', providerId),
    data,
  );

/**
 * 获取所有通道配置 (管理权限)
 */
export const getChannelsForSave = () =>
  requestClient.get<IotNotifyChannelApi.SubscriberProviderInfo[]>(
    IotNotifyChannelApi.Apis.allForSave,
  );

/**
 * 获取当前用户可访问的通道配置
 */
export const getAccessibleChannels = () =>
  requestClient.get<IotNotifyChannelApi.SubscriberProviderInfo[]>(
    IotNotifyChannelApi.Apis.all,
  );

/**
 * 获取通知的内置参数
 * @param providerId 提供商ID
 */
export const getNotifyVariables = (providerId: string) =>
  requestClient.get<PropertyMetadata[]>(
    IotNotifyChannelApi.Apis.variables.replace('{providerId}', providerId),
  );
