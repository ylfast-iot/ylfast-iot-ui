import { ref, watch } from 'vue';

import { useDebounceFn } from '@vueuse/core';

export function useNotifySelect(formModel?: any) {
  /**
   * 深度获取对象属性
   */
  const getDeepValue = (obj: any, path: string) => {
    if (!obj || !path) return undefined;

    // 将 a.b.c[0].d 转换为路径数组 ['a', 'b', 'c', '0', 'd']
    const paths = path.replaceAll(/\[(\d+)\]/g, '.$1').split('.');
    let res = obj;
    for (const p of paths) {
      if (res === null || res === undefined) return undefined;
      res = res[p];
    }
    return res;
  };

  /**
   * 解析变量占位符 ${key}
   */
  const resolvePlaceholder = (val: any) => {
    if (typeof val === 'string' && val.includes('${')) {
      return val.replaceAll(/\$\{(.*?)\}/g, (_, name) => {
        const deepVal = getDeepValue(formModel, name.trim());
        return deepVal === undefined ? '' : String(deepVal);
      });
    }
    return val;
  };

  /**
   * 提取占位符中的键名 (例如 ${deptId} -> deptId)
   */
  const extractPlaceholderKey = (val: any) => {
    if (typeof val === 'string' && val.includes('${')) {
      const match = val.match(/\$\{(.*?)\}/);
      return match ? match[1]?.trim() : undefined;
    }
    return undefined;
  };

  /**
   * 响应式观察占位符依赖
   */
  const useReactivePlaceholder = (valGetter: () => any, debounceMs = 300) => {
    const resolvedValue = ref(resolvePlaceholder(valGetter()));

    const update = useDebounceFn(() => {
      resolvedValue.value = resolvePlaceholder(valGetter());
    }, debounceMs);

    watch(
      () => {
        const val = valGetter();
        const key = extractPlaceholderKey(val);
        if (key && formModel) {
          return getDeepValue(formModel, key);
        }
        return val;
      },
      () => {
        update();
      },
      { immediate: true },
    );

    return resolvedValue;
  };

  /**
   * 包装 API 适配 YlApiSelect (把 params 对象解构成位置参数)
   */
  const wrapApiConfigId = (
    apiFn: (configId: string) => Promise<any>,
    configId: any,
  ) => {
    return async () => {
      const resolvedId = resolvePlaceholder(configId);
      if (!resolvedId) return [];
      return apiFn(String(resolvedId));
    };
  };

  return {
    getDeepValue,
    resolvePlaceholder,
    extractPlaceholderKey,
    useReactivePlaceholder,
    wrapApiConfigId,
  };
}
