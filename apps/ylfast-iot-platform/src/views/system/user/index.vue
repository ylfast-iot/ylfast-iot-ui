<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { SystemUserApi } from '#/api/system/user';

import { ref } from 'vue';

import { Page, useVbenForm, useVbenModal, z } from '@vben/common-ui';

import { Button, message, Popconfirm, Tag } from 'ant-design-vue';

import {
  createUser,
  deleteUser,
  queryUsers,
  updateUser,
} from '#/api/system/user';
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
  layout: 'horizontal',
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
      await formApi.validate();
      const values = await formApi.getValues();
      modalApi.setState({ confirmLoading: true });
      if (formType.value === 'add') {
        await createUser(values as any);
        message.success('创建成功');
      } else {
        await updateUser(currentId.value, values as any);
        message.success('更新成功');
      }
      modalApi.close();
      gridApi.reload();
    } catch (error) {
      console.error(error);
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  title: '用户',
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
  };

  const { data, total } = await queryUsers(queryParams as any);
  return {
    items: data,
    total,
  };
};

const [TableCard, gridApi] = useYlVxeTableCard<SystemUserApi.User>({
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
  tableTitle: '用户列表',

  ylDcFromOptions: {
    formSchemas: searchFormSchemas,
    storeOption: {
      mode: 'localstorage',
      conf: {
        storageKey: 'user-dc-storage',
      },
    },
  },
});

// Actions
function handleAdd() {
  formType.value = 'add';
  currentId.value = '';
  formApi.resetForm();
  // Password required for add
  formApi.updateSchema([
    {
      fieldName: 'password',
      rules: z.string().min(1, '请输入密码'),
    },
  ]);
  modalApi.open();
}

function handleEdit(row: Recordable<any>) {
  formType.value = 'edit';
  currentId.value = row.id;
  formApi.resetForm();
  formApi.setValues(row);
  // Password optional for edit
  formApi.updateSchema([
    {
      fieldName: 'password',
      rules: z.string().optional(),
    },
  ]);
  modalApi.open();
}

async function handleDelete(row: Recordable<any>) {
  try {
    await deleteUser(row.id);
    message.success('删除成功');
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <template #toolbar-tools>
        <Button type="primary" @click="handleAdd"> 新增用户 </Button>
      </template>

      <!-- Grid Actions -->
      <template #action="{ row }">
        <Button size="small" type="link" @click="handleEdit(row)">
          编辑
        </Button>
        <Popconfirm title="确认删除?" @confirm="handleDelete(row)">
          <Button danger size="small" type="link"> 删除 </Button>
        </Popconfirm>
      </template>

      <!-- Status Column -->
      <template #status="{ row }">
        <Tag :color="row.status === 1 ? 'success' : 'error'">
          {{ row.status === 1 ? '启用' : '禁用' }}
        </Tag>
      </template>
    </TableCard>

    <Modal>
      <Form />
    </Modal>
  </Page>
</template>
