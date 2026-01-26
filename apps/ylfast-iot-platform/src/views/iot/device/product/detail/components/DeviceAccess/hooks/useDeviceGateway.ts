import type { IotDeviceProductApi } from '#/api/iot/device/product';

import { computed, ref } from 'vue';

import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { getProductConfigMetadataByAccessId } from '#/api/iot/device/instance';
import {
  getChannels,
  getGatewayDetail,
  getGatewayProviders,
  IotGatewayApi,
} from '#/api/iot/gateway';
import {
  getDriverProducts,
  getPluginDataIdMapping,
  IotPluginApi,
} from '#/api/iot/plugin';
import { useGatewaySelector } from '#/components/business/gateway/gateway-selector';
import { useGatewayChannel } from '#/views/iot/gateway/hooks/useGatewayChannel';
import { useGatewayRoutes } from '#/views/iot/gateway/hooks/useGatewayRoutes';

/**
 * 设备接入网关逻辑 Hook
 * 处理网关选择、信息加载、配置元数据加载以及插件产品映射等逻辑
 */
export function useDeviceGateway(props: {
  product: IotDeviceProductApi.ProductDetail;
}) {
  const loading = ref(false);
  // 当前选择的网关详情
  const gatewayDetail = ref<IotGatewayApi.DeviceGatewayDetail>();
  // 接入方式映射表 (ID -> Name)
  const providerMap = ref<Record<string, string>>({});
  // 通道类型映射表 (ID -> Name)
  const channelMap = ref<Record<string, string>>({});
  // 动态配置表单的元数据
  const configMetadata = ref<any[]>([]);
  // 插件下的产品列表
  const pluginProducts = ref<IotPluginApi.DeviceProduct[]>([]);
  // 当前选中的插件产品ID
  const selectedPluginProductId = ref<string>();
  // 当前选中的插件产品详细数据
  const pluginProductData = ref<IotPluginApi.DeviceProduct>();
  // 配置表单的数据模型
  const configFormModel = ref<Record<string, any>>({});

  // 使用网关选择器 Hook
  const [GatewaySelector, { open: openGatewaySelector }] = useGatewaySelector();

  // 计算属性：传输协议详情
  const transportDetail = computed(() => gatewayDetail.value?.transportDetail);

  // 判断通道类型
  const { isNetwork, isPlugin } = useGatewayChannel(
    computed(() => gatewayDetail.value?.channel),
  );

  // 获取路由列定义和排序后的路由列表
  const { routeColumns, sortedRoutes } = useGatewayRoutes(
    computed(() => transportDetail.value?.routes),
    computed(() => gatewayDetail.value?.transport || ''),
  );

  /**
   * 加载网关详细信息
   * @param gatewayId 网关ID
   */
  async function loadGatewayInfo(gatewayId: string) {
    loading.value = true;
    try {
      const detail = await getGatewayDetail(gatewayId);
      gatewayDetail.value = detail;

      // 如果映射表为空，则加载接入方式和通道类型列表
      if (Object.keys(providerMap.value).length === 0) {
        try {
          const [providers, channels] = await Promise.all([
            getGatewayProviders(),
            getChannels(),
          ]);

          providers.forEach((p) => {
            providerMap.value[p.id] = p.name;
          });

          channels.forEach((c) => {
            channelMap.value[c.id] = c.name;
          });
        } catch (error) {
          console.error('Failed to load providers or channels', error);
        }
      }

      // 加载配置元数据 (基于当前产品和网关)
      const metadata = await getProductConfigMetadataByAccessId(
        props.product.id,
        gatewayId,
      );
      configMetadata.value = metadata || [];

      // 初始化表单模型
      // 如果当前产品的网关ID与选择的网关ID一致，则回显配置；否则重置为空
      configFormModel.value =
        props.product.gatewayId === gatewayId
          ? structuredClone(props.product.configuration || {})
          : {};

      // 如果是插件类型的网关，加载插件产品列表
      if (isPlugin() && detail.channelId) {
        const products = await getDriverProducts(detail.channelId);
        pluginProducts.value = products || [];

        // 加载插件数据ID映射 (回显选中的插件产品)
        try {
          const mapping = await getPluginDataIdMapping(
            'product',
            gatewayId,
            props.product.id,
          );
          if (mapping && mapping.externalId) {
            selectedPluginProductId.value = mapping.externalId;
            handlePluginProductChange(mapping.externalId);
          }
        } catch (error) {
          console.warn('Failed to load plugin mapping', error);
        }
      }
    } catch (error) {
      console.error('Failed to load gateway info:', error);
      message.error($t('gateway.deviceAccess.loadFailed'));
    } finally {
      loading.value = false;
    }
  }

  /**
   * 打开网关选择器并处理选择
   */
  async function handleSelectGateway() {
    if (!openGatewaySelector) {
      message.error($t('gateway.deviceAccess.selectorInitFailed'));
      return;
    }
    const { rows } = await openGatewaySelector({
      displayMode: 'card',
      multiple: false,
    });

    if (rows && rows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const selected = rows[0]!;
      await loadGatewayInfo(selected.id);
    }
  }

  /**
   * 处理插件产品变更
   * @param val 选中的插件产品ID
   */
  function handlePluginProductChange(val: any) {
    const product = pluginProducts.value.find((p) => p.id === val);
    if (product) {
      pluginProductData.value = product;
    }
  }

  return {
    GatewaySelector,
    channelMap,
    configFormModel,
    configMetadata,
    gatewayDetail,
    handlePluginProductChange,
    handleSelectGateway,
    isNetwork,
    isPlugin,
    loadGatewayInfo,
    loading,
    pluginProductData,
    pluginProducts,
    providerMap,
    routeColumns,
    selectedPluginProductId,
    sortedRoutes,
    transportDetail,
  };
}
