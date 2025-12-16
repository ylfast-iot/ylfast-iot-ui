<script setup lang="ts">
import type { ColumnType } from 'ant-design-vue/es/table';

import type { SystemMenuApi } from '#/api/system/menu';

import { ref, watch } from 'vue';

import { useVbenForm, useVbenModal, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Button, Popconfirm, Table } from 'ant-design-vue';

import PermissionConfig from './PermissionConfig.vue';

interface Props {
  value?: SystemMenuApi.ButtonInfo[];
}

const props = defineProps<Props>();
const emit = defineEmits(['update:value']);

const dataSource = ref<SystemMenuApi.ButtonInfo[]>([]);

watch(
  () => props.value,
  (val) => {
    dataSource.value = val ? [...val] : [];
  },
  { immediate: true, deep: true },
);

function emitValue() {
  emit('update:value', dataSource.value);
}

// Button Form & Modal
const [ButtonForm, formApi] = useVbenForm({
  layout: 'vertical',
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'id',
      label: $t('menu.button.code'), // Code
      rules: z.string().min(1, $t('menu.button.codePlaceholder')),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('menu.button.name'),
      rules: z.string().min(1, $t('menu.button.namePlaceholder')),
    },
    // For permissions within a button, we might need a similar selector.
    // But typically buttons are linked to specific permissions.
    // If we follow the data structure, it's PermissionInfo[].
    // Let's use a slot or a simple JSON input if complex,
    // or reusing PermissionConfig might be too heavy for a modal inside a drawer.
    // Let's try to use PermissionConfig as a custom component field?
    // Or just a simple list for now.
    // The screenshot showed "Permissions" input. Let's assume it's a simplified view or just listing permission codes.
    // But to be functional, let's use the PermissionConfig component here too, wrapped.
    {
      component: 'Textarea',
      fieldName: 'description',
      label: $t('menu.button.description'),
    },
  ],
  showDefaultActions: false,
});

const isEdit = ref(false);
const editingIndex = ref(-1);
// We need a separate state for button permissions because VbenForm might not handle the complex object array easily without a custom component.
const currentButtonPermissions = ref<any[]>([]);

const [ButtonModal, modalApi] = useVbenModal({
  title: $t('menu.button.add'),
  onConfirm: async () => {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues();
    const btn: SystemMenuApi.ButtonInfo = {
      ...values,
      permissions: currentButtonPermissions.value,
    } as SystemMenuApi.ButtonInfo;

    if (isEdit.value && editingIndex.value > -1) {
      dataSource.value[editingIndex.value] = btn;
    } else {
      dataSource.value.push(btn);
    }
    emitValue();
    modalApi.close();
  },
  class: 'w-2/3',
});

function handleAdd() {
  isEdit.value = false;
  editingIndex.value = -1;
  currentButtonPermissions.value = [];
  modalApi.setState({ title: $t('menu.button.add') });
  formApi.resetForm();
  modalApi.open();
}

function handleEdit(
  record: Record<string, any> | SystemMenuApi.ButtonInfo,
  index: number,
) {
  isEdit.value = true;
  editingIndex.value = index;
  currentButtonPermissions.value = record.permissions || [];
  modalApi.setState({ title: $t('menu.button.edit') });
  formApi.setValues(record);
  modalApi.open();
}

function handleDelete(index: number) {
  dataSource.value.splice(index, 1);
  emitValue();
}

const columns: ColumnType<SystemMenuApi.ButtonInfo>[] = [
  {
    title: $t('menu.button.code'),
    dataIndex: 'id',
    width: 150,
  },
  {
    title: $t('menu.button.name'),
    dataIndex: 'name',
    width: 150,
  },
  {
    title: $t('menu.button.description'),
    dataIndex: 'description',
  },
  {
    title: $t('common.action.label'),
    key: 'action',
    width: 120,
    fixed: 'right',
  },
];
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="mb-2">
      <Button type="primary" size="small" @click="handleAdd">
        <template #icon>+</template> {{ $t('menu.button.add') }}
      </Button>
    </div>
    <div class="flex-1 overflow-auto">
      <Table
        :columns="columns"
        :data-source="dataSource"
        row-key="id"
        :pagination="false"
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'action'">
            <Button type="link" size="small" @click="handleEdit(record, index)">
              {{ $t('common.action.edit') }}
            </Button>
            <Popconfirm
              :title="$t('common.confirmDelete')"
              @confirm="handleDelete(index)"
            >
              <Button type="link" size="small" danger>
                {{ $t('common.action.delete') }}
              </Button>
            </Popconfirm>
          </template>
        </template>
      </Table>
    </div>

    <ButtonModal>
      <div class="flex max-h-[50vh] flex-col gap-4 overflow-y-auto">
        <ButtonForm />

        <div class="rounded border p-2">
          <div class="mb-2 text-sm font-bold">
            {{ $t('menu.button.associatedPermissions') }}
          </div>
          <!-- Reusing the PermissionConfig component for the button's permissions -->
          <div>
            <PermissionConfig v-model:value="currentButtonPermissions" />
          </div>
        </div>
      </div>
    </ButtonModal>
  </div>
</template>
