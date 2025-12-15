import type { Recordable } from '#/adapter';

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
// 根据key获取对象中的值 支持 多层级
import { isArray, isFunction, isObject, isString } from './is';

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

/**
 * 从对象中获取指定路径的值（支持多级路径）
 * @param key 点分隔的路径（如 'a.b.c'）
 * @param obj 目标对象
 */
export function getValue(key: string, obj: Recordable) {
  // 修复：key 不存在时返回空数组（而非空字符串），避免类型错误
  const keys = key ? key.split('.') : [];

  // 初始化当前嵌套对象为原始对象
  let currentObj = obj;

  // 遍历路径数组，逐层取值
  for (const currentKey of keys) {
    // 修复2：用 Object.prototype.hasOwnProperty.call 替代直接调用
    const hasKey = Object.prototype.hasOwnProperty.call(currentObj, currentKey);
    // 检查当前对象存在，且包含当前 key（仅自身属性，排除原型链）
    if (currentObj && hasKey) {
      currentObj = currentObj[currentKey];
    } else {
      // 某一级不存在，直接返回 undefined
      return undefined;
    }
  }

  // 遍历完成，返回最终取值
  return currentObj;
}

/**
 * 给对象的多层级路径设置值（支持自动创建不存在的嵌套对象）
 * @param key 点分隔的路径（如 'a.b.c'）
 * @param value 要设置的值
 * @param obj 目标对象（会直接修改原对象）
 */
export function setValue(key: string, value: any, obj: Recordable): void {
  if (!obj || typeof obj !== 'object') {
    throw new Error('目标对象必须是非 null 的对象类型');
  }
  if (!key) return; // 空 key 不处理

  const keys = key.split('.');
  let currentObj: Recordable = obj;

  // 遍历路径（最后一个 key 单独处理赋值逻辑）
  for (let i = 0; i < keys.length; i++) {
    const currentKey = keys[i];
    if (!currentKey) {
      return;
    }
    const isLastKey = i === keys.length - 1;

    // 安全判断当前对象是否有自身属性（修复 no-prototype-builtins 规则）
    const hasCurrentKey = Object.prototype.hasOwnProperty.call(
      currentObj,
      currentKey,
    );
    const currentValue = currentObj[currentKey];

    // 非最后一级：确保当前层级是对象（不存在则创建）
    if (isLastKey) {
      // 最后一级：赋值（修复布尔值被错误覆盖的问题）
      currentObj[currentKey] = value ?? ''; // 仅当 value 为 undefined/null 时赋值为空字符串，布尔值保留原值
    } else {
      // 若当前 key 不存在 / 存在但不是对象（排除 null），则创建空对象
      if (
        !hasCurrentKey ||
        typeof currentValue !== 'object' ||
        currentValue === null
      ) {
        currentObj[currentKey] = {};
      }
      // 进入下一级
      currentObj = currentObj[currentKey];
    }
  }
}

/**
 * 字符串中括号变量替换
 * @param template
 * @param variables
 */
export function replaceVariables(
  template: string,
  variables: Record<string, any>,
) {
  return template.replaceAll(/\{(\w+)\}/g, (match, variableName) => {
    return variables[variableName] || match;
  });
}

/**
 * 解析模板变量
 * @param source
 * @param callback 单个变量匹配回调
 */
export function parseVars(
  source: any,
  callback?: (_var?: string) => any,
): string[] {
  function parseStr(val: string): string[] {
    const vars: string[] = [];
    val.replaceAll(/\{(\w+)\}/g, (match, variableName) => {
      const varName =
        (callback &&
          isFunction(callback) &&
          (callback(variableName) || variableName)) ||
        variableName;
      vars.push(varName);
      return match;
    });
    return vars;
  }
  function parseObj(val: Recordable): string[] {
    const vars: string[] = [];
    Object.entries(val).forEach(([key, value]) => {
      // 解析key
      const keyVars = parseStr(key);
      // 解析未知值
      const valueVars = parse(value);
      keyVars.length > 0 && vars.push(...keyVars);
      valueVars.length > 0 && vars.push(...valueVars);
    });
    return vars;
  }
  function parseArray(val: any[]): string[] {
    const vars: string[] = [];
    val.forEach((i) => {
      const itemVars = parse(i);
      itemVars.length > 0 && vars.push(...itemVars);
    });
    return vars;
  }
  // 解析
  function parse(val: string): string[] {
    if (isString(val)) {
      return parseStr(val);
    }
    if (val && isObject(val)) {
      return parseObj(val);
    }

    if (isArray(val)) {
      return parseArray(val);
    }
    return [];
  }
  return parse(source);
}

/**
 * 导出json文件
 * @param data 导出数据
 * @param filename 文件名
 */
export function exportJsonFile(
  data: Recordable | Recordable[] | string,
  filename = 'jsonFile',
) {
  try {
    isString(data) && JSON.parse(data);
  } catch {
    console.error('导出数据格式错误');
    return;
  }

  if (!data) {
    return;
  }
  // 导出数据
  const a = document.createElement('a');
  const blob = new Blob([JSON.stringify(data)], { type: 'text/json' });
  const e = new MouseEvent('click');

  a.download = filename;
  a.href = window.URL.createObjectURL(blob);
  a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
  a.dispatchEvent(e);
}
