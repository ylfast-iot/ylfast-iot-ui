<script setup lang="ts">
import type { QueryParamEntity, Term } from '#/adapter';
import type { PagerResult } from '#/api/basic';
import type { IotNotifyHistoryApi } from '#/api/iot/notify/history';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import NotifyHistoryList from './NotifyHistoryList.vue';

interface ModalData {
  /** 查询接口 */
  api: (
    query: QueryParamEntity,
  ) => Promise<PagerResult<IotNotifyHistoryApi.NotifyHistory>>;
  /** 固定查询条件 */
  fixedTerms?: Term[];
  /** 标题 */
  title?: string;
  /** 是否启用模板查询下拉 */
  enableTemplateSearch?: boolean;
  /** 是否显示搜索表单 */
  showSearchForm?: boolean;
}

const api = ref<any>(null);
const fixedTerms = ref<Term[]>([]);
const modalTitle = ref($t('notify.debug.history'));
const enableTemplateSearch = ref(false);
const showSearchForm = ref(true);

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  title: modalTitle.value,
  class: 'w-[80%]',
  closeOnClickModal: false,
  showCancelButton: false,
  showConfirmButton: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<ModalData>();
      if (data) {
        api.value = data.api;
        fixedTerms.value = data.fixedTerms || [];
        if (data.title) {
          modalTitle.value = data.title;
        }
        enableTemplateSearch.value = !!data.enableTemplateSearch;
        if (data.showSearchForm !== undefined) {
          showSearchForm.value = !!data.showSearchForm;
        }
      }
    }
  },
});
</script>

<template>
  <Modal :title="modalTitle">
    <div class="h-[600px] p-4">
      <NotifyHistoryList
        v-if="api"
        :api="api"
        :show-search-form="showSearchForm"
        :fixed-terms="fixedTerms"
        height="100%"
        :enable-template-search="enableTemplateSearch"
      />
    </div>
  </Modal>
</template>
