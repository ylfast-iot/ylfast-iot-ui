import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { EnumItem, EnumTypeDef, Rule } from '#/types/data-type';

import { $t } from '@vben/locales';

export function getSpan(prop: ConfigPropertyMetadata) {
  return prop.type.expands?.span || 24;
}

export function getRules(prop: ConfigPropertyMetadata): Rule[] {
  const rules = prop.type.expands?.rules;
  if (rules) return Array.isArray(rules) ? rules : [rules];
  if (prop.type.expands?.required) {
    return [
      {
        required: true,
        message: `${$t('ylConfigMetadataForm.pleaseEnter')}${prop.name}`,
        trigger: ['change', 'blur'],
      },
    ];
  }
  return [];
}

export function isVisible(prop: ConfigPropertyMetadata) {
  return prop.type.expands?.ifShow !== false;
}

export function isDisabled(prop: ConfigPropertyMetadata) {
  return prop.type.expands?.disabled;
}

export function getComponentProps(prop: ConfigPropertyMetadata) {
  return prop.type.expands?.componentProps || {};
}

export function getEnumOptions(prop: ConfigPropertyMetadata) {
  // Prioritize EnumTypeDef's 'enums' property if type is ENUM
  if (prop.type.type === 'ENUM') {
    const enumDef = prop.type as EnumTypeDef; // Cast to EnumTypeDef
    if (enumDef.enums && Array.isArray(enumDef.enums)) {
      return enumDef.enums.map((item: EnumItem) => ({
        label: item.label || String(item.value), // Use label or value as label
        value: item.value,
        // Add other properties if needed for Select, e.g., disabled
      }));
    }
  }

  // Fallback to existing options in expands or componentProps
  const options =
    prop.type.expands?.options || prop.type.expands?.componentProps?.options;
  if (Array.isArray(options)) {
    return options;
  }
  return [];
}

/**
 * 格式化配置值用于显示
 * @param value 原始值
 * @param prop 属性元数据
 * @returns 格式化后的显示值
 */
export function formatValue(value: any, prop: ConfigPropertyMetadata): string {
  // 空值处理
  if (value === null || value === undefined || value === '') {
    return '';
  }

  // 布尔类型
  if (prop.type.type === 'BOOLEAN') {
    return value ? '是' : '否';
  }

  // 枚举类型
  if (prop.type.type === 'ENUM' && prop.type.elements) {
    const item = prop.type.elements.find((el: any) => el.value === value);
    return item?.text || String(value);
  }

  // 数组类型
  if (prop.type.type === 'ARRAY') {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  }

  // 对象类型
  if (prop.type.type === 'OBJECT') {
    return JSON.stringify(value, null, 2);
  }

  // 其他类型直接转字符串
  return String(value);
}
