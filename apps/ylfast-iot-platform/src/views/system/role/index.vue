<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { Term } from '#/adapter';
import type { SystemRoleApi } from '#/api/system/role';

import { ref } from 'vue';

import {
  Page,
  useVbenDrawer,
  useVbenForm,
  useVbenModal,
} from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Button, message, Popconfirm, Tag } from 'ant-design-vue';

import { deleteRole, queryRolePost, saveRole } from '#/api/system/role';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import PermissionGrantDrawer from './components/PermissionGrantDrawer.vue';
import RoleGroup from './components/RoleGroup.vue';
import { columns, modalFormSchemas, searchFormSchemas } from './data';

const currentGroupId = ref<null | string>(null);
const formType = ref<'add' | 'edit'>('add');

// Form
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: modalFormSchemas,
  showDefaultActions: false,
});

// Modal (Role Form)
const [RoleModal, roleModalApi] = useVbenModal({
  onCancel() {
    roleModalApi.close();
  },
  onConfirm: async () => {
    try {
      const { valid } = await formApi.validate();
      if (!valid) return;
      const values = await formApi.getValues();
      roleModalApi.setState({ confirmLoading: true });

      // If adding, ensure groupId is set if selected
      if (formType.value === 'add' && currentGroupId.value && !values.groupId) {
        values.groupId = currentGroupId.value;
      }

      await saveRole(values as SystemRoleApi.RoleEntity);
      message.success(
        formType.value === 'add'
          ? $t('common.createSuccess')
          : $t('common.updateSuccess'),
      );
      roleModalApi.close();
      gridApi.reload();
    } catch (error) {
      console.error(error);
    } finally {
      roleModalApi.setState({ confirmLoading: false });
    }
  },
});

// Permission Grant Drawer
const [GrantDrawer, grantDrawerApi] = useVbenDrawer({
  connectedComponent: PermissionGrantDrawer,
});

const gridQuery = async (_params: any, ...args: any[]) => {
  const queryParams = args[0] || {};
  const { page } = _params;

  const termsToCombine: Term[] = [];

  // 合并来自搜索表单的条件
  if (queryParams.terms && queryParams.terms.length > 0) {
    termsToCombine.push(...queryParams.terms);
  }

  // 仅在 currentGroupId 存在时才添加分组过滤条件
  if (currentGroupId.value) {
    termsToCombine.push({
      column: 'groupId',
      termType: 'eq',
      value: currentGroupId.value,
    });
  }

  const { data, total } = await queryRolePost({
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    sorts: [
      {
        name: 'createTime',
        order: 'desc',
      },
      {
        name: 'id',
        order: 'desc',
      },
    ],
    terms: termsToCombine,
  });

  return {
    items: data,
    total,
  };
};

const [TableCard, gridApi] = useYlVxeTableCard<SystemRoleApi.RoleEntity>({
  cardOptions: {
    minWidth: 300,
  },
  mode: 'table',
  gridOptions: {
    columns: columns!,
    height: 'auto',
    pagerConfig: {
      enabled: true,
    },
    rowConfig: {
      keyField: 'id',
    },
    proxyConfig: {
      response: {},
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
  tableTitle: $t('role.list', 'Role List'),
  ylDcFromOptions: {
    formSchemas: searchFormSchemas,
  },
});

function handleGroupSelect(groupId: null | string) {
  currentGroupId.value = groupId;
  gridApi.reload();
}

function handleAdd() {
  formType.value = 'add';
  roleModalApi.setState({ title: $t('role.add', 'Add Role') });
  formApi.resetForm();
  if (currentGroupId.value) {
    formApi.setValues({ groupId: currentGroupId.value });
  }
  roleModalApi.open();
}

function handleEdit(row: Recordable<any>) {
  formType.value = 'edit';
  roleModalApi.setState({ title: $t('role.edit', 'Edit Role') });
  formApi.resetForm();
  formApi.setValues(row);
  roleModalApi.open();
}

function handlePermissionConfig(row: Recordable<any>) {
  grantDrawerApi.setData({ roleId: row.id });
  grantDrawerApi.open();
}

async function handleDelete(row: Recordable<any>) {
  try {
    await deleteRole(row.id);
    message.success($t('common.deleteSuccess'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full w-full">
      <RoleGroup @select="handleGroupSelect" />

      <div class="flex-1 overflow-hidden">
        <TableCard>
          <template #toolbar-tools>
            <Button type="primary" @click="handleAdd">
              {{ $t('role.add', 'Add Role') }}
            </Button>
          </template>

          <template #state="{ row }">
            <Tag :color="row.state.value === 'enabled' ? 'success' : 'error'">
              {{
                row.state.value === 'enabled'
                  ? $t('common.enable')
                  : $t('common.disable')
              }}
            </Tag>
          </template>

          <template #action="{ row }">
            <Button size="small" type="link" @click="handleEdit(row)">
              {{ $t('common.action.edit') }}
            </Button>
            <Button
              size="small"
              type="link"
              @click="handlePermissionConfig(row)"
            >
              {{ $t('role.configPermission', 'Permission Config') }}
            </Button>
            <Popconfirm
              :title="$t('common.confirmDelete')"
              @confirm="handleDelete(row)"
            >
              <Button danger size="small" type="link">
                {{ $t('common.action.delete') }}
              </Button>
            </Popconfirm>
          </template>
        </TableCard>
      </div>
    </div>

    <RoleModal>
      <div class="p-4">
        <Form />
      </div>
    </RoleModal>

    <GrantDrawer />
  </Page>
</template>
