<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';

import { computed, ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { FormItem, Tooltip } from 'ant-design-vue';

import { getFormItemComponent } from '#/components/yl-data-type-strategies/value-input';
import UnsupportedInput from '#/components/yl-data-type-strategies/value-input/UnsupportedInput.vue';
import { getRules } from '#/utils/config-metadata';

const props = defineProps<{
  prop: ConfigPropertyMetadata;
  value: any;
}>();

const emit = defineEmits(['update:value', 'change']);

const QuestionCircleOutlined = createIconifyIcon(
  'ant-design:question-circle-outlined',
);

const inputComponent = computed(() => {
  return getFormItemComponent(props.prop.type.type) || UnsupportedInput;
});

const innerValue = computed({
  get: () => props.value,
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

const strategyRef = ref();

// Expose methods by calling strategy's exposed methods if available
defineExpose({
  validate: async () => {
    if (strategyRef.value && typeof strategyRef.value.validate === 'function') {
      return strategyRef.value.validate();
    }
  },
  resetFields: async () => {
    if (
      strategyRef.value &&
      typeof strategyRef.value.resetFields === 'function'
    ) {
      return strategyRef.value.resetFields();
    }
  },
});
</script>

<template>
  <FormItem :name="prop.property" :rules="getRules(prop)">
    <template #label>
      <div class="flex items-center">
        {{ prop.name }}
        <Tooltip v-if="prop.description" :title="prop.description" class="ml-1">
          <span class="inline-flex items-center">
            <QuestionCircleOutlined
              class="cursor-help text-gray-400 dark:text-gray-500"
            />
          </span>
        </Tooltip>
      </div>
    </template>

    <component
      :is="inputComponent"
      ref="strategyRef"
      :prop="prop"
      :value="innerValue"
      @update:value="(val) => (innerValue = val)"
    />
  </FormItem>
</template>
