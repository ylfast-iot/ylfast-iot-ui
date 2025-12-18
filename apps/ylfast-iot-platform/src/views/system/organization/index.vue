<script setup lang="ts">
import type { UserDetail } from '#/adapter/hsweb/user';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button,
  message,
  Modal,
  Popconfirm,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { unbindUsersFromOrg } from '#/api/system/organization';
import { queryUsers } from '#/api/system/user';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import BindUserModal from './components/BindUserModal.vue';
import OrganizationTree from './components/OrganizationTree.vue';
import { columns, searchFormSchemas } from './data';

const UnbindIcon = createIconifyIcon('lucide:unlink');

const currentOrgId = ref<null | string>(null);

// Bind User Modal
const bindUserModalRef = ref();

function handleBindUser() {
  if (!currentOrgId.value) {
    message.warning($t('organization.pleaseSelectNode'));
    return;
  }
  bindUserModalRef.value?.open(currentOrgId.value);
}

const gridQuery = async (_params: any, ...args: any[]) => {
  // If no org selected, return empty or handle accordingly.
  if (!currentOrgId.value) {
    return { items: [], total: 0 };
  }

  const queryParams = args[0] || {};
  const { page } = _params;

  const terms = queryParams.terms || [];

  // Core Requirement: id$in-org-user$org IN [currentOrgId]
  const orgTerm = {
    terms: [
      {
        terms: [
          {
            column: 'id$in-org-user$org',
            value: [currentOrgId.value],
          },
        ],
      },
    ],
  };

  // Combine with search terms
  const finalTerms = [orgTerm, ...terms];

  const { data, total } = await queryUsers({
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    terms: finalTerms,
  });

  return {
    items: data,
    total,
  };
};

const [TableCard, gridApi] = useYlVxeTableCard<UserDetail>({
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
    checkboxConfig: {
      reserve: true,
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
  tableTitle: $t('organization.userList'),
  ylDcFromOptions: {
    formSchemas: searchFormSchemas,
  },
});

function handleOrgSelect(orgId: null | string) {
  currentOrgId.value = orgId;
  gridApi.reload();
}

async function handleUnbind(row: UserDetail) {
  if (!currentOrgId.value) return;
  try {
    await unbindUsersFromOrg(currentOrgId.value, [row.id]);
    message.success($t('common.success'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleBatchUnbind() {
  if (!currentOrgId.value) {
    message.warning($t('organization.pleaseSelectNode'));
    return;
  }
  const selectedRecords = gridApi.grid.getCheckboxRecords();
  if (selectedRecords.length === 0) {
    message.warning($t('common.pleaseSelect')); // common.pleaseSelect likely exists or defaults
    return;
  }

  Modal.confirm({
    title: $t('organization.confirmUnbind'),
    content: $t('organization.confirmUnbindMsg'),
    onOk: async () => {
      try {
        const userIds = selectedRecords.map((r) => r.id);
        await unbindUsersFromOrg(currentOrgId.value!, userIds);
        message.success($t('common.success'));
        gridApi.reload();
        gridApi.grid.clearCheckboxRow();
      } catch (error) {
        console.error(error);
      }
    },
  });
}

// Modal import helper from AntD was missing in script setup, using Vben helper if available or AntD directly
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full w-full">
      <OrganizationTree @select="handleOrgSelect" />

      <div class="flex-1 overflow-hidden pl-2">
        <TableCard>
          <template #toolbar-tools>
            <Button type="primary" @click="handleBindUser">
              {{ $t('organization.batchBind') }}
            </Button>
            <Button danger class="ml-2" @click="handleBatchUnbind">
              {{ $t('organization.batchUnbind') }}
            </Button>
          </template>

          <template #state="{ row }">
            <Tag :color="row.status === 1 ? 'success' : 'error'">
              {{
                row.status === 1 ? $t('common.enable') : $t('common.disable')
              }}
            </Tag>
          </template>

          <template #action="{ row }">
            <Popconfirm
              :title="$t('organization.confirmUnbind')"
              @confirm="handleUnbind(row)"
            >
              <Tooltip :title="$t('organization.unbind')">
                <Button type="link" size="small" class="text-primary">
                  <template #icon>
                    <UnbindIcon />
                  </template>
                </Button>
              </Tooltip>
            </Popconfirm>
          </template>
        </TableCard>
      </div>
    </div>

    <BindUserModal ref="bindUserModalRef" @success="gridApi.reload()" />
  </Page>
</template>
