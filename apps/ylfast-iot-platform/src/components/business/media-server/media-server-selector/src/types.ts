import type { IotMediaServerApi } from '#/api/iot/media-server';
import type {
  BaseSelectorProps,
  SelectorActionType,
} from '#/components/business/common-selector/src/types';

/**
 * 媒体服务选择器属性
 */
export type MediaServerSelectorProps =
  BaseSelectorProps<IotMediaServerApi.IotMediaServerConfig>;

/**
 * 媒体服务选择器 Action 类型
 */
export type MediaServerSelectorActionType =
  SelectorActionType<IotMediaServerApi.IotMediaServerConfig>;
