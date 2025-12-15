<script setup lang="ts">
import type { ArrayDef, DataType, DataTypeDef } from '#/types/data-type';

import { onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { cloneDeep } from '@vben/utils';

import { Form, FormItem, Select } from 'ant-design-vue';

import { DATA_TYPE_OPTIONS } from '#/enums/data-type';

import { getTypeDefinitionComponent } from './registry';

const props = defineProps<{
  disabled?: boolean;
  value: ArrayDef;
}>();

const emit = defineEmits(['update:value', 'change']);

onMounted(() => {
  if (!props.value.elementType) {
    const newValue = {
      ...props.value,
      elementType: { type: 'STRING' as DataType },
    };
    emit('update:value', newValue);
    emit('change', newValue);
  }
});

const SettingOutlined = createIconifyIcon('ant-design:setting-outlined');

const currentConfigType = ref<DataType | null>(null);
const tempConfigValue = ref<DataTypeDef | null>(null);

const [ConfigModal, modalApi] = useVbenModal({
  title: '元素类型配置',
  class: 'w-3/5',
  closeOnClickModal: false,
  destroyOnClose: false,
  draggable: true,
  onConfirm: () => {
    if (tempConfigValue.value) {
      const newValue = {
        ...props.value,
        elementType: {
          ...props.value.elementType,
          ...tempConfigValue.value,
        },
      };
      emit('update:value', newValue);
      emit('change', newValue);
      modalApi.close();
    }
  },
});

function hasConfig(type: DataType) {
  return !!getTypeDefinitionComponent(type);
}

function openConfig() {
  currentConfigType.value = props.value.elementType.type;
  tempConfigValue.value = cloneDeep(props.value.elementType);
  modalApi.open();
}

function handleTypeChange(val: any) {
  const newValue = {
    ...props.value,
    elementType: {
      type: val,
    },
  };
  emit('update:value', newValue);
  emit('change', newValue);
}
</script>

<template>
  <div
    class="array-definition rounded border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
  >
    <ConfigModal>
      <div v-if="currentConfigType && tempConfigValue" class="p-4">
        <component
          :is="getTypeDefinitionComponent(currentConfigType)"
          v-model:value="tempConfigValue"
        />
      </div>
    </ConfigModal>

    <Form layout="vertical">
      <FormItem label="数组元素类型">
        <div class="flex items-center gap-2">
          <Select
            :value="value.elementType?.type"
            :options="DATA_TYPE_OPTIONS"
            class="flex-1"
            @change="handleTypeChange"
            :disabled="disabled"
          />
          <div
            v-if="value.elementType && hasConfig(value.elementType.type)"
            class="flex size-8 cursor-pointer items-center justify-center rounded bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
            @click="openConfig"
          >
            <SettingOutlined />
          </div>
        </div>
      </FormItem>
    </Form>
  </div>
</template>
