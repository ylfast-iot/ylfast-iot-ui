<script setup lang="ts">
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { TabPane, Tabs } from 'ant-design-vue';

import AdvancedDemo from './components/AdvancedDemo.vue';
import BasicDemo from './components/BasicDemo.vue';
import ComplexDemo from './components/ComplexDemo.vue';
import EditModeDemo from './components/EditModeDemo.vue';

const activeKey = ref('basic');
</script>

<template>
  <Page title="Config Metadata Desc Demo">
    <div class="p-4">
      <Tabs v-model:active-key="activeKey">
        <TabPane key="basic" tab="基础示例">
          <BasicDemo />
        </TabPane>

        <TabPane key="editMode" tab="编辑模式">
          <EditModeDemo />
        </TabPane>

        <TabPane key="complex" tab="复杂示例 (嵌套 & 联动)">
          <ComplexDemo />
        </TabPane>

        <TabPane key="advanced" tab="高级测试 (布局 & 导入)">
          <AdvancedDemo />
        </TabPane>
      </Tabs>
    </div>
  </Page>
</template>
