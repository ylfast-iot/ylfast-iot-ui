<script setup lang="ts">
import type { ConfigMetadata } from '#/types/config-metadata';
import type { Recordable } from '#/types/data-type';

import { computed, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Radio,
  RadioGroup,
  Select,
} from 'ant-design-vue';

import { YlConfigMetadataDesc } from '#/components/yl-config-metadata-desc';

// 创建图标
const UploadOutlined = createIconifyIcon('ant-design:upload-outlined');

// LocalStorage 键名
const STORAGE_KEY = 'yl-config-metadata-desc-advanced-demo';

// 从 LocalStorage 加载数据
function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('加载数据失败:', error);
  }
  return null;
}

// 保存到 LocalStorage
function saveToStorage(data: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('保存数据失败:', error);
  }
}

// 默认 metadata
const defaultMetadata: ConfigMetadata = {
  name: '设备配置',
  description: '设备的完整配置信息',
  properties: [
    {
      property: 'deviceName',
      name: '设备名称',
      description: '设备的唯一标识名称',
      type: {
        type: 'STRING',
        expands: { required: true, maxLength: 50 },
      },
    },
    {
      property: 'deviceType',
      name: '设备类型',
      type: {
        type: 'ENUM',
        elements: [
          { value: 'sensor', text: '传感器' },
          { value: 'actuator', text: '执行器' },
          { value: 'gateway', text: '网关' },
        ],
        expands: { required: true },
      },
    },
    {
      property: 'enabled',
      name: '启用状态',
      type: { type: 'BOOLEAN', expands: { defaultValue: true } },
    },
    {
      property: 'port',
      name: '端口号',
      type: { type: 'INTEGER', expands: { defaultValue: 8080 } },
    },
    {
      property: 'host',
      name: '主机地址',
      type: { type: 'STRING', expands: {} },
    },
    {
      property: 'timeout',
      name: '超时时间(ms)',
      type: { type: 'INTEGER', expands: { defaultValue: 3000 } },
    },
  ],
};

// 初始化数据
const stored = loadFromStorage();
const metadata = ref<ConfigMetadata>(stored?.metadata || defaultMetadata);
const model = ref<Recordable>(
  stored?.model || {
    deviceName: 'Device-001',
    deviceType: 'sensor',
    enabled: true,
    port: 8080,
    host: 'localhost',
    timeout: 3000,
  },
);

// 布局配置
const layoutSize = ref<'default' | 'middle' | 'small'>(
  stored?.layoutSize || 'small',
);
const layoutType = ref<'horizontal' | 'vertical'>(
  stored?.layoutType || 'vertical',
);
const bordered = ref<boolean>(stored?.bordered ?? true);
const columnConfig = ref<number>(stored?.columnConfig || 3);

// 导入弹框
const importModalVisible = ref(false);
const importJsonText = ref('');

// 列配置选项
const columnOptions = [
  { label: '1 列', value: 1 },
  { label: '2 列', value: 2 },
  { label: '3 列', value: 3 },
  { label: '4 列', value: 4 },
];

// 计算 column 属性
const descColumn = computed(() => {
  const col = columnConfig.value;
  return {
    xs: 1,
    sm: Math.min(col, 1),
    md: Math.min(col, 2),
    lg: Math.min(col, 2),
    xl: col,
    xxl: col,
  };
});

// 监听数据变化，自动保存
watch(
  [metadata, model, layoutSize, layoutType, bordered, columnConfig],
  () => {
    saveToStorage({
      metadata: metadata.value,
      model: model.value,
      layoutSize: layoutSize.value,
      layoutType: layoutType.value,
      bordered: bordered.value,
      columnConfig: columnConfig.value,
    });
  },
  { deep: true },
);

// 打开导入弹框
function handleOpenImportModal() {
  importJsonText.value = JSON.stringify(metadata.value, null, 2);
  importModalVisible.value = true;
}

// 导入 metadata
function handleImportMetadata() {
  try {
    const imported = JSON.parse(importJsonText.value);
    metadata.value = imported;
    importModalVisible.value = false;
    message.success('导入成功！');
  } catch (error) {
    message.error('导入失败：JSON 格式错误');
    console.error(error);
  }
}

