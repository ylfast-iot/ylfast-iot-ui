import type { EnumDict } from '#/types/global';

import { $t } from '@vben/locales';

/**
 * 通知类型
 */
export type NotifyType =
  | 'dingTalk'
  | 'email'
  | 'sms'
  | 'voice'
  | 'webhook'
  | 'wechat';

/**
 * 通知服务商 (内部枚举值)
 */
export type NotifyProvider =
  | 'aliyun'
  | 'aliYunSms'
  | 'corpMessage'
  | 'dingTalkMessage'
  | 'dingTalkRobotWebHook'
  | 'httpWebhook'
  | 'simple';

/**
 * 后端订阅服务商 ID (subscriberProviderId)
 */
export type NotifySubscriberProvider =
  | 'inside-mail'
  | 'notifier-dingTalk'
  | 'notifier-email'
  | 'notifier-sms'
  | 'notifier-voice'
  | 'notifier-webhook'
  | 'notifier-wechat';

export interface NotifyEnumDict extends EnumDict<string> {
  color?: string;
  icon?: string;
  text: string; // Required by EnumDict
  subscriberProviderId?: NotifySubscriberProvider;
  // 用户字段，当前subscriberProviderId对应的用户字段，用于通知订阅创建通道时变量值自动填充
  /**
   * userField = {
            source: 'relation',
            relation: {
                objectType: 'user',
                objectSource: {
                    source: 'upper',
                    upperKey: 'subscriber',
                },
            },
        }
   */
  userField?: string;
}

/**
 * 通知类型配置 (通用分类)
 */
export const NOTIFY_TYPE_ENUMS: Record<NotifyType, NotifyEnumDict> = {
  dingTalk: {
    value: 'dingTalk',
    get label() {
      return $t('notify.types.dingTalk');
    },
    get text() {
      return $t('notify.types.dingTalk');
    },
    icon: 'ant-design:dingtalk-outlined',
    color: 'blue',
    subscriberProviderId: 'notifier-dingTalk',
  },
  email: {
    value: 'email',
    get label() {
      return $t('notify.types.email');
    },
    get text() {
      return $t('notify.types.email');
    },
    icon: 'ic:round-email',
    color: 'orange',
    subscriberProviderId: 'notifier-email',
  },
  sms: {
    value: 'sms',
    get label() {
      return $t('notify.types.sms');
    },
    get text() {
      return $t('notify.types.sms');
    },
    icon: 'ic:baseline-sms',
    color: 'green',
    subscriberProviderId: 'notifier-sms',
  },
  voice: {
    value: 'voice',
    get label() {
      return $t('notify.types.voice');
    },
    get text() {
      return $t('notify.types.voice');
    },
    icon: 'icon-park-solid:voice',
    color: 'purple',
    subscriberProviderId: 'notifier-voice',
  },
  webhook: {
    value: 'webhook',
    get label() {
      return $t('notify.types.webhook');
    },
    get text() {
      return $t('notify.types.webhook');
    },
    icon: 'logos:webhooks',
    color: 'gray',
    subscriberProviderId: 'notifier-webhook',
  },
  wechat: {
    value: 'wechat',
    get label() {
      return $t('notify.types.wechat');
    },
    get text() {
      return $t('notify.types.wechat');
    },
    icon: 'mingcute:wechat-fill',
    color: 'green',
    subscriberProviderId: 'notifier-wechat',
  },
};

/**
 * 通知服务商配置 (业务组件库配置)
 * 使用 subscriberProviderId 关联后端 ID
 */
export const NOTIFY_PROVIDER_ENUMS: Record<NotifyProvider, NotifyEnumDict> = {
  // 钉钉
  dingTalkMessage: {
    value: 'dingTalkMessage',
    get text() {
      return $t('notify.providers.dingTalkMessage');
    },
    get label() {
      return $t('notify.providers.dingTalkMessage');
    },
    icon: 'ant-design:dingtalk-outlined',
    color: 'blue',
    subscriberProviderId: 'notifier-dingTalk',
    userField: 'userid_list',
  },
  dingTalkRobotWebHook: {
    value: 'dingTalkRobotWebHook',
    get text() {
      return $t('notify.providers.dingTalkRobotWebHook');
    },
    get label() {
      return $t('notify.providers.dingTalkRobotWebHook');
    },
    icon: 'bxs:bot',
    color: 'blue',
  },
  // 邮箱
  simple: {
    value: 'simple',
    get text() {
      return $t('notify.providers.simple');
    },
    get label() {
      return $t('notify.providers.simple');
    },
    icon: 'ic:round-email',
    color: 'orange',
    subscriberProviderId: 'notifier-email',
    userField: 'sendTo',
  },
  // 短信
  aliYunSms: {
    value: 'aliYunSms',
    get text() {
      return $t('notify.providers.aliYunSms');
    },
    get label() {
      return $t('notify.providers.aliYunSms');
    },
    icon: 'ic:baseline-sms',
    color: 'green',
    subscriberProviderId: 'notifier-sms',
    userField: 'phoneNumber',
  },
  // 语音
  aliyun: {
    value: 'aliyun',
    get text() {
      return $t('notify.providers.aliyun');
    },
    get label() {
      return $t('notify.providers.aliyun');
    },
    icon: 'icon-park-solid:voice',
    color: 'purple',
    subscriberProviderId: 'notifier-voice',
    userField: 'calledNumber',
  },
  // Webhook
  httpWebhook: {
    value: 'httpWebhook',
    get text() {
      return $t('notify.providers.httpWebhook');
    },
    get label() {
      return $t('notify.providers.httpWebhook');
    },
    icon: 'logos:webhooks',
    color: 'blue',
    subscriberProviderId: 'notifier-webhook',
  },
  // 微信
  corpMessage: {
    value: 'corpMessage',
    get text() {
      return $t('notify.providers.corpMessage');
    },
    get label() {
      return $t('notify.providers.corpMessage');
    },
    icon: 'mingcute:wechat-fill',
    color: 'green',
    subscriberProviderId: 'notifier-wechat',
    userField: 'toUser',
  },
};
