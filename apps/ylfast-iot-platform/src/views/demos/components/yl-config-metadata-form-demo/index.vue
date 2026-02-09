<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { TabPane, Tabs } from 'ant-design-vue';

import ActionFooterDemo from './components/ActionFooterDemo.vue';
import BasicDemo from './components/BasicDemo.vue';
import BooleanLinkageDemo from './components/BooleanLinkageDemo.vue';
import ComplexDemo from './components/ComplexDemo.vue';
import DynamicLinkageDemo from './components/DynamicLinkageDemo.vue';
import HeaderCustomDemo from './components/HeaderCustomDemo.vue';
import ImportDemo from './components/ImportDemo.vue';
import MultiFormDemo from './components/MultiFormDemo.vue';
import ObjectDefaultValueDemo from './components/ObjectDefaultValueDemo.vue';
import PureNestedDemo from './components/PureNestedDemo.vue';
import VbenFormIntegrationDemo from './components/VbenFormIntegrationDemo.vue';

const activeKey = ref('basic');
</script>

<template>
  <Page title="Config Metadata Form Demo">
    <div class="p-4">
      <Tabs v-model:active-key="activeKey">
        <TabPane key="basic" tab="基础示例">
          <BasicDemo />
        </TabPane>

        <TabPane key="complex" tab="复杂示例 (嵌套 & 联动)">
          <ComplexDemo />
        </TabPane>

        <TabPane key="pureNested" tab="纯粹嵌套示例">
          <PureNestedDemo />
        </TabPane>

        <TabPane key="booleanLinkage" tab="布尔联动示例">
          <BooleanLinkageDemo />
        </TabPane>

        <TabPane key="multi" tab="多表单渲染">
          <MultiFormDemo />
        </TabPane>

        <TabPane key="dynamicLinkage" tab="动态联动示例">
          <DynamicLinkageDemo />
        </TabPane>

        <TabPane key="objectDefault" tab="对象默认值填充">
          <ObjectDefaultValueDemo />
        </TabPane>

        <TabPane key="headerCustom" tab="标题自定义">
          <HeaderCustomDemo />
        </TabPane>

        <TabPane key="actionFooter" tab="底部按钮">
          <ActionFooterDemo />
        </TabPane>

        <TabPane key="vbenForm" tab="Vben Form 集成">
          <VbenFormIntegrationDemo />
        </TabPane>

        <TabPane key="import" tab="导入渲染">
          <ImportDemo />
        </TabPane>
      </Tabs>
    </div>
  </Page>
</template>
