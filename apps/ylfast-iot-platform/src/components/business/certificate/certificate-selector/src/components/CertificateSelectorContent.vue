<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { Tag } from 'ant-design-vue';

import { CommonSelectorContent } from '#/components/business/common-selector';

import {
  getCertificateAuthMethodInfo,
  getCertificateFormatInfo,
  getCertificateModeInfo,
  getCertificateTypeInfo,
  queryCertificateList,
  useCertificateSelectorConfig,
} from '../config';
import CertificateCardItem from './CertificateCardItem.vue';

const props = defineProps<CommonSelectorProps>();

const emit = defineEmits(['change']);

const { searchFormSchemas, tableColumns } = useCertificateSelectorConfig();

const contentRef = ref();

function handleChange(rows: any[]) {
  emit('change', rows);
}

function getSelection() {
  return contentRef.value?.getSelection();
}

function clearSelection() {
  contentRef.value?.clearSelection();
}

function setSelection(rows: any[]) {
  contentRef.value?.setSelection(rows);
}

function setMode(mode: 'card' | 'table') {
  contentRef.value?.setMode(mode);
}

defineExpose({ clearSelection, getSelection, setMode, setSelection });
</script>

<template>
  <CommonSelectorContent
    ref="contentRef"
    v-bind="props"
    id-field="id"
    :query-api="queryCertificateList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @change="handleChange"
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

    <!-- Card Slot -->
    <template #card-item="{ item, isSelected }">
      <CertificateCardItem :is-selected="isSelected" :item="item" />
    </template>
  </CommonSelectorContent>
</template>
