<script setup lang="ts">
import type { BaseSelectorProps } from '#/components/business/common-selector/src/types';

import { onMounted, ref } from 'vue';

import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

import { getPluginTypes } from '#/api/iot/plugin';
import {
  CommonModal,
  CommonTrigger,
} from '#/components/business/common-selector';
import { useSelectorEcho } from '#/components/business/common-selector/src/hooks/useSelectorEcho';

import PluginCardItem from './components/PluginCardItem.vue';
import {
  queryPluginList,
  queryPluginListNoPaging,
  usePluginSelectorConfig,
} from './config';

const props = withDefaults(defineProps<BaseSelectorProps>(), {
  value: undefined,
  multiple: true,
  disabled: false,
  displayMode: 'table',
  placeholder: undefined,
  hideTrigger: false,
  showPager: true,
  showSearchForm: true,
});

const emit = defineEmits(['update:value', 'change', 'select']);

const { searchFormSchemas, tableColumns } = usePluginSelectorConfig();

const modalRef = ref();

// Plugin type mapping for display names
const pluginTypeMap = ref<Map<string, string>>(new Map());

onMounted(async () => {
  try {
    const types = await getPluginTypes();
    types.forEach((t) => {
      pluginTypeMap.value.set(t.id || t.value, t.name || t.text);
    });
  } catch (error) {
    console.error('Failed to load plugin types for selector:', error);
  }
});

// 使用通用的回显 Hook
const { selectedRows } = useSelectorEcho({
  value: props.value,
  echoApi: queryPluginListNoPaging,
  idField: 'id',
  multiple: props.multiple,
});

function handleOpen(options: any = {}) {
  if (props.disabled) return;
  modalRef.value?.open({
    displayMode: props.displayMode,
    multiple: props.multiple,
    defaultSelectedRows: selectedRows.value,
    showPager: props.showPager,
    showSearchForm: props.showSearchForm,
    ...options,
  });
}

function handleConfirm(val: any, records: any[]) {
  selectedRows.value = records;
  emit('update:value', val);
  emit('change', val, records);
}

function handleRemove(id: string) {
  if (props.disabled) return;
  const newValue = props.multiple
    ? (props.value as string[]).filter((v) => v !== id)
    : undefined;
  emit('update:value', newValue);
  selectedRows.value = selectedRows.value.filter((r) => r.id !== id);
}

function clearSelection() {
  selectedRows.value = [];
  modalRef.value?.clearSelection();
}

function setSelection(rows: any[]) {
  selectedRows.value = rows;
  modalRef.value?.setSelection(rows);
}

defineExpose({
  open: handleOpen,
  close: () => modalRef.value?.close(),
  setMode: (mode: any) => modalRef.value?.setMode(mode),
  clearSelection,
  setSelection,
});
</script>

<template>
  <div class="w-full">
    <slot name="trigger" :handle-open="handleOpen">
      <CommonTrigger
        v-if="!hideTrigger"
        :disabled="disabled"
        id-field="id"
        :placeholder="placeholder"
        :selected-rows="selectedRows"
        :value="value"
        name-field="name"
        @click="handleOpen"
        @remove="handleRemove"
      />
    </slot>

    <CommonModal
      ref="modalRef"
      :default-selected-rows="selectedRows"
      :display-mode="displayMode"
      :modal-title="$t('plugin.selectTitle', '选择插件')"
      :multiple="multiple"
      :query-api="queryPluginList"
      :search-form-schemas="searchFormSchemas"
      :show-pager="showPager"
      :show-search-form="showSearchForm"
      :table-columns="tableColumns"
      id-field="id"
      name-field="name"
      @confirm="handleConfirm"
    >
      <!-- Table Slots -->
      <template #type="{ row }">
        <Tag
          class="rounded-md border-0 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
        >
          {{ pluginTypeMap.get(row.type) || row.type }}
        </Tag>
      </template>

      <!-- Card Slot -->
      <template #card-item="{ item, isSelected }">
        <PluginCardItem
          :is-selected="isSelected"
          :item="item"
          :type-map="pluginTypeMap"
        />
      </template>
    </CommonModal>
  </div>
</template>
