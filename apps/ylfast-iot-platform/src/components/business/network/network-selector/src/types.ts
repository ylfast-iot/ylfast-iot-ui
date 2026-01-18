import type { IotNetCompApi } from '#/api/iot/network-config';
import type {
  BaseSelectorProps,
  SelectorActionType,
} from '#/components/business/common-selector/src/types';

/**
 * 网络组件选择器属性
 */
export type NetworkSelectorProps = BaseSelectorProps<IotNetCompApi.IotNetComp>;

/**
 * 网络组件选择器 Action 类型
 */
export type NetworkSelectorActionType =
  SelectorActionType<IotNetCompApi.IotNetComp>;
