<script setup lang="ts">
import type { QueryParamEntity } from '#/adapter';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Divider, message, Popconfirm, Tooltip } from 'ant-design-vue';

import {
  IotNetCompApi as CompApi,
  getNetworkSupports,
  shutdownNetwork,
  startNetwork,
} from '#/api/iot/network-config';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import NetworkCard from './components/NetworkCard.vue';
import { getColumns, getSearchFormSchemas } from './data';
import EditDrawer from './EditDrawer.vue';

const PlusIcon = createIconifyIcon('lucide:plus');
const ServerIcon = createIconifyIcon('lucide:server');
const CloudIcon = createIconifyIcon('lucide:cloud');

const editDrawerRef = ref<any>(null);
const typeOptions = ref<any[]>([]);

// --- Load Supports ---
onMounted(async () => {
  try {
    const res = await getNetworkSupports();
    typeOptions.value = res.map((item) => ({
      label: item.name,
      value: item.id,
    }));
  } catch (error) {
    console.error('Failed to load network supports:', error);
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
  return await CompApi.basicCrudApis.postQuery(queryParams);
};

const [TableCard, gridApi] = useYlVxeTableCard<CompApi.IotNetComp>({
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
        storageKey: 'iot-network-dc-storage',
      },
      mode: 'localstorage',
    },
  },
});

// --- Handlers ---
function handleAdd() {
  editDrawerRef.value?.setData({ options: typeOptions.value });
}

function handleEdit(row: CompApi.IotNetComp) {
  editDrawerRef.value?.setData({ ...row, options: typeOptions.value });
}

async function handleDelete(row: CompApi.IotNetComp) {
  try {
    await CompApi.basicCrudApis.deleteById(row.id);
    message.success($t('common.deleteSuccess'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleToggleStatus(row: CompApi.IotNetComp) {
  const isEnabled = row.state?.value === 'enabled';
  try {
    if (isEnabled) {
      await shutdownNetwork(row.id);
      message.success($t('network.action.shutdown') + $t('common.success'));
    } else {
      await startNetwork(row.id);
      message.success($t('network.action.start') + $t('common.success'));
    }
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

function handleSuccess() {
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <template #name="{ row }">
        <div class="flex items-center gap-2">
          <span class="font-bold">{{ row.name }}</span>
          <span
            v-if="row.addressInfo && row.addressInfo.length > 0"
            class="shrink-0 rounded px-1.5 py-px text-[9px] font-bold tracking-wider transition-all"
            :class="
              row.addressInfo?.[0]?.isClient
                ? 'bg-blue-100/80 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                : 'bg-orange-100/80 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
            "
          >
            {{
              row.addressInfo?.[0]?.client
                ? $t('network.client')
                : $t('network.server')
            }}
          </span>
        </div>
      </template>

      <template #address="{ row }">
        <div
          v-if="row.addressInfo && row.addressInfo.length > 0"
          class="flex items-center gap-2"
        >
          <Tooltip>
            <template #title>
              <div class="flex flex-col gap-1 p-1">
                <div
                  v-for="(addr, index) in row.addressInfo"
                  :key="index"
                  class="flex items-center gap-1.5 whitespace-nowrap text-[11px]"
                >
                  <component
                    :is="addr.client ? CloudIcon : ServerIcon"
                    class="size-3"
                    :class="addr.client ? 'text-blue-400' : 'text-orange-400'"
                  />
                  <span class="font-mono">{{ addr.address }}</span>
                </div>
              </div>
            </template>
            <div class="flex items-center gap-2">
              <component
                :is="row.addressInfo?.[0]?.client ? CloudIcon : ServerIcon"
                class="size-3.5 shrink-0"
                :class="
                  row.addressInfo?.[0]?.client
                    ? 'text-blue-500'
                    : 'text-orange-500'
                "
              />
              <span
                class="truncate font-mono text-[11px] leading-none text-slate-600 dark:text-gray-400"
                :title="row.addressInfo?.[0]?.address"
              >
                {{ row.addressInfo?.[0]?.address }}
              </span>
              <span
                v-if="row.addressInfo && row.addressInfo.length > 1"
                class="cursor-help whitespace-nowrap text-[10px] font-bold text-primary underline decoration-dotted"
              >
                +{{ row.addressInfo.length - 1 }}
              </span>
            </div>
          </Tooltip>
        </div>
        <span v-else class="text-slate-300">-</span>
      </template>

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
            :danger="row.state?.value === 'enabled'"
            @click.stop="handleToggleStatus(row)"
          >
            {{
              row.state?.value === 'enabled'
                ? $t('network.action.shutdown')
                : $t('network.action.start')
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
        <NetworkCard
          :row="row"
          :type-options="typeOptions"
          @delete="handleDelete"
          @edit="handleEdit"
          @toggle-status="handleToggleStatus"
        />
      </template>
    </TableCard>

    <EditDrawer ref="editDrawerRef" @success="handleSuccess" />
  </Page>
</template>
