<script setup lang="ts">
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { TabPane, Tabs } from 'ant-design-vue';

import CertificateSelectorDemo from './components/CertificateSelectorDemo.vue';
import DeviceSelectorDemo from './components/DeviceSelectorDemo.vue';
import NetworkSelectorDemo from './components/NetworkSelectorDemo.vue';
import ProductSelectorDemo from './components/ProductSelectorDemo.vue';
import ProtocolSelectorDemo from './components/ProtocolSelectorDemo.vue';
import UserSelectorDemo from './components/UserSelectorDemo.vue';

const activeKey = ref('device');
</script>

<template>
  <Page title="业务组件演示" description="系统内通用业务选择器组件集成测试">
    <div class="p-4">
      <Tabs v-model:active-key="activeKey" type="card">
        <!-- Tab 1: Device Selector -->
        <TabPane key="device" tab="设备选择器 (DeviceSelector)">
          <DeviceSelectorDemo />
        </TabPane>

        <!-- Tab 2: Product Selector -->
        <TabPane key="product" tab="产品选择器 (ProductSelector)">
          <ProductSelectorDemo />
        </TabPane>

        <!-- Tab 3: Protocol Selector -->
        <TabPane key="protocol" tab="协议选择器 (ProtocolSelector)">
          <ProtocolSelectorDemo />
        </TabPane>

        <!-- Tab 5: Network Selector -->
        <TabPane key="network" tab="网络组件选择器 (NetworkSelector)">
          <NetworkSelectorDemo />
        </TabPane>

        <!-- Tab 3: Certificate Selector -->
        <TabPane key="certificate" tab="证书选择器 (CertificateSelector)">
          <CertificateSelectorDemo />
        </TabPane>

        <!-- Tab 4: User Selector -->
        <TabPane key="user" tab="用户选择器 (UserSelector)">
          <UserSelectorDemo />
        </TabPane>
      </Tabs>
    </div>
  </Page>
</template>
