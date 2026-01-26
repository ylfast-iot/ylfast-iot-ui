<script setup lang="ts">
// @ts-nocheck
import { ref } from 'vue';

import {
  Button,
  Card,
  message,
  Space,
  TabPane,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  GatewaySelector,
  GatewaySelectorModal,
  useGatewayCardSelector,
  useGatewayListSelector,
  useGatewaySelector,
} from '#/components/business/gateway/gateway-selector';

const activeKey = ref('basic');

// --- 1. 基础用法 ---
const multiValue = ref<string[]>([]);
const singleValue = ref<string>('');
const cardValue = ref<string[]>([]);

// --- 2. 自定义 Trigger ---
const customTriggerValue = ref<string[]>([]);

// --- 3. Hook 弹窗 ---
const [, { open }] = useGatewaySelector();
const hookResult = ref('');

async function handleOpenHook() {
  const { value, rows } = await open({
    multiple: false, // 单选
    displayMode: 'card', // 卡片模式
    showSearchForm: true,
  });
  if (rows && rows.length > 0) {
    hookResult.value = `选中: ${rows[0]?.name} (${value})`;
    message.success('选择完成');
  } else {
    hookResult.value = '未选择';
  }
}

// --- 4. 嵌入式 Hook (列表) ---
const [GatewayList, listApi] = useGatewayListSelector({
  multiple: true,
  showSearchForm: false,
  showPager: false,
});

function handleListSelect() {
  const rows = listApi.getSelection();
  message.info(`列表选中了 ${rows?.length || 0} 项`);
}

function clearListSelection() {
  listApi.clearSelection();
}

// --- 5. 嵌入式 Hook (卡片) ---
const [GatewayCard, cardApi] = useGatewayCardSelector({
  multiple: true,
  showSearchForm: true,
  showPager: true,
});

function handleCardSelect() {
  const rows = cardApi.getSelection();
  message.info(`卡片选中了 ${rows?.length || 0} 项`);
}

function handleChange(val: any, rows: any[]) {
  console.warn('Gateway Selection Changed:', val, rows);
}
</script>

<template>
  <div class="p-4">
    <Card title="网关选择器演示 (GatewaySelector)">
      <Tabs v-model:active-key="activeKey">
        <!-- Tab 1: 声明式用法 -->
        <TabPane key="basic" tab="基础用法 (Declarative)">
          <div class="grid grid-cols-1 gap-6 p-4 md:grid-cols-2">
            <div class="space-y-2">
              <div class="font-bold">列表模式 (多选)</div>
              <GatewaySelector
                v-model:value="multiValue"
                @change="handleChange"
              />
              <div class="font-mono text-xs text-gray-500">
                Selected: {{ multiValue }}
              </div>
            </div>

            <div class="space-y-2">
              <div class="font-bold">单选模式</div>
              <GatewaySelector
                v-model:value="singleValue"
                :multiple="false"
                placeholder="请选择网关"
                @change="handleChange"
              />
              <div class="font-mono text-xs text-gray-500">
                Selected: {{ singleValue }}
              </div>
            </div>

            <div class="space-y-2">
              <div class="font-bold">卡片模式</div>
              <GatewaySelector
                v-model:value="cardValue"
                display-mode="card"
                placeholder="以卡片形式选择"
              />
            </div>

            <div class="space-y-2">
              <div class="font-bold">禁用状态</div>
              <GatewaySelector v-model:value="multiValue" disabled />
            </div>

            <div class="col-span-2 space-y-2 border-t pt-4">
              <div class="font-bold">自定义 Trigger 插槽</div>
              <GatewaySelector v-model:value="customTriggerValue">
                <template #trigger="{ handleOpen }">
                  <Button type="primary" @click="handleOpen">
                    点击选择网关 ({{ customTriggerValue.length }})
                  </Button>
                </template>
              </GatewaySelector>
            </div>
          </div>
        </TabPane>

        <!-- Tab 2: Hook 弹窗 -->
        <TabPane key="hook" tab="Hook 弹窗 (Imperative)">
          <div class="flex h-[200px] flex-col items-center justify-center p-4">
            <Space direction="vertical" align="center">
              <div class="text-gray-500">
                使用 useGatewaySelector Hook 命令式唤起弹窗
              </div>
              <Button type="primary" @click="handleOpenHook">
                打开 Hook 弹窗 (卡片单选)
              </Button>
              <div
                v-if="hookResult"
                class="mt-4 rounded bg-gray-100 p-2 font-mono text-sm"
              >
                {{ hookResult }}
              </div>
            </Space>
            <!-- 必须挂载 Modal 组件 -->
            <GatewaySelectorModal hide-trigger />
          </div>
        </TabPane>

        <!-- Tab 3: 嵌入式组件 -->
        <TabPane key="embed" tab="嵌入式组件 (Embedding)">
          <div class="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
            <!-- 列表嵌入 -->
            <div
              class="flex h-[500px] flex-col rounded-lg border border-gray-200 p-3"
            >
              <div class="mb-3 flex items-center justify-between">
                <Tag color="blue">列表嵌入 (内嵌模式)</Tag>
                <Space>
                  <Button size="small" @click="handleListSelect">
                    获取选中
                  </Button>
                  <Button size="small" @click="clearListSelection">清空</Button>
                </Space>
              </div>
              <div
                class="flex-1 overflow-hidden border border-gray-100 bg-white"
              >
                <GatewayList />
              </div>
            </div>

            <!-- 卡片嵌入 -->
            <div
              class="flex h-[500px] flex-col rounded-lg border border-gray-200 p-3"
            >
              <div class="mb-3 flex items-center justify-between">
                <Tag color="purple">卡片嵌入 (内嵌模式)</Tag>
                <Button size="small" @click="handleCardSelect">获取选中</Button>
              </div>
              <div
                class="flex-1 overflow-hidden border border-gray-100 bg-gray-50"
              >
                <GatewayCard />
              </div>
            </div>
          </div>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>
