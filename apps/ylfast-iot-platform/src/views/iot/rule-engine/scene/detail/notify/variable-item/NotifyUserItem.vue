<script setup lang="ts">
import type { SceneRuleModel } from '../../types';

import { computed, ref, watch } from 'vue';

import { Input, Select, TreeSelect } from 'ant-design-vue';

import {
  getDingTalkAllUsers,
  getWeChatAllUsers,
} from '#/api/iot/notify/template';
import { requestClient } from '#/api/request';
import { SystemUserApi } from '#/api/system/user';

const props = defineProps<{
  modelValue: Record<string, any>;
  notifierId?: string;
  notifyType: string;
  scene?: SceneRuleModel;
}>();

const emit = defineEmits<{
  change: [value: { displayName?: string }];
  'update:modelValue': [value: Record<string, any>];
}>();

const relationTree = ref<any[]>([
  {
    key: 'platform-users',
    selectable: false,
    title: '平台用户',
    value: 'platform-users',
    children: [],
  },
]);
const fixedUsers = ref<any[]>([]);

const currentType = computed(() =>
  props.notifyType === 'weixin' ? 'wechat' : props.notifyType,
);
const source = computed(() => props.modelValue?.source || 'relation');
const relationValue = computed(() => {
  const relation = props.modelValue?.relation;
  return relation?.objectId || relation?.related?.relation;
});

watch(
  () => [props.notifyType, props.notifierId],
  async () => {
    const result = await requestClient.post<any>(
      SystemUserApi.ApiMethod._query,
      {
        paging: false,
        sorts: [{ name: 'name', order: 'asc' }],
      },
    );
    const rows = Array.isArray(result)
      ? result
      : result?.data || result?.result || [];
    const userNodes = rows.map((item: any) => ({
      key: item.id,
      title: item.name || item.username || item.id,
      username: item.username,
      value: item.id,
    }));
    relationTree.value = [
      {
        key: 'platform-users',
        selectable: false,
        title: '平台用户',
        value: 'platform-users',
        children: userNodes,
      },
    ];
    if (currentType.value === 'dingTalk' && props.notifierId) {
      const corpUsers = await getDingTalkAllUsers(props.notifierId);
      fixedUsers.value = (corpUsers || []).map((item: any) => ({
        label: item.name || item.id,
        value: item.id,
      }));
      return;
    }
    if (currentType.value === 'wechat' && props.notifierId) {
      const corpUsers = await getWeChatAllUsers(props.notifierId);
      fixedUsers.value = (corpUsers || []).map((item: any) => ({
        label: item.name || item.id,
        value: item.id,
      }));
      return;
    }
    fixedUsers.value = userNodes.map((item: any) => ({
      label: item.title,
      value: item.value,
    }));
  },
  { deep: true, immediate: true },
);

function updateSource(value: string) {
  emit('update:modelValue', { source: value });
  emit('change', { displayName: '' });
}

function updateRelation(value: string, label: any) {
  emit('update:modelValue', {
    relation: {
      objectId: value,
      objectType: 'user',
    },
    source: 'relation',
  });
  emit('change', {
    displayName: Array.isArray(label) ? label.join(',') : label,
  });
}

function updateFixed(value: any, option?: any) {
  emit('update:modelValue', {
    source: 'fixed',
    value,
  });
  emit('change', {
    displayName: Array.isArray(value)
      ? value.join(',')
      : option?.label || option?.name || value,
  });
}
</script>

<template>
  <div class="variable-inline-editor">
    <Select
      class="variable-source"
      :value="source"
      @update:value="updateSource($event)"
    >
      <Select.Option value="relation">关联用户</Select.Option>
      <Select.Option value="fixed">
        {{
          currentType === 'dingTalk'
            ? '钉钉用户'
            : currentType === 'wechat'
              ? '企业微信用户'
              : currentType === 'email'
                ? '邮箱'
                : '手机号'
        }}
      </Select.Option>
    </Select>

    <TreeSelect
      v-if="source === 'relation'"
      :value="relationValue"
      class="variable-content"
      :tree-data="relationTree"
      allow-clear
      show-search
      tree-default-expand-all
      :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
      placeholder="请选择关联用户"
      tree-node-filter-prop="title"
      @change="updateRelation"
    >
      <template #title="{ key, title, username }">
        <div
          v-if="key !== 'platform-users'"
          class="flex items-center justify-between pr-2"
        >
          <span>{{ title }}</span>
          <span class="text-xs text-slate-400">{{ username }}</span>
        </div>
        <span v-else>{{ title }}</span>
      </template>
    </TreeSelect>

    <Select
      v-else-if="currentType === 'dingTalk' || currentType === 'wechat'"
      :value="modelValue?.value"
      class="variable-content"
      show-search
      allow-clear
      :options="fixedUsers"
      placeholder="请选择接收人"
      @change="updateFixed"
    />

    <Select
      v-else-if="currentType === 'email'"
      :value="modelValue?.value"
      class="variable-content"
      mode="tags"
      max-tag-count="responsive"
      :token-separators="[',', ';', ' ']"
      placeholder="请输入邮箱，回车确认"
      @change="updateFixed"
    />

    <Input
      v-else
      :value="modelValue?.value"
      class="variable-content"
      placeholder="请输入手机号"
      @update:value="updateFixed"
    />
  </div>
</template>

<style scoped>
.variable-inline-editor {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.variable-inline-editor:focus-within {
  border-color: #1677ff;
  box-shadow: 0 0 0 3px rgb(22 119 255 / 8%);
}

.variable-source {
  flex: none;
  width: 128px;
  background: #fafafa;
}

.variable-content {
  width: calc(100% - 128px);
}

.variable-inline-editor :deep(.ant-select-selector),
.variable-inline-editor :deep(.ant-input),
.variable-inline-editor :deep(.ant-tree-select .ant-select-selector) {
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.variable-inline-editor :deep(.variable-source .ant-select-selector) {
  border-inline-end: 1px solid #f0f0f0 !important;
  border-start-start-radius: 12px !important;
  border-end-start-radius: 12px !important;
}

.variable-inline-editor :deep(.variable-content .ant-select-selector),
.variable-inline-editor :deep(.variable-content.ant-input),
.variable-inline-editor :deep(.variable-content .ant-input) {
  border-start-end-radius: 12px !important;
  border-end-end-radius: 12px !important;
}

.variable-inline-editor :deep(.ant-select-selection-placeholder),
.variable-inline-editor :deep(.ant-input::placeholder) {
  color: #bfbfbf;
}
</style>
