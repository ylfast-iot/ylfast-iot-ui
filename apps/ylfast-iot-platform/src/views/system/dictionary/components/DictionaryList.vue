<script setup lang="ts">
import type { Key } from 'ant-design-vue/es/table/interface';

import type { SystemDictionaryApi } from '#/api/system/dictionary';

import { onMounted, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button,
  Card,
  InputSearch,
  message,
  Popconfirm,
  Switch,
  Tooltip,
  Tree,
} from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  deleteDictionary,
  queryDictionaryList,
  saveDictionary,
} from '#/api/system/dictionary';

import { dictionaryModalSchemas } from '../data';

const emit = defineEmits(['select']);

// Icons
const PlusIcon = createIconifyIcon('lucide:plus');
const EditIcon = createIconifyIcon('lucide:edit');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const ImportIcon = createIconifyIcon('lucide:upload');
const DownloadIcon = createIconifyIcon('lucide:download');

// State
const treeData = ref<SystemDictionaryApi.Dictionary[]>([]);
const rawData = ref<SystemDictionaryApi.Dictionary[]>([]);
const searchValue = ref('');
const selectedKeys = ref<Key[]>([]);
const formType = ref<'add' | 'edit'>('add');

// Form
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: dictionaryModalSchemas,
  showDefaultActions: false,
});

// Modal
const [DictModal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      const { valid } = await formApi.validate();
      if (!valid) return;
      const values = await formApi.getValues();
      modalApi.setState({ confirmLoading: true });

      await saveDictionary(values as SystemDictionaryApi.Dictionary);
      message.success(
        formType.value === 'add'
          ? $t('common.createSuccess')
          : $t('common.updateSuccess'),
      );
      modalApi.close();
      fetchList();
    } catch (error) {
      console.error(error);
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
});

// Search
watch(searchValue, (value) => {
  if (!value) {
    treeData.value = rawData.value;
    return;
  }
  treeData.value = rawData.value.filter(
    (item) =>
      item.name.toLowerCase().includes(value.toLowerCase()) ||
      item.id.toLowerCase().includes(value.toLowerCase()),
  );
});

function handleImport() {
  message.info($t('common.comingSoon'));
}

function handleDownload() {
  message.info($t('common.comingSoon'));
}

