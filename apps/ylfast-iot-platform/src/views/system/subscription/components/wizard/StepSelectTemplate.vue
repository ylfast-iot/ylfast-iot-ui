<script setup lang="ts">
import { $t } from '@vben/locales';

import { NotifyTemplateCardSelector } from '#/components/business/notify/template-selector';

interface Props {
  selectedRow: any;
  filterTerms: any[];
}

defineProps<Props>();
const emit = defineEmits(['change']);

function handleSelection(rows: any[]) {
  emit('change', rows);
}
</script>

<template>
  <div>
    <p class="mb-4 text-sm text-muted-foreground">
      {{ $t('subscription.wizard.selectTemplateTip') }}
    </p>
    <div class="mb-4">
      <NotifyTemplateCardSelector
        :multiple="false"
        :default-selected-rows="selectedRow ? [selectedRow] : []"
        :params-terms="filterTerms"
        :show-pager="true"
        :show-search-form="true"
        :show-more-button="false"
        @selection-change="handleSelection"
      />
    </div>
  </div>
</template>
