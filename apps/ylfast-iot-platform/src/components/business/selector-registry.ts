import type { Component } from 'vue';

export type SelectorType =
  | 'cert'
  | 'device'
  | 'gateway'
  | 'mediaServer'
  | 'network'
  | 'notifyConfig'
  | 'notifyTemplate'
  | 'plugin'
  | 'product'
  | 'protocol'
  | 'user';

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
    import('./protocol/protocol-selector').then(({ ProtocolSelector }) => {
      selectorRegistry.add('protocol', ProtocolSelector);
    }),
    import('./network/network-selector').then(({ NetworkSelector }) => {
      selectorRegistry.add('network', NetworkSelector);
    }),
    import('./gateway/gateway-selector').then(({ GatewaySelector }) => {
      selectorRegistry.add('gateway', GatewaySelector);
    }),
    import('./plugin/plugin-selector').then(({ PluginSelector }) => {
      selectorRegistry.add('plugin', PluginSelector);
    }),
    import('./user/user-selector').then(({ UserSelector }) => {
      selectorRegistry.add('user', UserSelector);
    }),
    import('./media-server/media-server-selector').then(
      ({ MediaServerSelector }) => {
        selectorRegistry.add('mediaServer', MediaServerSelector);
      },
    ),
    import('./notify/config-selector').then(({ NotifyConfigSelector }) => {
      selectorRegistry.add('notifyConfig', NotifyConfigSelector);
    }),
    import('./notify/template-selector').then(({ NotifyTemplateSelector }) => {
      selectorRegistry.add('notifyTemplate', NotifyTemplateSelector);
    }),
  ]);
}
