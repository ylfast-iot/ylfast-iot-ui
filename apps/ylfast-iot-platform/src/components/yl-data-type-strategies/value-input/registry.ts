import type { Component } from 'vue';

import type { DataType } from '#/types/data-type';

const registry = new Map<string, Component>();

export function registerFormItemComponent(
  type: DataType,
  component: Component,
) {
  registry.set(type, component);
}

export function getFormItemComponent(type: DataType): Component | undefined {
  return registry.get(type);
}
