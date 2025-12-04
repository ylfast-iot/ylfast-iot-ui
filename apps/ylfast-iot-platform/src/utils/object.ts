/**
 * 深度合并多个源对象到一个目标对象。
 * - 它会递归地合并嵌套的对象。
 * - 对于数组，默认行为是替换（来自源对象的数组会完全覆盖目标对象中的数组）。
 * 可以通过 `options.arrayMerge` 策略来自定义数组的合并行为。
 * @param target 目标对象，合并结果会写入此对象。
 * @param sources 一个或多个源对象，它们的属性将被合并到目标对象中。
 * @param options 合并选项。
 * @returns 合并后的目标对象。
 */
// 辅助类型，用于将联合类型转换为交集类型
// 这用于确保返回类型正确地包含了所有源对象的属性。
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;
export function deepMerge<T extends object, S extends object[]>(
  target: T,
  sources: [...S],
  options: {
    /** 数组合并策略。
     * - 'replace': (默认) 源数组完全替换目标数组。
     * - 'concat': 源数组元素追加到目标数组末尾。
     */
    arrayMerge?: 'concat' | 'replace';
  } = {},
): T & UnionToIntersection<S[number]> {
  // 定义数组合并策略的默认值
  const arrayMergeStrategy = options.arrayMerge || 'replace';

  if (typeof target !== 'object' || target === null) {
    // 目标对象必须是对象且非 null
    return target as any;
  }

  for (const source of sources) {
    if (typeof source !== 'object' || source === null) {
      // 跳过非对象或 null 的源
      continue;
    }

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const targetValue = (target as any)[key];
        const sourceValue = (source as any)[key];

        const isArray =
          Array.isArray(targetValue) && Array.isArray(sourceValue);
        const isObject =
          typeof targetValue === 'object' &&
          targetValue !== null &&
          typeof sourceValue === 'object' &&
          sourceValue !== null &&
          !isArray; // 排除数组

        if (isObject) {
          // 递归合并嵌套对象
          (target as any)[key] = deepMerge(targetValue, [sourceValue], options);
        } else if (isArray) {
          // 处理数组合并
          if (arrayMergeStrategy === 'concat') {
            // 'concat' 策略：追加元素
            // @ts-nocheck
            (target as any)[key] = [...targetValue, ...sourceValue];
          } else {
            // 'replace' 策略 (默认)：源数组替换目标数组
            (target as any)[key] = sourceValue;
          }
        } else {
          // 简单值：直接赋值
          (target as any)[key] = sourceValue;
        }
      }
    }
  }

  return target as any;
}
