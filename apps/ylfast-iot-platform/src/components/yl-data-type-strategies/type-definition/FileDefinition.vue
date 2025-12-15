<script setup lang="ts">
import type { FileTypeDef } from '#/types/data-type';

import { $t } from '@vben/locales';

import { Form, FormItem, Select } from 'ant-design-vue';

defineProps<{
  disabled?: boolean;
  value: FileTypeDef;
}>();

const emit = defineEmits(['update:value', 'change']);
</script>

<template>
  <div
    class="file-definition rounded border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
  >
    <Form layout="vertical">
      <FormItem :label="$t('dataType.strategies.file.bodyType')">
        <Select
          :value="value.bodyType"
          :options="[
            {
              label: $t('dataType.strategies.file.types.base64'),
              value: 'base64',
            },
            { label: $t('dataType.strategies.file.types.url'), value: 'url' },
          ]"
          :disabled="disabled"
          @update:value="
            (val) => {
              const newValue = { ...value, bodyType: val };
              emit('update:value', newValue);
              emit('change', newValue);
            }
          "
        />
      </FormItem>
    </Form>
  </div>
</template>