// 导出 metadata
function handleExportMetadata() {
  const dataStr = JSON.stringify(metadata.value, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'metadata.json';
  link.click();
  URL.revokeObjectURL(url);
  message.success('导出成功！');
}

// 重置为默认
function handleReset() {
  metadata.value = defaultMetadata;
  model.value = {
    deviceName: 'Device-001',
    deviceType: 'sensor',
    enabled: true,
    port: 8080,
    host: 'localhost',
    timeout: 3000,
  };
  layoutSize.value = 'small';
  layoutType.value = 'vertical';
  bordered.value = true;
  columnConfig.value = 3;
  message.success('已重置为默认配置！');
}

// 清除缓存
function handleClearCache() {
  localStorage.removeItem(STORAGE_KEY);
  message.success('缓存已清除！刷新页面将恢复默认配置。');
}

// 保存处理
function handleSave(data: Recordable) {
  console.warn('保存数据:', data);
  message.success('保存成功！');
}
</script>

<template>
  <div class="advanced-demo">
    <Card title="高级测试 - 布局配置与 Metadata 导入">
      <!-- 控制面板 -->
      <div
        class="mb-4 space-y-4 rounded-lg border border-border bg-muted/30 p-4"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <!-- 布局大小 -->
          <div>
            <div class="mb-2 text-sm font-medium">布局大小</div>
            <RadioGroup v-model:value="layoutSize" button-style="solid">
              <Radio value="small">小</Radio>
              <Radio value="middle">中</Radio>
              <Radio value="default">大</Radio>
            </RadioGroup>
          </div>

          <!-- 布局类型 -->
          <div>
            <div class="mb-2 text-sm font-medium">布局类型</div>
            <RadioGroup v-model:value="layoutType" button-style="solid">
              <Radio value="horizontal">水平</Radio>
              <Radio value="vertical">垂直</Radio>
            </RadioGroup>
          </div>

          <!-- 边框 -->
          <div>
            <div class="mb-2 text-sm font-medium">边框</div>
            <RadioGroup v-model:value="bordered" button-style="solid">
              <Radio :value="true">显示</Radio>
              <Radio :value="false">隐藏</Radio>
            </RadioGroup>
          </div>

          <!-- 列数 -->
          <div>
            <div class="mb-2 text-sm font-medium">列数配置</div>
            <Select
              v-model:value="columnConfig"
              :options="columnOptions"
              class="w-full"
            />
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button type="primary" @click="handleOpenImportModal">
            <template #icon>
              <UploadOutlined />
            </template>
            导入 Metadata
          </Button>

          <Button @click="handleExportMetadata">导出 Metadata</Button>

          <Button @click="handleReset">重置为默认</Button>

          <Button danger @click="handleClearCache">清除缓存</Button>
        </div>

        <!-- 配置说明 -->
        <div class="rounded bg-primary/5 p-3 text-sm">
          <div class="mb-1 font-medium text-primary">💡 提示</div>
          <ul class="ml-4 list-disc space-y-1 text-muted-foreground">
            <li>所有配置会自动保存到 LocalStorage，刷新页面后保持</li>
            <li>点击"导入 Metadata"可以粘贴 JSON 进行测试</li>
            <li>列数配置会影响响应式布局（xs/sm/md/lg/xl/xxl）</li>
            <li>最后一项会自动填充剩余空间</li>
          </ul>
        </div>
      </div>

      <!-- 描述列表 -->
      <YlConfigMetadataDesc
        v-model:model="model"
        :bordered="bordered"
        :column="descColumn"
        :layout="layoutType"
        :metadata="metadata"
        :size="layoutSize"
        @save="handleSave"
      />
    </Card>

    <!-- 导入 Metadata 弹框 -->
    <Modal
      v-model:open="importModalVisible"
      title="导入 Metadata"
      width="800px"
      @ok="handleImportMetadata"
    >
      <div class="space-y-3">
        <div class="text-sm text-muted-foreground">
          请粘贴 JSON 格式的 Metadata 配置：
        </div>
        <Input.TextArea
          v-model:value="importJsonText"
          :auto-size="{ minRows: 10, maxRows: 20 }"
          placeholder="配置名称"
        />
        <div class="text-xs text-muted-foreground">
          提示：可以先点击"导出 Metadata"获取当前配置的 JSON 格式
        </div>
      </div>
    </Modal>

    <!-- 数据模型 -->
    <Card class="mt-4" title="当前数据模型">
      <pre class="text-sm">{{ JSON.stringify(model, null, 2) }}</pre>
    </Card>

    <!-- Metadata 结构 -->
    <Card class="mt-4" title="当前 Metadata 结构">
      <pre class="max-h-96 overflow-auto text-sm">{{
        JSON.stringify(metadata, null, 2)
      }}</pre>
    </Card>
  </div>
</template>

<style scoped>
.advanced-demo {
  max-width: 1400px;
}
</style>
