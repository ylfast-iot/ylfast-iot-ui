<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { $t } from '@vben/locales';

import { CommonModal } from '#/components/business/common-selector';

import {
  queryNotifyTemplateList,
  useNotifyTemplateSelectorConfig,
} from '../config';
import NotifyTemplateCardItem from './NotifyTemplateCardItem.vue';

defineProps<CommonSelectorProps>();
const emit = defineEmits(['confirm']);

const { searchFormSchemas, tableColumns } = useNotifyTemplateSelectorConfig();

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
    :modal-title="$t('notify.template.selectTitle', '选择通知模板')"
    name-field="name"
    :params-terms="paramsTerms"
    :query-api="queryNotifyTemplateList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @confirm="handleConfirm"
  >
    <!-- Card Slot -->
    <template #card-item="{ item, isSelected }">
      <NotifyTemplateCardItem :is-selected="isSelected" :item="item" />
    </template>
  </CommonModal>
</template>
