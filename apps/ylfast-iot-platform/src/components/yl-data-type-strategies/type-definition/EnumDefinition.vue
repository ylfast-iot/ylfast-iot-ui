<script setup lang="ts">
import type { EnumItem, EnumTypeDef } from '#/types/data-type';

import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Switch,
  Table,
} from 'ant-design-vue';

import { DATA_TYPE_OPTIONS } from '#/enums/data-type';

const props = defineProps<{
  disabled?: boolean;
  value?: EnumTypeDef;
}>();
const emit = defineEmits(['update:value', 'change']);
const DeleteOutlined = createIconifyIcon('ant-design:delete-outlined');
const PlusOutlined = createIconifyIcon('ant-design:plus-outlined');

// Default structure
const innerValue = computed({
  get: () =>
    props.value ||
    ({
      type: 'ENUM',
      enums: [],
      multi: false,
      elementValueType: { type: 'STRING' },
    } as EnumTypeDef),
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

const ALLOWED_ENUM_TYPES = new Set([
  'BOOLEAN',
  'DOUBLE',
  'INTEGER',
  'LONG',
  'STRING',
]);
const dataTypes = DATA_TYPE_OPTIONS.filter((opt) =>
  ALLOWED_ENUM_TYPES.has(opt.value),
);

const columns = computed(
  () =>
    [
      {
        title: $t('dataType.strategies.enum.label'),
        dataIndex: 'label',
        key: 'label',
        width: '25%',
      },
      {
        title: $t('dataType.strategies.enum.value'),
        dataIndex: 'value',
        key: 'value',
        width: '25%',
      },
      {
        title: $t('dataType.strategies.enum.description'),
        dataIndex: 'description',
        key: 'description',
        width: '35%',
      },
      {
        title: $t('dataType.strategies.enum.action'),
        key: 'action',
        width: '15%',
        align: 'center',
      },
    ] as any[],
);

function addEnumItem() {
  const newItem: EnumItem & { key: string } = {
    label: '',
    value: null,
    description: '',
    propertyValueType: innerValue.value.elementValueType || { type: 'STRING' },
    key: `${Date.now()}-${Math.random()}`, // Internal unique key for UI stability
  };
  // Create a new array to trigger reactivity properly
  const newEnums = [...(innerValue.value.enums || []), newItem];
  innerValue.value = { ...innerValue.value, enums: newEnums };
}

function removeEnumItem(index: number) {
  if (props.disabled) {
    return;
  }
  const newEnums = [...(innerValue.value.enums || [])];
  newEnums.splice(index, 1);
  innerValue.value = { ...innerValue.value, enums: newEnums };
}

function handleTypeChange(type: any) {
  // When type changes, we might need to clear values or let them be coerced.
  // For safety, we reset enums or warn. Here we define simple behavior: preserve but value might be wrong type.
  // Ideally we should cast existing values or clear them. Clearing is safer.
  innerValue.value = {
    ...innerValue.value,
    elementValueType: { type },
    enums: [],
  };
}
</script>

<template>
  <div
    class="enum-definition rounded border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900"
  >
    <Form layout="vertical">
      <FormItem
        :label="$t('dataType.strategies.enum.multiSelect')"
        class="mb-2"
      >
        <Switch v-model:checked="innerValue.multi" :disabled="disabled" />
      </FormItem>

      <FormItem
        :label="$t('dataType.strategies.enum.elementType')"
        class="mb-2 flex-1"
      >
        <Select
          :value="innerValue.elementValueType?.type"
          @update:value="handleTypeChange"
          :options="dataTypes"
          :disabled="disabled"
        />
      </FormItem>

      <FormItem :label="$t('dataType.strategies.enum.list')" class="mb-0">
        <Table
          :data-source="innerValue.enums || []"
          :columns="columns"
          size="small"
          :pagination="false"
          bordered
          row-key="key"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'label'">
              <Input
                v-model:value="record.label"
                :placeholder="$t('dataType.strategies.enum.placeholders.label')"
                :disabled="disabled"
              />
            </template>

            <template v-if="column.key === 'value'">
              <InputNumber
                v-if="
                  ['INTEGER', 'LONG', 'DOUBLE', 'FLOAT'].includes(
                    innerValue.elementValueType?.type,
                  )
                "
                v-model:value="record.value"
                class="w-full"
                :disabled="disabled"
              />
              <Select
                v-else-if="innerValue.elementValueType?.type === 'BOOLEAN'"
                v-model:value="record.value"
                :options="[
                  {
                    label: $t('dataType.strategies.boolean.defaultYes'),
                    value: 'true',
                  },
                  {
                    label: $t('dataType.strategies.boolean.defaultNo'),
                    value: 'false',
                  },
                ]"
                :disabled="disabled"
              />
              <Input
                v-else
                v-model:value="record.value"
                class="w-full"
                :disabled="disabled"
              />
            </template>

            <template v-if="column.key === 'description'">
              <Input
                v-model:value="record.description"
                :placeholder="
                  $t('dataType.strategies.enum.placeholders.description')
                "
                :disabled="disabled"
              />
            </template>

            <template v-if="column.key === 'action'">
              <Popconfirm
                :title="$t('dataType.strategies.enum.deleteConfirm')"
                @confirm="removeEnumItem(index)"
              >
                <Button type="text" danger size="small" :disabled="disabled">
                  <template #icon><DeleteOutlined /></template>
                </Button>
              </Popconfirm>
            </template>
          </template>
        </Table>
        <Button
          type="dashed"
          block
          class="mt-2"
          @click="addEnumItem"
          :disabled="disabled"
        >
          <template #icon><PlusOutlined /></template>
          {{ $t('dataType.strategies.enum.add') }}
        </Button>
      </FormItem>
    </Form>
  </div>
</template>
