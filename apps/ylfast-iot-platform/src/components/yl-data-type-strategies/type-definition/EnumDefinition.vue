<script setup lang="ts">
import type { DataType, EmunTypeDef, EnumItem } from '#/types/data-type';

import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';

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

const props = defineProps<{
  disabled?: boolean;
  value?: EmunTypeDef;
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
    } as EmunTypeDef),
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

const dataTypes: DataType[] = [
  'STRING',
  'INTEGER',
  'LONG',
  'DOUBLE',
  'BOOLEAN',
];

const columns = [
  { title: '标签', dataIndex: 'label', key: 'label', width: '25%' },
  { title: '值', dataIndex: 'value', key: 'value', width: '25%' },
  { title: '描述', dataIndex: 'description', key: 'description', width: '35%' },
  { title: '操作', key: 'action', width: '15%', align: 'center' },
];

function addEnumItem() {
  const newItem: EnumItem = {
    label: '',
    value: null,
    description: '',
    propertyValueType: innerValue.value.elementValueType || { type: 'STRING' },
  };
  // Create a new array to trigger reactivity properly
  const newEnums = [...(innerValue.value.enums || []), newItem];
  innerValue.value = { ...innerValue.value, enums: newEnums };
}

function removeEnumItem(index: number) {
  const newEnums = [...(innerValue.value.enums || [])];
  newEnums.splice(index, 1);
  innerValue.value = { ...innerValue.value, enums: newEnums };
}

function handleTypeChange(type: DataType) {
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
      <div class="flex gap-4">
        <FormItem label="多选" class="mb-2">
          <Switch v-model:checked="innerValue.multi" :disabled="disabled" />
        </FormItem>

        <FormItem label="元素类型" class="mb-2 flex-1">
          <Select
            :value="innerValue.elementValueType?.type"
            @update:value="handleTypeChange"
            :options="dataTypes.map((t) => ({ label: t, value: t }))"
            :disabled="disabled"
          />
        </FormItem>
      </div>

      <FormItem label="枚举项列表" class="mb-0">
        <Table
          :data-source="innerValue.enums || []"
          :columns="columns"
          size="small"
          :pagination="false"
          bordered
          row-key="value"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'label'">
              <Input
                v-model:value="record.label"
                placeholder="标签"
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
                  { label: 'True', value: true },
                  { label: 'False', value: false },
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
                placeholder="描述"
                :disabled="disabled"
              />
            </template>

            <template v-if="column.key === 'action'">
              <Popconfirm title="确定删除吗?" @confirm="removeEnumItem(index)">
                <Button type="text" danger size="small">
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
          <template #icon><PlusOutlined /></template> 添加枚举项
        </Button>
      </FormItem>
    </Form>
  </div>
</template>