async function fetchList() {
  try {
    const data = await queryDictionaryList({
      paging: false,
      sorts: [{ name: 'createTime', order: 'desc' }],
    });
    rawData.value = data;
    treeData.value = data;

    const firstItem = data[0];
    // Select first if none selected
    if (selectedKeys.value.length === 0 && firstItem) {
      handleSelect([firstItem.id], {
        selected: true,
        node: { key: firstItem.id },
      });
    } else if (selectedKeys.value.length > 0) {
      // Re-validate selection
      const exists = data.find(
        (d: SystemDictionaryApi.Dictionary) => d.id === selectedKeys.value[0],
      );
      if (!exists && firstItem) {
        handleSelect([firstItem.id], {
          selected: true,
          node: { key: firstItem.id },
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
}

function handleSelect(keys: Key[], info: any) {
  if (!info.selected && keys.length === 0) {
    // Prevent deselect
    if (info.node?.key) {
      selectedKeys.value = [info.node.key];
    }
    return;
  }
  selectedKeys.value = keys;
  // Pass the full object to parent
  const key = keys[0];
  if (key === undefined) {
    emit('select', null);
  } else {
    const selectedItem = rawData.value.find((item) => item.id === key);
    emit('select', selectedItem || null);
  }
}

function handleAdd() {
  formType.value = 'add';
  modalApi.setState({ title: $t('common.action.add') });
  formApi.resetForm();
  // ID is editable in Add
  formApi.updateSchema([
    {
      fieldName: 'id',
      componentProps: { disabled: false },
    },
  ]);
  modalApi.open();
}

function handleEdit(item: SystemDictionaryApi.Dictionary) {
  formType.value = 'edit';
  modalApi.setState({ title: $t('common.action.edit') });
  formApi.resetForm();
  formApi.setValues(item);
  // ID usually cannot be changed in Edit
  formApi.updateSchema([
    {
      fieldName: 'id',
      componentProps: { disabled: true },
    },
  ]);
  modalApi.open();
}

async function handleStatusChange(
  item: SystemDictionaryApi.Dictionary,
  checked: boolean | number | string,
) {
  // checked is coming from Switch (1 or 0)
  const newStatus = checked as number;
  // Optimistic update or wait? Tree data updates automatically via v-model if referenced,
  // but we should save first.
  // Actually v-model on tree node might update local state directly.
  // Let's ensure consistency.
  try {
    await saveDictionary({ ...item, status: newStatus });
    message.success($t('common.updateSuccess'));
    // Update local data to reflect change if not using v-model directly or to ensure sync
    const target = rawData.value.find((d) => d.id === item.id);
    if (target) {
      target.status = newStatus;
    }
  } catch (error) {
    console.error(error);
    // Revert on failure
    const target = rawData.value.find((d) => d.id === item.id);
    if (target) {
      target.status = newStatus === 1 ? 0 : 1;
    }
  }
}

async function handleDelete(item: SystemDictionaryApi.Dictionary) {
  try {
    await deleteDictionary(item.id);
    message.success($t('common.deleteSuccess'));

    // Clear conditions and selection to force reload of first item
    selectedKeys.value = [];
    searchValue.value = '';

    fetchList();
  } catch (error) {
    console.error(error);
  }
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <div class="h-full w-1/6 min-w-[250px] pr-2">
    <Card
      class="flex h-full flex-col"
      :body-style="{ padding: '10px', flex: 1, overflow: 'auto' }"
    >
      <template #title>
        <div class="flex items-center justify-between">
          <span>{{ $t('dictionary.title') }}</span>
          <div class="flex gap-1">
            <Button
              type="primary"
              size="small"
              class="flex items-center justify-center"
              @click="handleImport"
            >
              <template #icon>
                <ImportIcon />
              </template>
            </Button>
            <Button
              type="primary"
              size="small"
              class="flex items-center justify-center"
              @click="handleDownload"
            >
              <template #icon>
                <DownloadIcon />
              </template>
            </Button>
            <Button
              type="primary"
              size="small"
              class="flex items-center justify-center"
              @click="handleAdd"
            >
              <template #icon>
                <PlusIcon />
              </template>
            </Button>
          </div>
        </div>
      </template>

      <div class="mb-2">
        <InputSearch
          v-model:value="searchValue"
          :placeholder="$t('common.action.search')"
          allow-clear
          size="small"
        />
      </div>

      <Tree
        v-if="treeData.length > 0"
        v-model:selected-keys="selectedKeys"
        :tree-data="treeData as any"
        :field-names="{ title: 'name', key: 'id' }"
        block-node
        :show-icon="false"
        :show-line="false"
        :multiple="false"
        @select="handleSelect"
      >
        <template #switcherIcon>
          <span class="hidden"></span>
        </template>
        <template #title="{ dataRef }">
          <div class="group flex h-9 w-full items-center justify-between">
            <div class="flex flex-1 items-center overflow-hidden">
              <span class="truncate pr-2" :title="dataRef.name">{{
                dataRef.name
              }}</span>
            </div>

            <!-- Actions -->

            <Tooltip
              v-if="dataRef.classified === 'system'"
              :title="$t('dictionary.systemBuiltInNoModify')"
            >
              <div class="flex items-center gap-2 pr-1" @click.stop>
                <Switch
                  size="small"
                  v-model:checked="dataRef.status"
                  :checked-value="1"
                  :un-checked-value="0"
                  disabled
                />

                <Button
                  type="link"
                  size="small"
                  class="flex items-center justify-center !p-0"
                  disabled
                >
                  <template #icon><EditIcon class="size-4" /></template>
                </Button>

                <Button
                  type="link"
                  danger
                  size="small"
                  class="flex items-center justify-center !p-0"
                  disabled
                >
                  <template #icon><TrashIcon class="size-4" /></template>
                </Button>
              </div>
            </Tooltip>

            <div v-else class="flex items-center gap-2 pr-1" @click.stop>
              <Switch
                size="small"
                v-model:checked="dataRef.status"
                :checked-value="1"
                :un-checked-value="0"
                @change="
                  (val: boolean | string | number) =>
                    handleStatusChange(dataRef, val)
                "
              />

              <Button
                type="link"
                size="small"
                class="flex items-center justify-center !p-0"
                @click="handleEdit(dataRef)"
              >
                <template #icon><EditIcon class="size-4" /></template>
              </Button>

              <Popconfirm
                :title="$t('common.confirmDelete')"
                @confirm="handleDelete(dataRef)"
              >
                <Button
                  type="link"
                  danger
                  size="small"
                  class="flex items-center justify-center !p-0"
                >
                  <template #icon><TrashIcon class="size-4" /></template>
                </Button>
              </Popconfirm>
            </div>
          </div>
        </template>
      </Tree>
      <div v-else class="mt-4 text-center text-gray-500">
        {{ $t('common.noData') }}
      </div>
    </Card>

    <DictModal>
      <div class="p-4">
        <Form />
      </div>
    </DictModal>
  </div>
</template>

<style scoped>
:deep(.ant-tree-switcher) {
  display: none;
}
:deep(.ant-tree-node-content-wrapper) {
  padding-left: 15px !important;
}
</style>
