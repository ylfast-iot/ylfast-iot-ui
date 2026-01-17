<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { Tag } from 'ant-design-vue';

import { CommonList } from '#/components/business/common-selector';

import {
  getCertificateAuthMethodInfo,
  getCertificateFormatInfo,
  getCertificateModeInfo,
  getCertificateTypeInfo,
  queryCertificateList,
  useCertificateSelectorConfig,
} from '../config';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['selectionChange']);

const { searchFormSchemas, tableColumns } = useCertificateSelectorConfig();

const listRef = ref();

function handleSelectionChange(rows: any[]) {
  emit('selectionChange', rows);
}

function getSelection() {
  return listRef.value?.getSelection();
}

function clearSelection() {
  listRef.value?.clearSelection();
}

function setSelection(rows: any[]) {
  listRef.value?.setSelection(rows);
}

defineExpose({ clearSelection, getSelection, setSelection });
</script>

<template>
  <CommonList
    ref="listRef"
    v-bind="props"
    id-field="id"
    :query-api="queryCertificateList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @selection-change="handleSelectionChange"
  >
    <!-- Table Slots -->
    <template #type="{ row }">
      <Tag :color="getCertificateTypeInfo(row.type).color">
        {{ getCertificateTypeInfo(row.type).label }}
      </Tag>
    </template>
    <template #format="{ row }">
      <Tag :color="getCertificateFormatInfo(row.format).color">
        {{ getCertificateFormatInfo(row.format).label }}
      </Tag>
    </template>
    <template #mode="{ row }">
      <Tag :color="getCertificateModeInfo(row.mode).color">
        {{ getCertificateModeInfo(row.mode).label }}
      </Tag>
    </template>
    <template #authenticationMethod="{ row }">
      <Tag
        :color="getCertificateAuthMethodInfo(row.authenticationMethod).color"
      >
        {{ getCertificateAuthMethodInfo(row.authenticationMethod).label }}
      </Tag>
    </template>
  </CommonList>
</template>
