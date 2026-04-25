<script setup lang="ts">
import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Button, message, Popconfirm, Switch, Tag } from 'ant-design-vue';

import {
  deleteScene,
  disableScene,
  enableScene,
  queryScenePage,
  RuleEngineSceneApi,
} from '#/api/iot/rule-engine/scene';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import SceneAddModal from './components/SceneAddModal.vue';
import SceneCard from './components/SceneCard.vue';
import { getColumns, getSearchFormSchemas, getTriggerTypeName } from './data';

const router = useRouter();

const [AddModal, addModalApi] = useVbenModal({
  connectedComponent: SceneAddModal,
});

const gridQuery = async (_params: any, ...args: any[]) => {
  const queryParams = args[0] || {};
  const { page } = _params;

  const { data, total } = await queryScenePage({
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    sorts: [{ name: 'createTime', order: 'desc' }],
    terms: queryParams.terms || [],
  });

  return {
    items: data,
    total,
  };
};

const [TableCard, gridApi] = useYlVxeTableCard<RuleEngineSceneApi.SceneEntity>({
  cardOptions: {
    minWidth: 300,
  },
  defaultMode: 'card',
  mode: 'all',
  gridOptions: {
    columns: getColumns(),
    height: 'auto',
    pagerConfig: {
      enabled: true,
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
      refresh: true,
      search: true,
    },
  },
  searchFormMode: 'yl-dc-form',
  showSearchForm: true,
  tableTitle: $t('scene.list', '场景联动列表'),
  ylDcFromOptions: {
    formSchemas: getSearchFormSchemas(),
  },
});

function handleAdd() {
  addModalApi.open();
}

function handleAddSuccess(payload: { id: string; triggerType: string }) {
  gridApi.reload();
  router.push({
    path: '/iot/rule-engine/scene/detail',
    query: {
      id: payload.id,
      triggerType: payload.triggerType,
    },
  });
}

function handleEdit(row: RuleEngineSceneApi.SceneEntity) {
  router.push({
    path: `scene/detail`,
    query: {
      id: row.id,
    },
  });
}

async function handleToggleState(row: RuleEngineSceneApi.SceneEntity) {
  try {
    const newState = row.state?.value === 'started' ? 'disable' : 'started';
    if (newState === 'started') {
      if (
        row.trigger?.[row?.triggerType as string] ||
        row.trigger?.configuration
      ) {
        await enableScene(row.id!);
      } else {
        message.warning('请完成场景配置后再启用');
        return;
      }
    } else {
      await disableScene(row.id!);
    }
    message.success($t('common.updateSuccess'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleDelete(row: RuleEngineSceneApi.SceneEntity) {
  try {
    await deleteScene(row.id!);
    message.success($t('common.deleteSuccess'));
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
        <Button type="primary" @click="handleAdd">
          {{ $t('common.add') }}
        </Button>
      </template>

      <template #triggerType="{ row }">
        <Tag color="processing">
          {{ getTriggerTypeName(row.triggerType) }}
        </Tag>
      </template>

      <template #state="{ row }">
        <Switch
          :checked="row.state?.value === 'started'"
          @change="handleToggleState(row)"
        />
      </template>

      <template #action="{ row }">
        <Button size="small" type="link" @click="handleEdit(row)">
          {{ $t('common.action.edit') }}
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

      <!-- Card Template -->
      <template #card="{ row }">
        <SceneCard
          :row="row"
          @delete="handleDelete"
          @edit="handleEdit"
          @toggle-state="handleToggleState"
        />
      </template>
    </TableCard>

    <AddModal @success="handleAddSuccess" />
  </Page>
</template>

<style scoped></style>
