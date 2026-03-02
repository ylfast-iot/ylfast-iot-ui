import type { IotNotifyChannelApi } from '#/api/iot/notify/channel';

/**
 * 按 type.value 分组的订阅提供商信息
 */
export interface SubscriptionGroup {
  typeId: string;
  typeName: string;
  providers: IotNotifyChannelApi.SubscriberProviderInfo[];
}

/**
 * 将 SubscriberProviderInfo[] 按 type.value 分组
 */
export function groupByType(
  providers: IotNotifyChannelApi.SubscriberProviderInfo[],
): SubscriptionGroup[] {
  const map = new Map<string, SubscriptionGroup>();

  for (const p of providers) {
    const key = p.type?.id || 'unknown';
    if (!map.has(key)) {
      map.set(key, {
        typeId: key,
        typeName: p.type?.name || key,
        providers: [],
      });
    }
    map.get(key)?.providers.push(p);
  }

  // 按 order 排序
  for (const group of map.values()) {
    group.providers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  return [...map.values()];
}
