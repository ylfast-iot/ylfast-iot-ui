<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { ArrayDef, DataType } from '#/types/data-type';

import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button } from 'ant-design-vue';

import { isDisabled } from '#/utils/config-metadata';

import { getFormItemComponent } from './registry';

const props = defineProps<{
  disabled?: boolean;
  prop: ConfigPropertyMetadata;
  value: any;
}>();

const emit = defineEmits(['update:value', 'change']);

const DeleteOutlined = createIconifyIcon('ant-design:delete-outlined');
const PlusOutlined = createIconifyIcon('ant-design:plus-outlined');

const innerValue = computed({
  get: () => (Array.isArray(props.value) ? props.value : []),
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

const arrayDef = computed(() => props.prop.type as ArrayDef);
const elementType = computed(
  () => arrayDef.value.elementType || (arrayDef.value as any).array, // arrayDef.value.array适配之前老的配置
);

function getDefaultValue(type: DataType): any {
  switch (type) {
    case 'ARRAY': {
      return [];
    }
    case 'BOOLEAN': {
      return false;
    }
    case 'DATE': {
      return null;
    }
    case 'DOUBLE':
    case 'FLOAT':
    case 'INTEGER':
    case 'LONG':
    case 'SHORT': {
      return 0;
    }
    case 'ENUM': {
      return null;
    }
    case 'FILE': {
      return '';
    }
    case 'GEO': {
      return { lat: 0, lon: 0 };
    }
    case 'OBJECT': {
      return {};
    }
    case 'STRING': {
      return '';
    }
    default: {
      return null;
    }
  }
}

function addItem() {
  const newItem = elementType.value
    ? getDefaultValue(elementType.value.type)
    : null;
  const newList = [...innerValue.value, newItem];
  innerValue.value = newList;
}

function removeItem(index: number) {
  const newList = [...innerValue.value];
  newList.splice(index, 1);
  innerValue.value = newList;
}

function updateItem(index: number, val: any) {
  const newList = [...innerValue.value];
  newList[index] = val;
  innerValue.value = newList;
}

function getChildProp(): ConfigPropertyMetadata {
  return {
    ...props.prop,
    name: '', // Hide name in list
    type: elementType.value,
  };
}
</script>

<template>
  <div
    class="array-input overflow-hidden rounded-md border border-border p-2"
    :class="{ 'opacity-60': disabled || isDisabled(prop) }"
  >
    <div v-if="innerValue.length > 0" class="flex flex-col gap-2">
      <div
        v-for="(item, index) in innerValue"
        :key="index"
        class="flex items-start gap-2"
      >
        <div
          class="mt-2 flex w-6 shrink-0 justify-center text-xs text-muted-foreground"
        >
          {{ index + 1 }}.
        </div>
        <div class="flex-1">
          <component
            :is="getFormItemComponent(elementType.type)"
            v-if="elementType && getFormItemComponent(elementType.type)"
            :prop="getChildProp()"
            :value="item"
            :disabled="disabled || isDisabled(prop)"
            @update:value="(val: any) => updateItem(index, val)"
            @change="(val: any) => updateItem(index, val)"
          />
          <div v-else class="text-sm italic text-muted-foreground">
            Unknown type: {{ elementType?.type }}
          </div>
        </div>
        <Button
          type="text"
          danger
          size="small"
          class="mt-1"
          @click="removeItem(index)"
          :disabled="disabled || isDisabled(prop)"
        >
          <template #icon><DeleteOutlined /></template>
        </Button>
      </div>
    </div>
    <div v-else class="py-2 text-center text-sm text-muted-foreground">
      {{ $t('dataType.strategies.array.empty') }}
    </div>

    <Button
      type="dashed"
      block
      class="mt-2"
      @click="addItem"
      :disabled="disabled || isDisabled(prop)"
    >
      <template #icon><PlusOutlined /></template>
      {{ $t('dataType.strategies.array.add') }}
    </Button>
  </div>
</template>
