import type { EnumDict } from '#/types/global';

import { $t } from '@vben/locales';

/**
 * 通道连接类型
 * CHANNEL_NETWORK: 网络组件
 * CHANNEL_COLLECT: 采集通道
 * CHANNEL_SUB: 子设备/直连
 * CHANNEL_MEDIA_VIDEO: 视频媒体
 * CHANNEL_PLUGIN: 插件驱动
 */
export type ChannelType =
  | 'CHANNEL_COLLECT'
  | 'CHANNEL_MEDIA_VIDEO'
  | 'CHANNEL_NETWORK'
  | 'CHANNEL_PLUGIN'
  | 'CHANNEL_SUB';

export interface ChannelTypeEnumDict extends EnumDict<ChannelType> {
  color?: string;
  icon?: string;
}

/**
 * 通道类型映射字典
 */
export const CHANNEL_TYPE: { [key in ChannelType]: ChannelType } = {
  CHANNEL_COLLECT: 'CHANNEL_COLLECT',
  CHANNEL_MEDIA_VIDEO: 'CHANNEL_MEDIA_VIDEO',
  CHANNEL_NETWORK: 'CHANNEL_NETWORK',
  CHANNEL_PLUGIN: 'CHANNEL_PLUGIN',
  CHANNEL_SUB: 'CHANNEL_SUB',
} as const;

/**
 * 通道类型详细配置 (含 UI 元数据)
 */
export const CHANNEL_TYPE_ENUMS: { [key in ChannelType]: ChannelTypeEnumDict } =
  {
    CHANNEL_COLLECT: {
      color: 'purple',
      icon: 'lucide:folder',
      get label() {
        return $t('gateway.channels.channel');
      },
      get text() {
        return $t('gateway.channels.channel');
      },
      value: 'CHANNEL_COLLECT',
    },
    CHANNEL_MEDIA_VIDEO: {
      color: 'orange',
      icon: 'lucide:video',
      label: '视频媒体',
      text: '视频媒体',
      value: 'CHANNEL_MEDIA_VIDEO',
    },
    CHANNEL_NETWORK: {
      color: 'blue',
      icon: 'lucide:network',
      get label() {
        return $t('gateway.channels.network');
      },
      get text() {
        return $t('gateway.channels.network');
      },
      value: 'CHANNEL_NETWORK',
    },
    CHANNEL_PLUGIN: {
      color: 'green',
      icon: 'lucide:plugin',
      get label() {
        return $t('gateway.channels.plugin');
      },
      get text() {
        return $t('gateway.channels.plugin');
      },
      value: 'CHANNEL_PLUGIN',
    },
    CHANNEL_SUB: {
      color: 'cyan',
      icon: 'lucide:box',
      get label() {
        return $t('gateway.channels.sub');
      },
      get text() {
        return $t('gateway.channels.sub');
      },
      value: 'CHANNEL_SUB',
    },
  };
