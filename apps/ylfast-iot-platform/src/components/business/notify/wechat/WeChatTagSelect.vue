<script setup lang="ts">
import { computed } from 'vue';

import { getWeChatTags } from '#/api/iot/notify/template';
import YlApiSelect from '#/components/yl-api-select';

import { useNotifySelect } from '../hooks/useNotifySelect';

const props = defineProps<{
  /** 多选时值的格式化分隔符 (如 ",") */
  arrayValueFormat?: string;
  configId?: string;
  formModel?: any;
  value?: any;
}>();

const emit = defineEmits(['update:value', 'change']);

const { useReactivePlaceholder } = useNotifySelect(props.formModel);

const resolvedConfigId = useReactivePlaceholder(() => props.configId);

const internalValue = computed({
  get: () => props.value,
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

const dynamicApi = async () => {
  if (!resolvedConfigId.value) return [];
  return getWeChatTags(resolvedConfigId.value);
};

const combinedParams = computed(() => ({
  _configId: resolvedConfigId.value,
}));
</script>

<template>
  <YlApiSelect
    v-bind="$attrs"
    v-model:value="internalValue"
    :api="dynamicApi"
    :params="combinedParams"
    label-field="name"
    value-field="id"
    class="w-full"
  />
</template>
