import type { MergeStrategy } from './types';

import type { DeviceMetadata } from '#/types/metadata';

/**
 * 深度合并 TSL 对象（取并集）
 * 针对 properties, functions, events 数组进行基于 ID 的合并
 * 同时合并 expands 扩展属性
 * @param target 目标对象 (通常是旧值或基础值)
 * @param source 源对象 (通常是新值或覆盖值)
 */
export function mergeTsl(
  target: DeviceMetadata,
  source: DeviceMetadata,
): DeviceMetadata {
  const result = { ...target };

  // 辅助函数：按 ID 合并数组
  const mergeArray = (targetArr: any[], sourceArr: any[]) => {
    if (!sourceArr) return targetArr || [];
    if (!targetArr) return sourceArr || [];

    // 使用 Map 按 ID 去重/覆盖
    const map = new Map(targetArr.map((item) => [item.id, item]));
    sourceArr.forEach((item) => {
      map.set(item.id, item); // 如果存在则覆盖，不存在则添加
    });
    return [...map.values()];
  };

  if (source.properties) {
    result.properties = mergeArray(result.properties, source.properties);
  }
  if (source.functions) {
    result.functions = mergeArray(result.functions, source.functions);
  }
  if (source.events) {
    result.events = mergeArray(result.events, source.events);
  }
  if ((source as any).tags) {
    (result as any).tags = mergeArray(
      (result as any).tags,
      (source as any).tags,
    );
  }

  // 合并 expands
  if (source.expands) {
    result.expands = { ...result.expands } as any;

    // 1. 合并 propertyGroups (数组按ID合并)
    if (result.expands && source.expands.propertyGroups) {
      const targetGroups = result.expands?.propertyGroups || [];
      result.expands.propertyGroups = mergeArray(
        targetGroups,
        source.expands.propertyGroups,
      ) as any[];
    }

    // 2. 合并 propertyMapping (对象合并)
    if (result.expands && source.expands.propertyMapping) {
      result.expands.propertyMapping = {
        ...result.expands.propertyMapping,
        ...source.expands.propertyMapping,
      };
    }

    // 3. 合并其他 expands 属性 (简单覆盖)
    Object.keys(source.expands).forEach((key) => {
      if (key !== 'propertyGroups' && key !== 'propertyMapping') {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        result.expands![key] = source.expands![key];
      }
    });
  }

  return result;
}

/**
 * 取交集 TSL 对象
 * 只保留两个 TSL 中都存在的项（按 ID 匹配）
 * @param target 目标对象
 * @param source 源对象
 */
export function intersectTsl(
  target: DeviceMetadata,
  source: DeviceMetadata,
): DeviceMetadata {
  const result = { ...target };

  // 辅助函数：按 ID 取交集
  const intersectArray = (targetArr: any[], sourceArr: any[]) => {
    if (!sourceArr || !targetArr) return [];

    const sourceIds = new Set(sourceArr.map((item) => item.id));
    return targetArr.filter((item) => sourceIds.has(item.id));
  };

  // 只保留共有的 properties, functions, events
  result.properties = intersectArray(result.properties, source.properties);
  result.functions = intersectArray(result.functions, source.functions);
  result.events = intersectArray(result.events, source.events);

  if ((source as any).tags && (result as any).tags) {
    (result as any).tags = intersectArray(
      (result as any).tags,
      (source as any).tags,
    );
  }

  // 对于 expands，取交集
  if (source.expands && result.expands) {
    const intersectedExpands: any = {};

    // propertyGroups 取交集
    if (source.expands.propertyGroups && result.expands.propertyGroups) {
      intersectedExpands.propertyGroups = intersectArray(
        result.expands.propertyGroups,
        source.expands.propertyGroups,
      );
    }

    // propertyMapping 取交集（保留两边都存在的 key）
    if (source.expands.propertyMapping && result.expands.propertyMapping) {
      intersectedExpands.propertyMapping = {};
      Object.keys(result.expands.propertyMapping).forEach((key) => {
        if (source.expands?.propertyMapping?.[key]) {
          intersectedExpands.propertyMapping[key] =
            result.expands?.propertyMapping?.[key];
        }
      });
    }

    result.expands = intersectedExpands as any;
  } else {
    result.expands = {} as any;
  }

  return result;
}

/**
 * 应用指定的合并策略
 * @param strategy 合并策略
 * @param target 目标物模型（基准）
 * @param source 源物模型（待合并）
 */
export function applyStrategy(
  strategy: MergeStrategy,
  target: DeviceMetadata,
  source: DeviceMetadata,
): DeviceMetadata {
  switch (strategy) {
    case 'ignore': {
      return target;
    }
    case 'intersect': {
      return intersectTsl(target, source);
    }
    case 'merge': {
      return mergeTsl(target, source);
    }
    case 'overwrite': {
      return source;
    }
    default: {
      return mergeTsl(target, source);
    } // 默认合并
  }
}
