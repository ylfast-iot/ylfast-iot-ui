import type { I18nMessage, I18nMessagesData } from './types';

/**
 * 验证国际化数据格式是否正确
 */
export function validateI18nData(data: any): data is I18nMessagesData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  for (const key of Object.keys(data)) {
    const value = data[key];
    if (!value || typeof value !== 'object') {
      return false;
    }

    // 检查每个语言的值是否为字符串
    for (const lang of Object.keys(value)) {
      if (typeof value[lang] !== 'string') {
        return false;
      }
    }
  }

  return true;
}

/**
 * 合并国际化数据
 * 如果键已存在，会合并翻译（新数据优先）
 */
export function mergeI18nData(
  target: I18nMessagesData,
  source: I18nMessagesData,
): I18nMessagesData {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = result[key];
    if (sourceValue) {
      // eslint-disable-next-line unicorn/prefer-ternary
      if (targetValue) {
        // 合并翻译
        result[key] = { ...targetValue, ...sourceValue };
      } else {
        // 新键
        result[key] = { ...sourceValue };
      }
    }
  }

  return result;
}

/**
 * 导出为 JSON 字符串
 */
export function exportToJson(data: I18nMessagesData, pretty = true): string {
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

/**
 * 从 JSON 字符串导入
 */
export function importFromJson(json: string): I18nMessagesData {
  try {
    const data = JSON.parse(json);
    if (!validateI18nData(data)) {
      throw new Error('Invalid i18n data format');
    }
    return data;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${(error as Error).message}`);
  }
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 检查键名是否有效（不支持嵌套键）
 */
export function isValidKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  // 不允许空字符串
  if (key.trim() === '') {
    return false;
  }

  // 不允许包含点号（避免嵌套键的误解）
  if (key.includes('.')) {
    return false;
  }

  return true;
}

/**
 * 初始化空翻译对象
 */
export function createEmptyTranslations(languages: string[]): I18nMessage {
  const translations: I18nMessage = {};
  for (const lang of languages) {
    translations[lang] = '';
  }
  return translations;
}

/**
 * 确保翻译对象包含所有语言
 */
export function ensureAllLanguages(
  translations: I18nMessage,
  languages: string[],
): I18nMessage {
  const result = { ...translations };
  for (const lang of languages) {
    if (!(lang in result)) {
      result[lang] = '';
    }
  }
  return result;
}

/**
 * 从数据中提取所有使用的语言
 */
export function extractLanguages(data: I18nMessagesData): string[] {
  const languagesSet = new Set<string>();

  for (const key of Object.keys(data)) {
    const translations = data[key];
    if (translations) {
      for (const lang of Object.keys(translations)) {
        languagesSet.add(lang);
      }
    }
  }

  return [...languagesSet];
}
