<script setup lang="ts">
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Empty, TabPane, Tabs } from 'ant-design-vue';

import DeviceSelectorDemo from './components/DeviceSelectorDemo.vue';
import ProductSelectorDemo from './components/ProductSelectorDemo.vue';

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

        <!-- Tab 3: User Selector (Coming Soon) -->
        <TabPane key="user" tab="用户选择器 (UserSelector)">
          <div
            class="flex h-[400px] w-full items-center justify-center rounded-lg border border-dashed bg-white"
          >
            <Empty description="用户选择器开发中..." />
          </div>
        </TabPane>
      </Tabs>
    </div>
  </Page>
</template>
