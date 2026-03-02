<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { Term } from '#/adapter';
import type { ApplicationApi } from '#/api/system/application';

import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Button, message, Popconfirm, Tag } from 'ant-design-vue';

import {
  applicationCrudApis,
  disableApplication,
  enableApplication,
} from '#/api/system/application';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import ApplicationCard from './components/ApplicationCard.vue';
import ProviderSelectModal from './components/ProviderSelectModal.vue';
import { columns, searchFormSchemas } from './data';

const router = useRouter();

const [SelectProviderModal, selectProviderModalApi] = useVbenModal({
  connectedComponent: ProviderSelectModal,
});

const gridQuery = async (_params: any, ...args: any[]) => {
  const queryParams = args[0] || {};
  const { page } = _params;

  const termsToCombine: Term[] = [];

  // 合并来自搜索表单的条件
  if (queryParams.terms && queryParams.terms.length > 0) {
    termsToCombine.push(...queryParams.terms);
  }

  const { data, total } = await applicationCrudApis.postQuery({
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

const [TableCard, gridApi] =
  useYlVxeTableCard<ApplicationApi.ApplicationEntity>({
    defaultMode: 'card',
    cardOptions: {
      minWidth: 300,
    },
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
    tableTitle: $t('application.list', '应用列表'),
    ylDcFromOptions: {
      formSchemas: searchFormSchemas,
    },
  });

function handleAdd() {
  selectProviderModalApi.open();
}

/**
 * Handle provider selection from the modal
 */
function handleProviderSelected(
  providerInfo: ApplicationApi.ApplicationProviderInfo,
) {
  selectProviderModalApi.close();
  router.push({
    path: '/system/application/detail',
    query: {
      type: 'add',
      provider: providerInfo.provider,
    },
  });
}

function handleEdit(row: Recordable<any>) {
  router.push({
    path: '/system/application/detail',
    query: {
      type: 'edit',
      id: row.id,
    },
  });
}

async function handleEnable(row: ApplicationApi.ApplicationEntity) {
  try {
    await enableApplication(row.id);
    message.success($t('common.action.enableSuccess', '已启用'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleDisable(row: ApplicationApi.ApplicationEntity) {
  try {
    await disableApplication(row.id);
    message.success($t('common.action.disableSuccess', '已禁用'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleToggleState(row: ApplicationApi.ApplicationEntity) {
  const isEnabled = row.state?.value === 'enabled';
  await (isEnabled ? handleDisable(row) : handleEnable(row));
}

async function handleDelete(row: Recordable<any>) {
  try {
    await applicationCrudApis.deleteById(row.id);
    message.success($t('common.deleteSuccess', '删除成功'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <Page auto-content-height>
    <div class="h-full w-full overflow-hidden">
      <TableCard>
        <template #toolbar-tools>
          <Button type="primary" @click="handleAdd">
            {{ $t('application.add', '新增应用') }}
          </Button>
        </template>

        <template #state="{ row }">
          <Tag :color="row.state?.value === 'enabled' ? 'success' : 'error'">
            {{
              row.state?.value === 'enabled'
                ? $t('common.enable', '启用')
                : $t('common.disable', '禁用')
            }}
          </Tag>
        </template>

        <template #connectState="{ row }">
          <Tag
            :color="
              row.connectState?.value === 'normal'
                ? 'success'
                : row.connectState?.value === 'abnormal'
                  ? 'error'
                  : 'default'
            "
          >
            {{ row.connectState?.text || row.connectState?.value || '未知' }}
          </Tag>
        </template>

        <template #action="{ row }">
          <Button size="small" type="link" @click="handleEdit(row)">
            {{ $t('common.action.edit', '编辑') }}
          </Button>
          <Popconfirm
            :title="
              row.state?.value === 'enabled'
                ? $t('common.confirmDisable', '确定要禁用吗？')
                : $t('common.confirmEnable', '确定要启用吗？')
            "
            @confirm="handleToggleState(row)"
          >
            <Button size="small" type="link">
              {{
                row.state?.value === 'enabled'
                  ? $t('common.action.disable', '禁用')
                  : $t('common.action.enable', '启用')
              }}
            </Button>
          </Popconfirm>
          <Popconfirm
            :title="$t('common.confirmDelete', '确定要删除吗？')"
            @confirm="handleDelete(row)"
          >
            <Button danger size="small" type="link">
              {{ $t('common.action.delete', '删除') }}
            </Button>
          </Popconfirm>
        </template>

        <!-- Card Template -->
        <template #card="{ row }">
          <ApplicationCard
            :row="row"
            @delete="handleDelete"
            @enable="handleEnable"
            @disable="handleDisable"
            @edit="handleEdit"
          />
        </template>
      </TableCard>
    </div>

    <!-- Provider Selection Modal -->
    <SelectProviderModal @select="handleProviderSelected" />
  </Page>
</template>
