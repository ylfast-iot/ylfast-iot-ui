<script setup lang="ts">
import type { IotNotifyChannelApi } from '#/api/iot/notify/channel';
import type { IotNotificationApi } from '#/api/iot/notify/notification';

import { onMounted, ref } from 'vue';

import { $t } from '@vben/locales';

import {
  Button,
  Empty,
  Menu,
  MenuItem,
  message,
  Modal,
  Space,
  Spin,
  Tag,
} from 'ant-design-vue';

import { getAccessibleChannels } from '#/api/iot/notify/channel';
import {
  changeNotificationState,
  getCurrentProvidersByType,
  queryMyNotifications,
} from '#/api/iot/notify/notification';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';
import { NOTIFY_TYPE_ENUMS } from '#/enums/notify';

// 定义接口，复用 channel 结构以便于分类和渲染
interface SubscriptionGroup {
  typeId: string;
  typeName: string;
}

const loading = ref(false);
const categories = ref<SubscriptionGroup[]>([]);
const activeCategory = ref<string>('');
const currentProviderIds = ref<string[]>([]);

// 查看详情弹窗状态
const detailModalVisible = ref(false);
const detailContent = ref<string>('');

/**
 * 分组处理数据，提取出所有有可用类型的分类
 */
function extractCategories(
  providers: IotNotifyChannelApi.SubscriberProviderInfo[],
): SubscriptionGroup[] {
  const groupMap = new Map<string, SubscriptionGroup>();
  providers.forEach((provider) => {
    if (!provider.channels || provider.channels.length === 0) return;

    const typeId = provider.type?.id || 'unknown';
    const typeEnums = NOTIFY_TYPE_ENUMS as any;
    const typeName = typeEnums[typeId]?.label || provider.type?.name || typeId;

    if (!groupMap.has(typeId)) {
      groupMap.set(typeId, {
        typeId,
        typeName,
      });
    }
  });

  return [...groupMap.values()].sort((a, b) =>
    a.typeName.localeCompare(b.typeName),
  );
}

/**
 * 初始化加载分类
 */
async function loadCategories() {
  loading.value = true;
  try {
    const channelsData = await getAccessibleChannels();
    categories.value = extractCategories(channelsData);
    if (categories.value.length > 0) {
      activeCategory.value = categories.value[0]!.typeId;
      await fetchProvidersAndRefreshTable(activeCategory.value);
    }
  } catch (error) {
    console.error('Failed to load categories', error);
  } finally {
    loading.value = false;
  }
}

/**
 * 获取当前分类下的 provider 并刷新表格
 */
async function fetchProvidersAndRefreshTable(typeId: string) {
  try {
    const providersData = await getCurrentProvidersByType(typeId);
    currentProviderIds.value = providersData.map((p) => p.id);
    // 触发表格重新查询
    gridApi.grid.commitProxy('query');
  } catch (error) {
    console.error('Failed to fetch providers', error);
  }
}

/**
 * 切换分类事件
 */
async function handleCategoryChange(info: any) {
  const key = String(info.key);
  if (activeCategory.value === key) return;
  activeCategory.value = key;
  await fetchProvidersAndRefreshTable(key);
}

/**
 * 表格数据查询方法
 */
const gridQuery = async (_params: any, ...args: any[]) => {
  if (currentProviderIds.value.length === 0) return { items: [], total: 0 };

  const queryParams = args[0] || {};
  const { page } = _params;

  const termsToCombine: any[] = [];

  // 从搜索栏过来的参数
  if (queryParams.terms && queryParams.terms.length > 0) {
    termsToCombine.push(...queryParams.terms);
  }

  // 限定只查询当前所选分类的 providers 下的消息
  termsToCombine.push({
    column: 'topicProvider',
    value:
      currentProviderIds.value.length > 0 ? currentProviderIds.value : ['none'],
    termType: 'in',
  });

  const queryPayload = {
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    sorts: [{ name: 'notifyTime', order: 'desc' as const }],
    terms:
      termsToCombine.length > 0
        ? [{ terms: termsToCombine, type: 'and' as const }]
        : [],
  };

  const { data, total } = await queryMyNotifications(queryPayload);
  return { items: data || [], total: total || 0 };
};

/**
 * 点击查看详情
 */
