import type { EnumDict } from '#/types/global';

import { $t } from '@vben/locales';

// 1. 类型定义
export type BuiltinApplicationProvider =
  | 'dingtalk-ent-app'
  | 'internal-integrated'
  | 'internal-standalone'
  | 'third-party'
  | 'wechat-miniapp'
  | 'wechat-webapp';

// 2. 接口扩展 (包含颜色和图标配置)
export interface ApplicationProviderEnumDict
  extends EnumDict<BuiltinApplicationProvider> {
  color?: string; // Icon/Tag Color
  icon?: string; // Iconify Icon Key
  bgClass?: string; // Tailwind background class for icon container
}

// 3. 统一配置对象
export const APPLICATION_PROVIDER_ENUMS: Record<
  BuiltinApplicationProvider,
  ApplicationProviderEnumDict
> = {
  'internal-standalone': {
    value: 'internal-standalone',
    text: 'internal-standalone',
    get label() {
      return $t('application.providers.internalStandalone', '内部独立应用');
    },
    color: 'bg-blue-500',
    icon: 'lucide:box',
    bgClass: 'text-white',
  },
  'internal-integrated': {
    value: 'internal-integrated',
    text: 'internal-integrated',
    get label() {
      return $t('application.providers.internalIntegrated', '内部集成应用');
    },
    color: 'bg-[#d97706]', // amber-600
    icon: 'lucide:network',
    bgClass: 'text-white',
  },
  'wechat-webapp': {
    value: 'wechat-webapp',
    text: 'wechat-webapp',
    get label() {
      return $t('application.providers.wechatWebapp', '微信网站应用');
    },
    color: 'bg-[#00c250]',
    icon: 'ant-design:wechat-filled',
    bgClass: 'text-white',
  },
  'wechat-miniapp': {
    value: 'wechat-miniapp',
    text: 'wechat-miniapp',
    get label() {
      return $t('application.providers.wechatMiniapp', '微信小程序应用');
    },
    color: 'bg-indigo-500', // matches screenshot purple/indigo
    icon: 'mdi:all-inclusive',
    bgClass: 'text-white',
  },
  'dingtalk-ent-app': {
    value: 'dingtalk-ent-app',
    text: 'dingtalk-ent-app',
    get label() {
      return $t('application.providers.dingtalkEntApp', '钉钉企业内部应用');
    },
    color: 'bg-sky-500',
    icon: 'ant-design:dingding-outlined',
    bgClass: 'text-white',
  },
  'third-party': {
    value: 'third-party',
    text: 'third-party',
    get label() {
      return $t('application.providers.thirdParty', '第三方应用');
    },
    color: 'bg-purple-400',
    icon: 'lucide:link-2',
    bgClass: 'text-white',
  },
};

/**
 * 获取提供商对应的配置信息
 */
export function getProviderConfig(
  provider: string,
): ApplicationProviderEnumDict | undefined {
  return APPLICATION_PROVIDER_ENUMS[provider as BuiltinApplicationProvider];
}
