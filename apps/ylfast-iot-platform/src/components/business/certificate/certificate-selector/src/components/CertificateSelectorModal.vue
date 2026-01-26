<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

import { CommonModal } from '#/components/business/common-selector';

import {
  getCertificateAuthMethodInfo,
  getCertificateFormatInfo,
  getCertificateModeInfo,
  getCertificateTypeInfo,
  queryCertificateList,
  useCertificateSelectorConfig,
} from '../config';
import CertificateCardItem from './CertificateCardItem.vue';

defineProps<CommonSelectorProps>();
const emit = defineEmits(['confirm']);

const { searchFormSchemas, tableColumns } = useCertificateSelectorConfig();

const modalRef = ref();

function open(options: any = {}) {
  modalRef.value?.open(options);
}

function close() {
  modalRef.value?.close();
}

function handleConfirm(val: any, records: any[]) {
  emit('confirm', val, records);
}

defineExpose({ close, open });
</script>

<template>
  <CommonModal
    ref="modalRef"
    id-field="id"
    :modal-title="$t('certificate.selector.title')"
    name-field="name"
    :params-terms="paramsTerms"
    :query-api="queryCertificateList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @confirm="handleConfirm"
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
  </CommonModal>
</template>
