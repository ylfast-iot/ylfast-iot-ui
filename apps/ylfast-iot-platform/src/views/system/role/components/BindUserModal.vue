<script setup lang="ts">
import type { Term } from '#/adapter';
import type { SystemUserApi } from '#/api/system/user';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message, Tag } from 'ant-design-vue';

import { bindUsersToRole } from '#/api/system/role';
import { _queryUsers } from '#/api/system/user';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import { userColumns, userSearchFormSchemas } from '../data';

const emit = defineEmits(['success']);

const currentRoleId = ref<string>('');

// Reusing columns/schemas from parent, but action column is not needed here
const bindUserColumns = userColumns?.filter((c) => c.field !== 'action');

const [TableCard, gridApi] = useYlVxeTableCard<SystemUserApi.UserEntity>({
  mode: 'table',
  gridOptions: {
    columns: bindUserColumns,
    height: 'auto',
    pagerConfig: {
      enabled: true,
    },
    rowConfig: {
      keyField: 'id',
    },
    checkboxConfig: {
      reserve: true,
    },
    proxyConfig: {
      response: {},
      ajax: {
        query: async (_params: any, ...args: any) => {
          if (!currentRoleId.value) {
            return { items: [], total: 0 };
          }

          const queryParams = args[0] || {};
          const { page } = _params;

          const terms = queryParams.terms || [];

          // Core requirement: Exclude users already in the role
          const notInRoleTerm = {
            column: 'id$in-dimension$role$not',
            value: currentRoleId.value,
            termType: 'eq',
          } as Term;

          const finalTerms = [
            {
              terms: [notInRoleTerm],
            },
            ...terms, // Add search form terms
          ];

          const { data, total } = await _queryUsers({
            pageIndex: page.currentPage - 1,
            pageSize: page.pageSize,
            terms: finalTerms,
          });
          return { items: data, total };
        },
      },
      enabled: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  },
  searchFormMode: 'yl-dc-form',
  showSearchForm: true,
  tableTitle: $t('role.tab.userManagement', 'User Management'),
  ylDcFromOptions: {
    formSchemas: userSearchFormSchemas,
    showMoreButton: false,
  },
});

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      const selectedRecords = gridApi.getGrid().getCheckboxRecords();
      if (selectedRecords.length === 0) {
        message.warning($t('common.pleaseSelect'));
        return;
      }

      modalApi.setState({ confirmLoading: true });
      const userIds = selectedRecords.map((item) => item.id);

      await bindUsersToRole(currentRoleId.value, userIds);

      message.success($t('common.success'));
      emit('success');
      modalApi.close();
      gridApi.getGrid().clearCheckboxRow();
    } catch (error) {
      console.error(error);
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
});

function open(roleId: string) {
  currentRoleId.value = roleId;
  modalApi.setState({ title: $t('role.bindUser', 'Bind User') });
  modalApi.open();
  // Reload to apply new roleId
  setTimeout(() => {
    gridApi.reload();
  }, 100);
}

defineExpose({ open });
</script>

<template>
  <Modal class="w-3/5">
    <div class="h-[500px]">
      <TableCard>
        <template #status="{ row }">
          <Tag :color="row.status === 1 ? 'success' : 'error'">
            {{ row.status === 1 ? $t('common.enable') : $t('common.disable') }}
          </Tag>
        </template>
      </TableCard>
    </div>
  </Modal>
</template>
