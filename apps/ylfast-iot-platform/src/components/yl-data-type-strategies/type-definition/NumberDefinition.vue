<script setup lang="ts">
import type { NumberTypeDef, Unit } from '#/types/data-type';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { Form, FormItem, InputNumber, Select } from 'ant-design-vue';

import { useUnit } from '#/hooks/unit/useUnit';

const props = defineProps<{
  value: NumberTypeDef;
}>();

const emit = defineEmits(['update:value', 'change']);

const model = computed({
  get: () => props.value,
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

const isFloat = computed(() => {
  return ['DOUBLE', 'FLOAT'].includes(props.value.type);
});

const { unitOptions } = useUnit();

// Proxy for mode="tags" (array) <-> unit (string)
const unitValueProxy = computed({
  get: () => (model.value.unit ? [model.value.unit] : []),
  set: (val: string[]) => {
    // Take the last selected value (mimicking single selection in tags mode)
    // or undefined if cleared
    const lastVal = val && val.length > 0 ? val[val.length - 1] : undefined;
    model.value.unit = lastVal;
  },
});

function filterOption(input: string, option: any) {
  const original = option.original as Unit;
  const lowerInput = input.toLowerCase();
  return (
    original.name.toLowerCase().includes(lowerInput) ||
    original.symbol.toLowerCase().includes(lowerInput) ||
    original.id.toLowerCase().includes(lowerInput) ||
    (option.label && option.label.toLowerCase().includes(lowerInput))
  );
}
</script>

<template>
  <Form layout="vertical" :model="model">
    <FormItem :label="$t('dataType.strategies.number.min')">
      <InputNumber
        v-model:value="model.min"
        class="w-full"
        :placeholder="$t('dataType.strategies.number.placeholders.min')"
        :step="isFloat ? 0.1 : 1"
        :precision="isFloat ? undefined : 0"
      />
    </FormItem>
    <FormItem :label="$t('dataType.strategies.number.max')">
      <InputNumber
        v-model:value="model.max"
        class="w-full"
        :placeholder="$t('dataType.strategies.number.placeholders.max')"
        :step="isFloat ? 0.1 : 1"
        :precision="isFloat ? undefined : 0"
      />
    </FormItem>
    <FormItem :label="$t('dataType.strategies.number.unit')">
      <Select
        v-model:value="unitValueProxy"
        :options="unitOptions"
        :filter-option="filterOption"
        mode="tags"
        :max-tag-count="1"
        show-search
        :placeholder="$t('dataType.strategies.number.placeholders.unit')"
        allow-clear
        class="w-full"
      />
    </FormItem>
    <template v-if="isFloat">
      <FormItem :label="$t('dataType.strategies.number.precision')">
        <InputNumber
          v-model:value="model.scale"
          class="w-full"
          :placeholder="$t('dataType.strategies.number.placeholders.precision')"
          :min="0"
          :precision="0"
        />
      </FormItem>
    </template>
  </Form>
</template>
