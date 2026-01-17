import type { Component } from 'vue';

export type SelectorType = 'cert' | 'device' | 'product';

const selectorRef = new Map<SelectorType, Component>();

export const selectorRegistry = {
  add(name: SelectorType, comp: Component) {
    selectorRef.set(name, comp);
  },
  get(name: SelectorType) {
    return selectorRef.get(name);
  },
  delete(name: SelectorType) {
    selectorRef.delete(name);
  },
  clear() {
    selectorRef.clear();
  },
};

export async function registerSelectors() {
  // 动态导入以避免循环依赖，并等待所有模块加载完成
  await Promise.all([
    import('./certificate/certificate-selector').then(
      ({ CertificateSelector }) => {
        selectorRegistry.add('cert', CertificateSelector);
      },
    ),
    import('./device/device-selector').then(({ DeviceSelector }) => {
      selectorRegistry.add('device', DeviceSelector);
    }),
    import('./product/product-selector').then(({ ProductSelector }) => {
      selectorRegistry.add('product', ProductSelector);
    }),
  ]);
}
