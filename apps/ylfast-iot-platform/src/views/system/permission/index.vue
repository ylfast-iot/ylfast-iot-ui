<script setup lang="ts">
import type { Recordable } from '@vben/types'; // Corrected import path

import { ref } from 'vue'; // Added missing import

import { Page, useVbenForm, useVbenModal } from '@vben/common-ui'; // Added Page
import { $t } from '@vben/locales';

import { Button, message, Popconfirm, Tag, Upload } from 'ant-design-vue'; // Added missing imports

import {
  batchCreatePermission,
  changePermissionState,
  createPermission,
  deletePermission,
  getPermissionList,
  SystemPermissionApi,
  updatePermission,
} from '#/api/system/permission';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import { columns, modalFormSchemas, searchFormSchemas } from './data';

const formType = ref<'add' | 'edit'>('add');
const currentId = ref<string>('');

// Modal & Form
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: modalFormSchemas,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      const { valid } = await formApi.validate();
      if (!valid) {
        return;
      }
      const values = await formApi.getValues();
      modalApi.setState({ confirmLoading: true });
      if (formType.value === 'add') {
        await createPermission(values as any);
        message.success($t('permission.msg.success.create'));
      } else {
        await updatePermission(currentId.value, values as any);
        message.success($t('permission.msg.success.update'));
      }
      modalApi.close();
      gridApi.reload();
    } catch (error) {
      console.error(error);
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  class: 'w-2/5',
});

// Grid Query Adapter
const gridQuery = async (params: any, ...args: any[]) => {
  const { page } = params;
  const formValues = args[0] || {};
  const { terms } = formValues;

  const queryParams = {
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    terms,
    sorts: [{ name: 'id', order: 'desc' }],
  };

  const { data, total } = await getPermissionList(queryParams as any);
  return {
    items: data,
    total,
  };
};

const [TableCard, gridApi] = useYlVxeTableCard<SystemPermissionApi.Permission>({
  cardOptions: {
    minWidth: 300,
  },
  mode: 'table',
  gridOptions: {
    columns: [{ type: 'checkbox', width: 50 }, ...columns!],
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: true,
      pageSize: 20,
      pageSizes: [10, 20, 50, 100],
    },
    rowConfig: {
      keyField: 'id',
    },
    proxyConfig: {
      ajax: {
        query: gridQuery,
      },
      enabled: true,
    },
    toolbarConfig: {
      custom: true,
      export: true,
      refresh: true,
      search: true,
      zoom: true,
    },
  },
  searchFormMode: 'yl-dc-form',
  showSearchForm: true,
  tableTitle: $t('permission.text.list'),

  ylDcFromOptions: {
    formSchemas: searchFormSchemas,
    storeOption: {
      mode: 'localstorage',
      conf: {
        storageKey: 'permission-dc-storage',
      },
    },
  },
});

// Actions
function handleAdd() {
  formType.value = 'add';
  currentId.value = '';
  modalApi.setState({ title: $t('permission.action.add') }); // Dynamic title
  formApi.resetForm();
  formApi.updateSchema([
    {
      fieldName: 'id',
      componentProps: {
        disabled: false,
      },
    },
  ]);
  modalApi.open();
}

function handleEdit(row: Recordable<any>) {
  formType.value = 'edit';
  currentId.value = row.id;
  modalApi.setState({ title: $t('permission.action.edit') }); // Dynamic title
  formApi.resetForm();
  formApi.setValues(row);
  formApi.updateSchema([
    {
      fieldName: 'id',
      componentProps: {
        disabled: true,
      },
    },
  ]);
  modalApi.open();
}

async function handleDelete(row: Recordable<any>) {
  try {
    await deletePermission(row.id);
    message.success($t('permission.msg.success.delete'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleStatusChange(row: any) {
  try {
    const newStatus = row.status === 1 ? 0 : 1;
    await changePermissionState([row.id], newStatus);
    message.success($t('permission.msg.success.statusUpdate'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleImport(file: File) {
  try {
    const result = await file.text();
    const data = JSON.parse(result);
    if (!Array.isArray(data)) {
      message.error($t('permission.msg.error.importFormat'));
      return false;
    }
    await batchCreatePermission(data);
    message.success($t('permission.msg.success.import'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
    message.error($t('permission.msg.error.import'));
  }
  return false;
}
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <template #toolbar-tools>
        <Upload
          :before-upload="handleImport"
          :show-upload-list="false"
          accept=".json"
        >
          <Button type="primary" ghost class="mr-2">
            {{ $t('permission.action.import') }}
          </Button>
        </Upload>
        <Button type="primary" @click="handleAdd">
          {{ $t('permission.action.add') }}
        </Button>
      </template>

      <!-- Grid Actions -->
      <template #action="{ row }">
        <Button size="small" type="link" @click="handleEdit(row)">
          {{ $t('permission.action.edit') }}
        </Button>
        <Popconfirm
          :title="
            row.status === 1
              ? $t('permission.action.confirmDisable')
              : $t('permission.action.confirmEnable')
          "
          @confirm="handleStatusChange(row)"
        >
          <Button size="small" type="link">
            {{
              row.status === 1
                ? $t('permission.action.disable')
                : $t('permission.action.enable')
            }}
          </Button>
        </Popconfirm>
        <Popconfirm
          :disabled="row.status === 1"
          :title="$t('permission.action.confirmDelete')"
          @confirm="handleDelete(row)"
        >
          <Button danger :disabled="row.status === 1" size="small" type="link">
            {{ $t('permission.action.delete') }}
          </Button>
        </Popconfirm>
      </template>

      <!-- Status Column -->
      <template #status="{ row }">
        <Popconfirm
          :title="
            row.status === 1
              ? $t('permission.action.confirmDisable')
              : $t('permission.action.confirmEnable')
          "
          @confirm="handleStatusChange(row)"
        >
          <Tag
            :color="row.status === 1 ? 'success' : 'error'"
            class="cursor-pointer"
          >
            {{
              row.status === 1
                ? $t('permission.action.enable')
                : $t('permission.action.disable')
            }}
          </Tag>
        </Popconfirm>
      </template>
    </TableCard>

    <Modal>
      <Form />
    </Modal>
  </Page>
</template>
