<script setup lang="ts">
import type { QueryParamEntity } from '#/adapter';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Divider, message, Popconfirm } from 'ant-design-vue';

import {
  getChannels,
  getGatewayProviders,
  IotGatewayApi,
  queryGatewayDetailPage,
  shutdownGateway,
  startupGateway,
} from '#/api/iot/gateway';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';
import { CHANNEL_TYPE_ENUMS } from '#/enums/channel-type';

import GatewayCard from './components/GatewayCard.vue';
import GatewayDetailDrawer from './components/GatewayDetailDrawer.vue';
import { getColumns, getSearchFormSchemas } from './data';

const PlusIcon = createIconifyIcon('lucide:plus');

const providerOptions = ref<{ label: string; value: string }[]>([]);
const channelOptions = ref<{ label: string; value: string }[]>([]);
const loadingIds = ref<Set<string>>(new Set());

// --- Load Providers & Channels ---
onMounted(async () => {
  try {
    const [providersRes, channelsRes] = await Promise.all([
      getGatewayProviders(),
      getChannels(),
    ]);
    providerOptions.value = providersRes.map((item) => ({
      label: item.name,
      value: item.id,
    }));
    channelOptions.value = channelsRes.map((item) => {
      const enumItem = Object.values(CHANNEL_TYPE_ENUMS).find(
        (e) =>
          e.value === item.id ||
          e.value.toLowerCase().endsWith(item.id.toLowerCase()),
      );
      return {
        label: enumItem?.label || item.name,
        value: item.id,
      };
    });
  } catch (error) {
    console.error('Failed to load gateway options:', error);
  }
});

// --- Grid Query ---
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

  const res = await queryGatewayDetailPage(queryParams);
  return res;
};

const [TableCard, gridApi] =
  useYlVxeTableCard<IotGatewayApi.DeviceGatewayDetail>({
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
          storageKey: 'iot-gateway-dc-storage',
        },
        mode: 'localstorage',
      },
    },
  });

// --- Handlers ---
const router = useRouter();

function handleAdd() {
  router.push('/iot/gateway/access');
}

function handleEdit(row: IotGatewayApi.DeviceGatewayDetail) {
  router.push({
    path: '/iot/gateway/accessDetail',
    query: {
      id: row.id,
      providerId: row.provider,
    },
  });
}

async function handleDelete(row: IotGatewayApi.DeviceGatewayDetail) {
  try {
    await IotGatewayApi.basicCrudApis.deleteById(row.id);
    message.success($t('common.deleteSuccess'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleStartup(row: IotGatewayApi.DeviceGatewayDetail) {
  loadingIds.value.add(row.id);
  try {
    await startupGateway(row.id);
    message.success($t('gateway.action.startup') + $t('common.success'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  } finally {
    loadingIds.value.delete(row.id);
  }
}

async function handleShutdown(row: IotGatewayApi.DeviceGatewayDetail) {
  loadingIds.value.add(row.id);
  try {
    await shutdownGateway(row.id);
    message.success($t('gateway.action.shutdown') + $t('common.success'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  } finally {
    loadingIds.value.delete(row.id);
  }
}

// Detail Drawer
const detailDrawerRef = ref<InstanceType<typeof GatewayDetailDrawer>>();

function handleViewDetail(row: IotGatewayApi.DeviceGatewayDetail) {
  detailDrawerRef.value?.open(row.id);
}

// 获取 provider 显示名称
function getProviderName(providerId: string) {
  const option = providerOptions.value.find((opt) => opt.value === providerId);
  return option ? option.label : providerId;
}
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <template #name="{ row }">
        <div class="flex items-center gap-2">
          <span class="font-bold">{{ row.name }}</span>
        </div>
      </template>

      <template #provider="{ row }">
        <span>{{ getProviderName(row.provider) }}</span>
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
          <!-- 根据状态显示不同操作 -->
          <template v-if="row.state?.value === 'enabled'">
            <Popconfirm
              :title="$t('gateway.action.confirmShutdown')"
              @confirm="handleShutdown(row)"
            >
              <Button
                type="link"
                size="small"
                danger
                @click.stop
                :loading="loadingIds.has(row.id)"
              >
                {{ $t('gateway.action.shutdown') }}
              </Button>
            </Popconfirm>
          </template>
          <template v-else>
            <Popconfirm
              :title="$t('gateway.action.confirmStartup')"
              @confirm="handleStartup(row)"
            >
              <Button
                type="link"
                size="small"
                @click.stop
                :loading="loadingIds.has(row.id)"
              >
                {{ $t('gateway.action.startup') }}
              </Button>
            </Popconfirm>
          </template>
          <Divider type="vertical" />
          <Popconfirm
            :title="$t('common.action.confirmDelete')"
            @confirm="handleDelete(row)"
          >
            <Button
              type="link"
              size="small"
              danger
              :disabled="row.state?.value === 'enabled'"
              @click.stop
            >
              {{ $t('common.delete') }}
            </Button>
          </Popconfirm>
        </div>
      </template>

      <!-- Card Template -->
      <template #card="{ row }">
        <GatewayCard
          :row="row"
          :provider-options="providerOptions"
          :channel-options="channelOptions"
          :loading="loadingIds.has(row.id)"
          @delete="handleDelete"
          @edit="handleEdit"
          @shutdown="handleShutdown"
          @startup="handleStartup"
          @click="handleViewDetail"
        />
      </template>
    </TableCard>
    <GatewayDetailDrawer ref="detailDrawerRef" />
  </Page>
</template>
