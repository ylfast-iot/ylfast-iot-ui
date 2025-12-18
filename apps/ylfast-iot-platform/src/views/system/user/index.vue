<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { SystemUserApi } from '#/api/system/user';

import { ref } from 'vue';

import { Page, useVbenForm, useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { cloneDeep } from '@vben/utils';

import { Button, message, Popconfirm, Tag } from 'ant-design-vue';

import {
  createUser,
  deleteUser,
  getUserById,
  queryUsers,
  resetPassword,
  saveUser,
  updateUser,
} from '#/api/system/user';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import {
  columns,
  modalFormSchemas,
  resetPasswordSchemas,
  searchFormSchemas,
} from './data';

const EditIcon = createIconifyIcon('lucide:edit-3');
const KeyIcon = createIconifyIcon('lucide:key-round');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const BanIcon = createIconifyIcon('lucide:ban');
const CheckIcon = createIconifyIcon('lucide:check-circle');
const PlusIcon = createIconifyIcon('lucide:plus');

const formType = ref<'add' | 'edit'>('add');
const currentId = ref<string>('');
const currentResetUserId = ref<string>('');

// --- Main Form & Modal ---
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: modalFormSchemas,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[800px]',
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

      // Additional validation logic that might not be covered by schema
      if (
        formType.value === 'add' &&
        values.password !== values.confirmPassword
      ) {
        message.error($t('user.validate.passwordMismatch'));
        return;
      }

      modalApi.setState({ confirmLoading: true });

      // Construct SaveUserRequest
      const { orgIdList, roleIdList, ...userData } = values;

      const requestData: SystemUserApi.SaveUserRequest = {
        orgIdList: orgIdList || [],
        roleIdList: roleIdList || [],
        user: {
          ...userData,
          status: Number(userData.status),
        } as any,
      };

      if (formType.value === 'add') {
        await createUser(requestData);
        message.success($t('common.createSuccess'));
      } else {
        await updateUser(currentId.value, requestData);
        message.success($t('common.updateSuccess'));
      }
      modalApi.close();
      gridApi.reload();
    } catch (error: any) {
      console.error(error);
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  title: $t('user.group.basic'),
});

