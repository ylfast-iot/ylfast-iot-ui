import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { EmunTypeDef, EnumItem, Rule } from '#/types/data-type';

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
  // Prioritize EmunTypeDef's 'enums' property if type is ENUM
  if (prop.type.type === 'ENUM') {
    const enumDef = prop.type as EmunTypeDef; // Cast to EmunTypeDef
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
