<script setup lang="ts">
import type { CommonSelectorProps } from '#/components/business/common-selector';

import { ref } from 'vue';

import { $t } from '@vben/locales';

import { CommonModal } from '#/components/business/common-selector';

import {
  queryNotifyConfigList,
  useNotifyConfigSelectorConfig,
} from '../config';
import NotifyConfigCardItem from './NotifyConfigCardItem.vue';

defineProps<CommonSelectorProps>();
const emit = defineEmits(['confirm']);

const { searchFormSchemas, tableColumns } = useNotifyConfigSelectorConfig();

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
    :modal-title="$t('notify.config.selectTitle', '选择通知配置')"
    name-field="name"
    :params-terms="paramsTerms"
    :query-api="queryNotifyConfigList"
    :search-form-schemas="searchFormSchemas"
    :table-columns="tableColumns"
    @confirm="handleConfirm"
  >
    <!-- Card Slot -->
    <template #card-item="{ item, isSelected }">
      <NotifyConfigCardItem :is-selected="isSelected" :item="item" />
    </template>
  </CommonModal>
</template>