function handleViewDetail(row: IotNotificationApi.IotNotificationEntity) {
  if (row.detailJson) {
    try {
      // 尝试美化 JSON
      const parsed = JSON.parse(row.detailJson);
      detailContent.value = JSON.stringify(parsed, null, 2);
    } catch {
      detailContent.value = row.detailJson;
    }
  } else {
    detailContent.value = row.message || row.description || '{}';
  }
  detailModalVisible.value = true;
}

/**
 * 改变通知状态标记为已读
 */
async function handleMarkAsRead(row: IotNotificationApi.IotNotificationEntity) {
  if (!row.id) return;
  try {
    await changeNotificationState([row.id], 'read');
    message.success($t('common.success'));
    gridApi.grid.commitProxy('query');
  } catch (error) {
    console.error('Failed to mark as read', error);
  }
}

const columns: any[] = [
  {
    field: 'topicName',
    title: '类型', // 后续可转提取多语言
    minWidth: 150,
    width: 200,
  },
  {
    field: 'message',
    title: '消息内容',
    minWidth: 200,
  },
  {
    field: 'notifyTime',
    title: '通知时间',
    width: 180,
  },
  {
    field: 'state',
    title: '状态',
    width: 100,
    slots: { default: 'state' },
  },
  {
    field: 'action',
    title: '操作',
    width: 200,
    slots: { default: 'action' },
    fixed: 'right',
  },
];

const [TableCard, gridApi] =
  useYlVxeTableCard<IotNotificationApi.IotNotificationEntity>({
    mode: 'table',
    separator: false,
    gridOptions: {
      height: 'auto',
      columns,
      pagerConfig: {
        enabled: true,
      },
      rowConfig: {
        keyField: 'id',
      },
      proxyConfig: {
        response: {
          result: 'data',
        },
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
    tableTitle: $t('profile.message.title', '站内信'),
    ylDcFromOptions: {
      formSchemas: [
        {
          component: 'Input',
          field: 'message',
          componentProps: {
            placeholder: '请输入消息内容查询',
          },
          label: '消息内容',
        },
      ],
    },
  });

onMounted(() => {
  loadCategories();
});
</script>

<template>
  <Spin :spinning="loading" wrapper-class-name="h-full">
    <div
      class="flex h-full rounded-lg border border-border/40 bg-background shadow-sm"
    >
      <!-- 左侧分类菜单 -->
      <div
        v-if="categories.length > 0"
        class="flex w-48 shrink-0 flex-col overflow-y-auto bg-muted/20"
      >
        <Menu
          :selected-keys="[activeCategory]"
          mode="vertical"
          class="h-full border-none bg-transparent px-2 pt-4"
          @click="handleCategoryChange"
        >
          <MenuItem
            v-for="cat in categories"
            :key="cat.typeId"
            class="!my-1.5 !rounded-md"
          >
            {{ cat.typeName }}
          </MenuItem>
        </Menu>
      </div>

      <!-- 右侧消息列表 -->
      <div
        v-if="categories.length > 0"
        class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      >
        <TableCard>
          <template #state="{ row }">
            <Tag :color="row.state?.value === 'read' ? 'green' : 'orange'">
              {{ row.state?.text }}
            </Tag>
          </template>
          <template #action="{ row }">
            <Space>
              <Button type="link" size="small" @click="handleViewDetail(row)">
                详情
              </Button>
              <Button
                v-if="row.state?.value === 'unread'"
                type="link"
                size="small"
                @click="handleMarkAsRead(row)"
              >
                标记已读
              </Button>
            </Space>
          </template>
        </TableCard>
      </div>

      <!-- 无分类空状态 -->
      <div v-else-if="!loading" class="flex flex-1 items-center justify-center">
        <Empty description="暂无可用的消息分类" />
      </div>
    </div>

    <!-- 查看详情弹框 -->
    <Modal
      v-model:open="detailModalVisible"
      title="通知详情"
      :footer="null"
      width="600px"
    >
      <div
        class="word-break-all mt-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-md border border-border/50 bg-muted/30 p-4 font-mono text-sm"
      >
        {{ detailContent }}
      </div>
    </Modal>
  </Spin>
</template>

<style scoped>
:deep(.ant-spin-nested-loading) {
  height: 100%;
}

:deep(.ant-spin-container) {
  height: 100%;
}
</style>
