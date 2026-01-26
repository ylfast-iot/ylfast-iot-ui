import type { DeviceMetadata } from '#/types/metadata';

import { ref } from 'vue';

type MergeStrategy = 'ignore' | 'intersect' | 'merge' | 'overwrite';

/**
 * 物模型 (TSL) 合并逻辑 Hook
 * 处理插件物模型、传输协议物模型与现有物模型之间的冲突检测与合并
 */
export function useTslMerge(onSave: (tsl: DeviceMetadata) => Promise<void>) {
  // 是否显示合并策略模态框
  const tslConflictVisible = ref(false);
  // 合并步骤: 0-无, 1-插件vs传输协议, 2-中间结果vs现有
  const tslMergeStep = ref(0);
  // 当前选择的合并策略
  const tslMergeStrategy = ref<MergeStrategy>('merge');
  // 待处理的 TSL 对象缓存
  const pendingTsl = ref<Record<string, any>>({});

  /**
   * 辅助函数：深度合并 TSL 对象
   * 针对 properties, functions, events, tags 数组进行基于 ID 的合并
   * 同时合并 expands 扩展属性
   * @param target 目标对象 (通常是旧值或基础值)
   * @param source 源对象 (通常是新值或覆盖值)
   */
  function mergeTsl(
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
    // DeviceMetadata doesn't strictly define tags but existing code handled it, keeping if checked via explicit casting or ignoring if not in type
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
   * 辅助函数：取交集 TSL 对象
   * 只保留两个 TSL 中都存在的项（按 ID 匹配）
   * @param target 目标对象
   * @param source 源对象
   */
  function intersectTsl(
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
   * 用户确认合并策略
   * 根据当前步骤和选择的策略执行合并
   */

  /**
   * 用户确认合并策略
   * 根据当前步骤和选择的策略执行合并
   */
  function confirmMerge() {
    let result = {} as DeviceMetadata;

    if (tslMergeStep.value === 1) {
      // 步骤 1: 合并 插件物模型 + 传输协议物模型
      const { plugin, transport } = pendingTsl.value; // plugin 通常被视为源/新值
      switch (tslMergeStrategy.value) {
        case 'ignore': {
          result = transport;

          break;
        }
        case 'intersect': {
          // 取交集：只保留两者共有的项
          result = intersectTsl(transport, plugin);

          break;
        }
        case 'overwrite': {
          result = plugin;

          break;
        }
        default: {
          // 默认合并：transport 为基准，plugin 覆盖
          result = mergeTsl(transport, plugin);
        }
      }

      // 准备步骤 2
      const { existing } = pendingTsl.value;
      if (Object.keys(existing).length > 0) {
        pendingTsl.value = { existing, interim: result };
        tslMergeStep.value = 2;
        // 保持模态框打开进入下一步
      } else {
        // 如果没有现有的 TSL，直接保存
        onSave(result);
        tslConflictVisible.value = false;
      }
    } else if (tslMergeStep.value === 2) {
      // 步骤 2: 合并 中间结果(interim) + 现有物模型(existing)
      const { existing, interim } = pendingTsl.value; // interim 是新生成的值
      switch (tslMergeStrategy.value) {
        case 'ignore': {
          result = existing;

          break;
        }
        case 'intersect': {
          // 取交集：只保留两者共有的项
          result = intersectTsl(existing, interim);

          break;
        }
        case 'overwrite': {
          result = interim;

          break;
        }
        default: {
          // 默认合并：existing 为基准，interim 覆盖
          result = mergeTsl(existing, interim);
        }
      }
      onSave(result);
      tslConflictVisible.value = false;
    }
  }

  const hasProps = (obj: any) => Object.keys(obj).length > 0;

  /**
   * 执行合并检查
   * 自动检测网关类型和冲突情况，决定合并策略
   *
   * 逻辑：
   * 1. 插件模式（pluginTsl 和 transportTsl 都有值）：
   *    - 先合并 plugin + transport → interim
   *    - 再合并 interim + existing
   *    - 两步都可能弹窗
   *
   * 2. 非插件模式（只有 transportTsl 有值）：
   *    - 直接合并 transport + existing
   *    - 只一步，可能弹窗
   *
   * 3. 无物模型（都没有值）：
   *    - 直接保存空物模型或 existing
   */
  function runMergeCheck(pluginTsl: any, transportTsl: any, existingTsl: any) {
    const hasPlugin = hasProps(pluginTsl);
    const hasTransport = hasProps(transportTsl);
    const hasExisting = hasProps(existingTsl);

    // 场景1: 插件模式 - 需要两步合并
    if (hasPlugin && hasTransport) {
      // 第一步：合并插件物模型 + 传输协议物模型
      pendingTsl.value = {
        existing: existingTsl,
        plugin: pluginTsl,
        transport: transportTsl,
      };
      tslMergeStep.value = 1;
      tslConflictVisible.value = true;
      return;
    }

    // 场景2: 非插件模式 - 只有传输协议物模型
    if (hasTransport && !hasPlugin) {
      // 如果已有现有物模型，需要决定如何合并
      if (hasExisting) {
        pendingTsl.value = {
          existing: existingTsl,
          interim: transportTsl,
        };
        tslMergeStep.value = 2; // 直接进入第二步（transport vs existing）
        tslConflictVisible.value = true;
        return;
      } else {
        // 没有现有物模型，直接使用 transportTsl
        onSave(transportTsl);
        return;
      }
    }

    // 场景3: 只有插件物模型（罕见，但兼容处理）
    if (hasPlugin && !hasTransport) {
      if (hasExisting) {
        pendingTsl.value = {
          existing: existingTsl,
          interim: pluginTsl,
        };
        tslMergeStep.value = 2;
        tslConflictVisible.value = true;
        return;
      } else {
        onSave(pluginTsl);
        return;
      }
    }

    // 场景4: 都没有物模型
    // 保留现有物模型（如果有），或保存空对象
    const finalTsl = hasExisting ? existingTsl : {};
    onSave(finalTsl);
  }

  return {
    confirmMerge,
    mergeTsl,
    pendingTsl,
    runMergeCheck,
    tslConflictVisible,
    tslMergeStep,
    tslMergeStrategy,
  };
}
