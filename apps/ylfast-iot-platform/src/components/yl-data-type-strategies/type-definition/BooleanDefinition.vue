<script setup lang="ts">
import type { BooleanTypeDef } from '#/types/data-type';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { Form, FormItem, Input, Select } from 'ant-design-vue';

const props = defineProps<{
  value: BooleanTypeDef;
}>();

const emit = defineEmits(['update:value', 'change']);
const model = computed({
  get: () => {
    // Ensure default valueType
    if (!props.value.valueType) {
      // eslint-disable-next-line vue/no-mutating-props,vue/no-side-effects-in-computed-properties
      props.value.valueType = 'STRING';
    }
    return props.value;
  },
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

const valueTypeOptions = computed(() => [
  {
    label: $t('dataType.strategies.boolean.valueTypes.string'),
    value: 'STRING',
  },
  {
    label: $t('dataType.strategies.boolean.valueTypes.number'),
    value: 'NUMBER',
  },
  {
    label: $t('dataType.strategies.boolean.valueTypes.boolean'),
    value: 'BOOLEAN',
  },
]);
</script>

<template>
  <Form layout="vertical" :model="model">
    <FormItem :label="$t('dataType.strategies.boolean.mapping')">
      <div class="flex flex-col gap-4">
        <!-- True Row -->
        <div class="flex items-center gap-2">
          <span class="w-12 font-bold">true:</span>
          <div class="flex flex-1 gap-2">
            <Input
              v-model:value="model.trueText"
              :placeholder="`${$t('dataType.defaultValue')}: ${$t('dataType.strategies.boolean.defaultYes')}`"
              allow-clear
              class="flex-1"
            >
              <template #addonBefore>
                {{ $t('dataType.strategies.boolean.name') }}
              </template>
            </Input>
            <Input
              v-model:value="model.trueValue"
              :placeholder="`${$t('dataType.defaultValue')}: true`"
              allow-clear
              class="flex-1"
            >
              <template #addonBefore>
                {{ $t('dataType.strategies.boolean.value') }}
              </template>
              <template #addonAfter>
                <Select
                  v-model:value="model.valueType"
                  :options="valueTypeOptions"
                  style="width: 100px"
                />
              </template>
            </Input>
          </div>
        </div>

        <!-- False Row -->
        <div class="flex items-center gap-2">
          <span class="w-12 font-bold">false:</span>
          <div class="flex flex-1 gap-2">
            <Input
              v-model:value="model.falseText"
              :placeholder="`${$t('dataType.defaultValue')}: ${$t('dataType.strategies.boolean.defaultNo')}`"
              allow-clear
              class="flex-1"
            >
              <template #addonBefore>
                {{ $t('dataType.strategies.boolean.name') }}
              </template>
            </Input>
            <Input
              v-model:value="model.falseValue"
              :placeholder="`${$t('dataType.defaultValue')}: false`"
              allow-clear
              class="flex-1"
            >
              <template #addonBefore>
                {{ $t('dataType.strategies.boolean.value') }}
              </template>
              <template #addonAfter>
                <Select
                  v-model:value="model.valueType"
                  :options="valueTypeOptions"
                  style="width: 100px"
                />
              </template>
            </Input>
          </div>
        </div>
      </div>
    </FormItem>
  </Form>
</template>
