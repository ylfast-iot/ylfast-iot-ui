<script setup lang="ts">
import type { DefaultHeaderOption, HeaderKeyValue } from '../types';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { cloneDeep } from '@vben/utils';

import { AutoComplete, Button, Input } from 'ant-design-vue';

const emit = defineEmits(['confirm']);

const XIcon = createIconifyIcon('lucide:x');
const PlusIcon = createIconifyIcon('lucide:plus');

const headerList = ref<HeaderKeyValue[]>([]);
const keyOptions = ref<DefaultHeaderOption[]>([
  { label: 'topic', value: 'topic' },
  { label: 'url', value: 'url' },
]);

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    // 过滤掉空的 key
    const filteredList = headerList.value.filter(
      (item) => item.key.trim() !== '',
    );
    emit('confirm', filteredList);
    modalApi.close();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<any>();
      headerList.value = cloneDeep(data?.headers || []);
      if (headerList.value.length === 0) {
        headerList.value.push({ key: '', value: '' });
      }

      // 合并外部传入的默认选项
      const extraOptions = data?.defaultHeaderKeys || [];
      const baseOptions = [
        { label: 'topic', value: 'topic' },
        { label: 'url', value: 'url' },
      ];

      // 去重合并
      const combined = [...baseOptions];
      extraOptions.forEach((opt: DefaultHeaderOption | string) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const lab = typeof opt === 'string' ? opt : opt.label;
        if (!combined.some((c) => c.value === val)) {
          combined.push({ label: lab, value: val });
        }
      });
      keyOptions.value = combined;
    }
  },
  title: '配置 Header',
  class: 'w-[600px]',
});

function addHeaderItem() {
  headerList.value.push({ key: '', value: '' });
}

function removeHeaderItem(index: number) {
  headerList.value.splice(index, 1);
  if (headerList.value.length === 0) {
    headerList.value.push({ key: '', value: '' });
  }
}

defineExpose(modalApi);
</script>

<template>
  <Modal>
    <div class="p-4">
      <div
        class="mb-4 rounded border border-orange-100 bg-orange-50 p-2 text-xs text-orange-500"
      >
        <span class="mr-1 font-bold">提示:</span>
        用于自定义透传协议包或官方协议包额外信息，如 MQTT 协议的 Topic，HTTP
        协议的 URL 参数等。
      </div>

      <div class="flex max-h-[400px] flex-col gap-3 overflow-y-auto pr-2">
        <div
          v-for="(item, index) in headerList"
          :key="index"
          class="flex items-center gap-2"
        >
          <div class="flex flex-1 items-center gap-2">
            <AutoComplete
              v-model:value="item.key"
              placeholder="Key (如 topic)"
              class="w-1/2"
              :options="keyOptions"
              :filter-option="true"
            />
            <span class="text-gray-400">:</span>
            <Input
              v-model:value="item.value"
              placeholder="Value"
              class="w-1/2"
            />
          </div>
          <Button
            type="text"
            danger
            size="small"
            class="flex-shrink-0"
            @click="removeHeaderItem(index)"
          >
            <template #icon>
              <XIcon class="size-4" />
            </template>
          </Button>
        </div>
      </div>

      <Button
        block
        type="dashed"
        class="mt-4 border-dashed border-gray-300 transition-all hover:border-primary hover:text-primary"
        @click="addHeaderItem"
      >
        <template #icon>
          <PlusIcon class="size-4" />
        </template>
        添加 Header 项
      </Button>
    </div>
  </Modal>
</template>

<style scoped>
/* 隐藏弹窗默认的辅助边框等 */
:deep(.ant-modal-body) {
  padding: 0;
}

/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: #d1d5db;
}
</style>
