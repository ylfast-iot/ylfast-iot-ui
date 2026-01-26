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
 * 通知服务商
 */
export type NotifyProvider =
  | 'aliyun'
  | 'aliYunSms'
  | 'corpMessage'
  | 'dingTalkMessage'
  | 'dingTalkRobotWebHook'
  | 'httpWebhook'
  | 'simple';

export interface NotifyEnumDict extends EnumDict<string> {
  color?: string;
  icon?: string;
  text: string; // Required by EnumDict
}

/**
 * 通知类型配置
 */
export const NOTIFY_TYPE_ENUMS: { [key in NotifyType]: NotifyEnumDict } = {
  dingTalk: {
    value: 'dingTalk',
    get label() {
      return $t('notify.types.dingTalk');
    },
    get text() {
      return $t('notify.types.dingTalk');
    },
    icon: 'logos:dingtalk-icon',
    color: 'blue',
  },
  email: {
    value: 'email',
    get label() {
      return $t('notify.types.email');
    },
    get text() {
      return $t('notify.types.email');
    },
    icon: 'lucide:mail',
    color: 'orange',
  },
  sms: {
    value: 'sms',
    get label() {
      return $t('notify.types.sms');
    },
    get text() {
      return $t('notify.types.sms');
    },
    icon: 'lucide:message-square',
    color: 'green',
  },
  voice: {
    value: 'voice',
    get label() {
      return $t('notify.types.voice');
    },
    get text() {
      return $t('notify.types.voice');
    },
    icon: 'lucide:phone-outgoing',
    color: 'purple',
  },
  webhook: {
    value: 'webhook',
    get label() {
      return $t('notify.types.webhook');
    },
    get text() {
      return $t('notify.types.webhook');
    },
    icon: 'lucide:webhook',
    color: 'gray',
  },
  wechat: {
    value: 'wechat',
    get label() {
      return $t('notify.types.wechat');
    },
    get text() {
      return $t('notify.types.wechat');
    },
    icon: 'logos:wechat',
    color: 'green',
  },
};

/**
 * 通知服务商配置
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
  },
};