// --- Reset Password Modal ---
const [ResetPwdForm, resetPwdFormApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: resetPasswordSchemas,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const [ResetPwdModal, resetPwdModalApi] = useVbenModal({
  class: 'w-[600px]',
  footer: true,
  onCancel() {
    resetPwdModalApi.close();
  },
  onConfirm: async () => {
    try {
      const { valid } = await resetPwdFormApi.validate();
      if (!valid) {
        return;
      }
      const { confirmPassword, password } = await resetPwdFormApi.getValues();

      if (password !== confirmPassword) {
        message.error($t('user.validate.passwordMismatch'));
        return;
      }

      resetPwdModalApi.setState({ confirmLoading: true });

      // Reset Password
      await resetPassword(currentResetUserId.value, password);

      message.success(
        `${$t('user.action.resetPassword')} ${$t('common.success')}`,
      );
      resetPwdModalApi.close();
    } catch (error) {
      console.error(error);
    } finally {
      resetPwdModalApi.setState({ confirmLoading: false });
    }
  },
  title: $t('user.action.resetPassword'),
});

// --- Grid & Actions ---

const gridQuery = async (params: any, ...args: any[]) => {
  const { page } = params;
  const formValues = args[0] || {};
  const { terms } = formValues;

  const queryParams = {
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    terms,
    sorts: [
      {
        name: 'createTime',
        order: 'desc',
      },
      {
        name: 'username',
        order: 'asc',
        value: 'admin',
      },
    ],
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
  tableTitle: $t('user.group.account'),

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

function handleAdd() {
  formType.value = 'add';
  currentId.value = '';
  formApi.resetForm();
  formApi.setValues({
    id: undefined,
    username: undefined,
    roleIdList: [],
    orgIdList: [],
  });
  modalApi.open();
}

async function handleEdit(row: Recordable<any>) {
  formType.value = 'edit';
  currentId.value = row.id;
  formApi.resetForm();
  modalApi.setState({ loading: true });
  modalApi.open();

  try {
    const userDetail = await getUserById(row.id);
    const formData = cloneDeep(userDetail) as any;

    // Map roles/orgs objects to IDs if necessary
    if (userDetail.roleList) {
      formData.roleIdList = (userDetail as any).roleList.map((r: any) => r.id);
    }
    if (userDetail.orgList) {
      formData.orgIdList = (userDetail as any).orgList.map((o: any) => o.id);
    }
    formApi.setValues(formData, false);
  } catch (error) {
    console.error(error);
    message.error('获取用户详情失败');
    modalApi.close();
  } finally {
    modalApi.setState({ loading: false });
  }
}

async function handleDisable(row: Recordable<any>) {
  try {
    // Status 0: Disable
    await saveUser({ id: row.id, status: 0 } as any);
    message.success($t('common.disable') + $t('common.success'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleEnable(row: Recordable<any>) {
  try {
    // Status 1: Enable
    await saveUser({ id: row.id, status: 1 } as any);
    message.success($t('common.enable') + $t('common.success'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleDelete(row: Recordable<any>) {
  try {
    await deleteUser(row.id);
    message.success($t('common.deleteSuccess'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

function handleOpenResetPwd(row: Recordable<any>) {
  currentResetUserId.value = row.id;
  resetPwdFormApi.resetForm();
  resetPwdModalApi.open();
}
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <template #toolbar-tools>
        <Button type="primary" @click="handleAdd">
          <template #icon>
            <PlusIcon class="mr-1 size-4" />
          </template>
          {{ $t('user.action.addUser') }}
        </Button>
      </template>

      <!-- Grid Actions -->
      <template #action="{ row }">
        <div class="flex justify-center gap-2">
          <Button
            size="small"
            type="link"
            @click="handleEdit(row)"
            :title="$t('common.action.edit')"
          >
            <template #icon><EditIcon class="size-4" /></template>
          </Button>

          <Button
            size="small"
            type="link"
            @click="handleOpenResetPwd(row)"
            :title="$t('user.action.resetPassword')"
          >
            <template #icon><KeyIcon class="size-4" /></template>
          </Button>

          <!-- Disable/Enable Toggle -->
          <Popconfirm
            v-if="row.status === 1"
            :title="$t('user.action.confirmDisable')"
            @confirm="handleDisable(row)"
          >
            <Button
              danger
              size="small"
              type="link"
              :title="$t('common.disable')"
            >
              <template #icon><BanIcon class="size-4" /></template>
            </Button>
          </Popconfirm>
          <Popconfirm
            v-else
            :title="$t('user.action.confirmEnable')"
            @confirm="handleEnable(row)"
          >
            <Button size="small" type="link" :title="$t('common.enable')">
              <template #icon><CheckIcon class="size-4" /></template>
            </Button>
          </Popconfirm>

          <!-- Delete: Only allowed if disabled (status === 0) -->
          <Popconfirm
            :disabled="row.status === 1"
            :title="$t('user.action.confirmDelete')"
            @confirm="handleDelete(row)"
          >
            <Button
              :disabled="row.status === 1"
              danger
              size="small"
              type="link"
              :title="$t('common.action.delete')"
            >
              <template #icon><TrashIcon class="size-4" /></template>
            </Button>
          </Popconfirm>
        </div>
      </template>

      <!-- Status Column -->
      <template #status="{ row }">
        <Tag :color="row.status === 1 ? 'success' : 'error'">
          {{ row.status === 1 ? $t('common.enable') : $t('common.disable') }}
        </Tag>
      </template>

      <!-- Role List Column (Custom Render for List) -->
      <template #roleList="{ row }">
        <div v-if="row.roleList && row.roleList.length > 0">
          <Tag v-for="role in row.roleList" :key="role.id || role">
            {{ role.name || role }}
          </Tag>
        </div>
        <span v-else>--</span>
      </template>
    </TableCard>

    <Modal>
      <Form />
    </Modal>

    <ResetPwdModal>
      <ResetPwdForm />
    </ResetPwdModal>
  </Page>
</template>
