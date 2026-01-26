<script setup lang="ts">
import type { QueryParamEntity } from '#/adapter';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Divider, message, Popconfirm } from 'ant-design-vue';

import {
  getMediaServerSupports,
  IotMediaServerApi as MediaApi,
  shutdownMediaServer,
  startMediaServer,
} from '#/api/iot/media-server';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import MediaServerCard from './components/MediaServerCard.vue';
import { getColumns, getSearchFormSchemas } from './data';
import EditDrawer from './EditDrawer.vue';

const PlusIcon = createIconifyIcon('lucide:plus');

const editDrawerRef = ref<any>(null);
const providerOptions = ref<any[]>([]);
const statusLoadingIds = ref<string[]>([]);

// --- Load Supports ---
onMounted(async () => {
  try {
    const res = await getMediaServerSupports();
    providerOptions.value = res.map((item) => ({
      label: item.name,
      value: item.id,
    }));
  } catch (error) {
    console.error('Failed to load media server supports:', error);
  }
});

// --- Grid & Logic ---
const gridQuery = async (params: any, ...args: any[]) => {
  const { page } = params;
  const formValues = args[0] || {};
  const { terms } = formValues;

  const queryParams: QueryParamEntity = {
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    terms,
    sorts: [{ name: 'createTime', order: 'desc' }],
  };
  return await MediaApi.basicCrudApis.postQuery(queryParams);
};

const [TableCard, gridApi] = useYlVxeTableCard<MediaApi.IotMediaServerConfig>({
  defaultMode: 'card',
  gridOptions: {
    rowConfig: {
      keyField: 'id',
    },
    columns: getColumns(),
    height: 'auto',
    pagerConfig: {
      enabled: true,
      pageSize: 12,
      pageSizes: [12, 24, 48],
    },
    proxyConfig: {
      ajax: {
        query: gridQuery,
      },
      response: {
        result: 'data',
      },
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
  ylDcFromOptions: {
    formSchemas: getSearchFormSchemas(),
    storeOption: {
      conf: {
        storageKey: 'iot-media-server-dc-storage',
      },
      mode: 'localstorage',
    },
  },
});

// --- Handlers ---
function handleAdd() {
  editDrawerRef.value?.setData({ options: providerOptions.value });
}

function handleEdit(row: MediaApi.IotMediaServerConfig) {
  editDrawerRef.value?.setData({ ...row, options: providerOptions.value });
}

async function handleDelete(row: MediaApi.IotMediaServerConfig) {
  try {
    await MediaApi.basicCrudApis.deleteById(row.id);
    message.success($t('common.deleteSuccess'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleToggleStatus(row: MediaApi.IotMediaServerConfig) {
  const isEnabled = !!row.enabled;
  statusLoadingIds.value.push(row.id);
  try {
    if (isEnabled) {
      await shutdownMediaServer(row.provider, row.id);
      message.success($t('mediaServer.action.shutdownSuccess'));
    } else {
      await startMediaServer(row.provider, row.id);
      message.success($t('mediaServer.action.startSuccess'));
    }
    gridApi.reload();
  } catch (error) {
    console.error(error);
  } finally {
    statusLoadingIds.value = statusLoadingIds.value.filter(
      (id) => id !== row.id,
    );
  }
}

function handleSuccess() {
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <!-- Toolbar -->
      <template #toolbar-tools>
        <div class="flex gap-2">
          <Button type="primary" @click="handleAdd">
            <template #icon>
              <PlusIcon class="mr-1 size-4" />
            </template>
            {{ $t('common.action.add') }}
          </Button>
        </div>
      </template>

      <template #action="{ row }">
        <div class="flex-center flex gap-2">
          <Button type="link" size="small" @click.stop="handleEdit(row)">
            {{ $t('common.edit') }}
          </Button>
          <Divider type="vertical" />
          <Button
            type="link"
            size="small"
            :danger="!!row.enabled"
            :loading="statusLoadingIds.includes(row.id)"
            @click.stop="handleToggleStatus(row)"
          >
            {{
              row.enabled
                ? $t('mediaServer.action.shutdown')
                : $t('mediaServer.action.start')
            }}
          </Button>
          <Divider type="vertical" />
          <Popconfirm
            :title="$t('common.action.confirmDelete')"
            @confirm="handleDelete(row)"
          >
            <Button type="link" size="small" danger @click.stop>
              {{ $t('common.delete') }}
            </Button>
          </Popconfirm>
        </div>
      </template>

      <!-- Card Template -->
      <template #card="{ row }">
        <MediaServerCard
          :row="row"
          :provider-options="providerOptions"
          :loading="statusLoadingIds.includes(row.id)"
          @delete="handleDelete"
          @edit="handleEdit"
          @toggle-status="handleToggleStatus"
        />
      </template>
    </TableCard>

    <EditDrawer ref="editDrawerRef" @success="handleSuccess" />
  </Page>
</template>
