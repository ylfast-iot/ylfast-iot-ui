import type { ConfigPropertyMetadata, Rule } from '#/types/config-metadata';

export function getSpan(prop: ConfigPropertyMetadata) {
  return prop.type.expands?.span || 24;
}

export function getRules(prop: ConfigPropertyMetadata): Rule[] {
  const rules = prop.type.expands?.rules;
  if (rules) return Array.isArray(rules) ? rules : [rules];
  if (prop.type.expands?.required) {
    return [{ required: true, message: `请输入${prop.name}` }];
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
  const options =
    prop.type.expands?.options || prop.type.expands?.componentProps?.options;
  if (Array.isArray(options)) {
    return options;
  }
  return [];
}
