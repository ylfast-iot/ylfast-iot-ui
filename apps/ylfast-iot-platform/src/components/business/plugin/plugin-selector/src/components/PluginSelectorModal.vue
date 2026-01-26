<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { onMounted, ref } from 'vue';

import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

import { getPluginTypes } from '#/api/iot/plugin';
import { CommonModal } from '#/components/business/common-selector';

import { queryPluginList, usePluginSelectorConfig } from '../config';
import PluginCardItem from './PluginCardItem.vue';

defineProps<CommonSelectorProps>();
const emit = defineEmits(['confirm']);

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
    console.error('Failed to load plugin types for selector modal:', error);
  }
});

function open(options: any = {}) {
  modalRef.value?.open(options);
}

function close() {
  modalRef.value?.close();
}

function handleConfirm(val: any, records: any[]) {
  emit('confirm', val, records);
}

defineExpose({ open, close });
</script>

<template>
  <CommonModal
    ref="modalRef"
    id-field="id"
    :modal-title="$t('plugin.selectTitle', '选择插件')"
    name-field="name"
    :params-terms="paramsTerms"
    :query-api="queryPluginList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
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
</template>
