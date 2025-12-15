<script setup lang="ts">
import type { StringTypeDef } from '#/types/data-type';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { Form, FormItem, InputNumber } from 'ant-design-vue';

const props = defineProps<{
  value: StringTypeDef;
}>();

const emit = defineEmits(['update:value', 'change']);

const model = computed({
  get: () => props.value,
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});
</script>

<template>
  <Form layout="vertical" :model="model">
    <FormItem :label="$t('dataType.strategies.string.maxLength')">
      <InputNumber
        v-model:value="model.maxLength"
        class="w-full"
        :placeholder="$t('dataType.strategies.string.placeholders.maxLength')"
        :min="0"
        :precision="0"
      />
    </FormItem>
  </Form>
</template>
