<script setup lang="ts">
import { computed } from 'vue';

import { Form, FormItem, Input, InputNumber } from 'ant-design-vue';

const props = defineProps<{
  value: Record<string, any>;
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
    <FormItem label="最小值">
      <InputNumber v-model:value="model.min" class="w-full" />
    </FormItem>
    <FormItem label="最大值">
      <InputNumber v-model:value="model.max" class="w-full" />
    </FormItem>
    <FormItem label="单位">
      <Input v-model:value="model.unit" allow-clear />
    </FormItem>
    <FormItem label="缩放比例">
      <InputNumber v-model:value="model.scale" class="w-full" />
    </FormItem>
  </Form>
</template>
