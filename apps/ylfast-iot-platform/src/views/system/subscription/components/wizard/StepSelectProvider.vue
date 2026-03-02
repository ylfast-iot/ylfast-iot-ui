<script setup lang="ts">
import { $t } from '@vben/locales';

import { Spin } from 'ant-design-vue';

import IconCardSelect from '#/components/yl-icon-card-select/index.vue';

interface Props {
  value: string;
  options: { color?: string; icon?: string; label: string; value: string }[];
  loading?: boolean;
}

defineProps<Props>();
const emit = defineEmits(['update:value']);

function handleChange(val: any) {
  emit('update:value', val);
}
</script>

<template>
  <div>
    <p class="mb-4 text-sm text-muted-foreground">
      {{ $t('subscription.wizard.selectProviderTip') }}
    </p>
    <Spin :spinning="loading">
      <IconCardSelect
        :value="value"
        :options="options"
        @update:value="handleChange"
      />
    </Spin>
  </div>
</template>
