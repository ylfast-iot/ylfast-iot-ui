<script setup lang="ts">
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
  NotifyConfigSelector,
  useNotifyConfigCardSelector,
  useNotifyConfigListSelector,
  useNotifyConfigSelector,
} from '#/components/business/notify/config-selector';

const activeKey = ref('basic');

// --- 1. 基础用法 ---
const multiValue = ref<string[]>([]);
const singleValue = ref<string>();
const cardValue = ref<string[]>([]);

// --- 2. Hook 弹窗 ---
const [ConfigSelectorModal, { open }] = useNotifyConfigSelector();
const hookResult = ref('');

async function handleOpenHook() {
  const { value, rows } = await open({
    multiple: false,
    displayMode: 'card',
    showSearchForm: true,
  });
  if (rows && rows.length > 0) {
    hookResult.value = `选中: ${rows[0]?.name} (${value})`;
    message.success('选择完成');
  } else {
    hookResult.value = '未选择';
  }
}

// --- 3. 嵌入式 Hook (列表) ---
const [ConfigList, listApi] = useNotifyConfigListSelector({
  showSearchForm: true,
  multiple: true,
});

function handleListSelect() {
  const rows = listApi.getSelection();
  message.info(`列表选中了 ${rows?.length || 0} 项`);
}

// --- 4. 嵌入式 Hook (卡片) ---
const [ConfigCard, cardApi] = useNotifyConfigCardSelector({
  multiple: true,
  showSearchForm: true,
});

function handleCardSelect() {
  const rows = cardApi.getSelection();
  message.info(`卡片选中了 ${rows?.length || 0} 项`);
}

function handleChange(val: any, rows: any[]) {
  console.warn('Selection Changed:', val, rows);
}
</script>

<template>
  <div class="p-4">
    <Card title="通知配置选择器演示">
      <Tabs v-model:active-key="activeKey">
        <!-- 基础用法 -->
        <TabPane key="basic" tab="基础用法 (Declarative)">
          <div class="grid grid-cols-1 gap-6 p-4 md:grid-cols-2">
            <div class="space-y-2">
              <div class="font-bold">列表模式 (多选)</div>
              <NotifyConfigSelector
                v-model:value="multiValue"
                :multiple="true"
                @change="handleChange"
              />
              <div class="text-xs text-muted-foreground">
                Value: {{ multiValue }}
              </div>
            </div>

            <div class="space-y-2">
              <div class="font-bold">单选模式</div>
              <NotifyConfigSelector
                v-model:value="singleValue"
                :multiple="false"
                @change="handleChange"
              />
              <div class="text-xs text-muted-foreground">
                Value: {{ singleValue }}
              </div>
            </div>

            <div class="space-y-2">
              <div class="font-bold">卡片模式</div>
              <NotifyConfigSelector
                v-model:value="cardValue"
                display-mode="card"
                :multiple="true"
              />
            </div>

            <div class="space-y-2">
              <div class="font-bold">禁用状态</div>
              <NotifyConfigSelector v-model:value="multiValue" disabled />
            </div>
          </div>
        </TabPane>

        <!-- Hook 弹窗 -->
        <TabPane key="hook" tab="Hook 弹窗 (Imperative)">
          <div class="flex h-[200px] flex-col items-center justify-center p-4">
            <Space direction="vertical" align="center">
              <div class="text-muted-foreground">
                使用 useNotifyConfigSelector Hook 唤起弹窗
              </div>
              <Button type="primary" @click="handleOpenHook">
                打开 Hook 弹窗 (卡片单选)
              </Button>
              <div v-if="hookResult" class="mt-4 rounded bg-muted p-2">
                {{ hookResult }}
              </div>
            </Space>
            <ConfigSelectorModal />
          </div>
        </TabPane>

        <!-- 嵌入式组件 -->
        <TabPane key="embed" tab="嵌入式组件 (Embedding)">
          <div class="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
            <div class="flex flex-col rounded-lg border border-border p-3">
              <div class="mb-3 flex items-center justify-between">
                <Tag color="blue">纯列表</Tag>
                <Button size="small" @click="handleListSelect">获取选中</Button>
              </div>
              <div class="flex-1 overflow-hidden border border-border bg-card">
                <ConfigList />
              </div>
            </div>

            <div class="flex flex-col rounded-lg border border-border p-3">
              <div class="mb-3 flex items-center justify-between">
                <Tag color="purple">纯卡片</Tag>
                <Button size="small" @click="handleCardSelect">获取选中</Button>
              </div>
              <div class="flex-1 overflow-hidden border border-border bg-card">
                <ConfigCard />
              </div>
            </div>
          </div>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>
