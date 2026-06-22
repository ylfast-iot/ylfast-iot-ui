<script setup lang="ts">
import { ref, watch } from 'vue';

import { TreeSelect } from 'ant-design-vue';

import {
  getDingTalkDepartmentsTree,
  getWeChatDepartments,
} from '#/api/iot/notify/template';

const props = defineProps<{
  modelValue: Record<string, any>;
  notifierId: string;
  notifyType: string;
}>();

const emit = defineEmits<{
  change: [value: { displayName?: string }];
  'update:modelValue': [value: Record<string, any>];
}>();

const treeData = ref<any[]>([]);

watch(
  () => [props.notifierId, props.notifyType],
  async () => {
    if (!props.notifierId) {
      treeData.value = [];
      return;
    }
    const notifyType =
      props.notifyType === 'weixin' ? 'wechat' : props.notifyType;
    const result =
      notifyType === 'dingTalk'
        ? await getDingTalkDepartmentsTree(props.notifierId)
        : await getWeChatDepartments(props.notifierId);
    treeData.value = buildTree(result || []);
  },
  { deep: true, immediate: true },
);

function buildTree(list: any[]) {
  return list.map((item: any) => ({
    children: buildTree(item.children || []),
    key: item.id,
    title: item.name || item.id,
    value: item.id,
  }));
}

function handleChange(value: string, label: any) {
  emit('update:modelValue', {
    source: 'fixed',
    value,
  });
  emit('change', {
    displayName: Array.isArray(label) ? label.join(',') : label,
  });
}
</script>

<template>
  <TreeSelect
    :value="modelValue?.value"
    class="notify-simple-select"
    :tree-data="treeData"
    allow-clear
    show-search
    :list-height="240"
    placeholder="请选择部门"
    @change="handleChange"
  />
</template>

<style scoped>
.notify-simple-select {
  width: 100%;

  :deep(.ant-select-selector) {
    min-height: 42px;
    border-color: #e8e8e8 !important;
    border-radius: 12px !important;
    box-shadow: none !important;
  }

  :deep(.ant-select-selection-placeholder) {
    color: #bfbfbf;
  }
}
</style>
