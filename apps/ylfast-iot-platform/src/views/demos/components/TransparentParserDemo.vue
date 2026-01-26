<script setup lang="ts">
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Radio, Space } from 'ant-design-vue';

import { TransparentParser } from '#/components/business/transparent-parser';

defineOptions({ name: 'TransparentParserDemo' });

/**
 * 演示模式
 * - fullHeight: 铺满容器（100%高度）
 * - fixedHeight: 固定高度
 */
const demoMode = ref<'fixedHeight' | 'fullHeight'>('fixedHeight');

/**
 * 测试模式
 * - product: 产品模式
 * - device-inherit: 设备模式（继承产品）
 * - device-independent: 设备模式（独立配置）
 */
const mode = ref<'device-independent' | 'device-inherit' | 'product'>(
  'product',
);

// 模拟产品ID和设备ID
const mockProductId = 'test-product-001';
const mockDeviceId = 'test-device-001';

const demoModeOptions = [
  { label: '固定高度（900px）', value: 'fixedHeight' },
  { label: '铺满容器（100%）', value: 'fullHeight' },
];

const modeOptions = [
  { label: '产品模式', value: 'product' },
  { label: '设备模式（继承产品）', value: 'device-inherit' },
  { label: '设备模式（独立配置）', value: 'device-independent' },
];
</script>

<template>
  <Page class="transparent-parser-demo">
    <Card class="mb-4">
      <Space direction="vertical" class="w-full">
        <Space>
          <span class="font-semibold">布局模式:</span>
          <Radio.Group v-model:value="demoMode" :options="demoModeOptions" />
        </Space>
        <Space>
          <span class="font-semibold">测试模式:</span>
          <Radio.Group v-model:value="mode" :options="modeOptions" />
        </Space>
      </Space>
    </Card>

    <!-- 固定高度案例 -->
    <div v-if="demoMode === 'fixedHeight'" class="demo-container-fixed">
      <!-- 产品模式 -->
      <TransparentParser
        class="h-full"
        v-if="mode === 'product'"
        key="product"
        :product-id="mockProductId"
        name="测试产品"
      />

      <!-- 设备模式（继承产品） -->
      <TransparentParser
        v-else-if="mode === 'device-inherit'"
        key="device-inherit"
        :device-id="mockDeviceId"
        :product-id="mockProductId"
        name="测试设备（继承模式）"
      />

      <!-- 设备模式（独立配置） -->
      <TransparentParser
        v-else-if="mode === 'device-independent'"
        key="device-independent"
        :device-id="`${mockDeviceId}-independent`"
        :product-id="mockProductId"
        name="测试设备（独立模式）"
      />
    </div>

    <!-- 铺满容器案例（100%高度） -->
    <div v-else class="demo-container-full">
      <!-- 产品模式 -->
      <TransparentParser
        v-if="mode === 'product'"
        key="product-full"
        :product-id="mockProductId"
        name="测试产品（铺满容器）"
      />

      <!-- 设备模式（继承产品） -->
      <TransparentParser
        v-else-if="mode === 'device-inherit'"
        key="device-inherit-full"
        :device-id="mockDeviceId"
        :product-id="mockProductId"
        name="测试设备（继承模式，铺满容器）"
      />

      <!-- 设备模式（独立配置） -->
      <TransparentParser
        v-else-if="mode === 'device-independent'"
        key="device-independent-full"
        :device-id="`${mockDeviceId}-independent`"
        :product-id="mockProductId"
        name="测试设备（独立模式，铺满容器）"
      />
    </div>
  </Page>
</template>

<style scoped lang="less">
.transparent-parser-demo {
  padding: 16px;
  height: 100vh; /* 确保Page本身占满视口 */
  display: flex;
  flex-direction: column;
}

/* 固定高度容器 */
.demo-container-fixed {
  height: 900px; /* 设置固定高度 */
}

.demo-container-fixed :deep(.transparent-parser) {
  height: 100%;
}

/* 铺满容器（占满剩余空间） */
.demo-container-full {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 确保在铺满模式下，组件的Card占满容器 */
.demo-container-full :deep(.transparent-parser) {
  height: 100%;
}

.demo-container-full :deep(.transparent-parser .ant-card) {
  height: 100%;
}
</style>
