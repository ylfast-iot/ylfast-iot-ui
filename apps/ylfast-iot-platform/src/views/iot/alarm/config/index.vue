<script setup lang="ts">
import type { QueryParamEntity } from '#/adapter';
import type { RuleEngineAlarmConfigApi } from '#/api/iot';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, message, Popconfirm, Tag } from 'ant-design-vue';

import {
  RuleEngineAlarmConfigApi as AlarmConfigApi,
  disableAlarmConfig,
  enableAlarmConfig,
  queryAlarmConfigDetailPage,
} from '#/api/iot';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import AlarmConfigCard from './components/AlarmConfigCard.vue';
import {
  fetchAlarmLevelMap,
  fetchAlarmTargetTypeMap,
  getAlarmConfigStateTagOptions,
  getColumns,
  getSearchFormSchemas,
} from './data';

type AlarmStateLike =
  | null
  | RuleEngineAlarmConfigApi.AlarmState
  | undefined
  | { value?: RuleEngineAlarmConfigApi.AlarmState };

const PlusIcon = createIconifyIcon('lucide:plus');
const router = useRouter();

const levelMap = ref<Map<number | string, string>>(new Map());
const targetTypeMap = ref<Map<number | string, string>>(new Map());

/**
 * 加载页面展示需要的映射数据。
 */
async function loadDisplayMaps() {
  try {
    const [levelResult, targetTypeResult] = await Promise.all([
      fetchAlarmLevelMap(),
      fetchAlarmTargetTypeMap(),
    ]);

    levelMap.value = levelResult.labelMap;
    targetTypeMap.value = targetTypeResult.labelMap;
  } catch (error) {
    console.error('Failed to load alarm config display maps:', error);
  }
}

onMounted(() => {
  void loadDisplayMaps();
});

/**
 * 列表分页查询。
 */
const gridQuery = async (params: any, ...args: any[]) => {
  const { page } = params;
  const formValues = args[0] || {};

  const queryParams: QueryParamEntity = {
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    sorts: [{ name: 'createTime', order: 'desc' }],
    terms: formValues.terms || [],
  };

  return await queryAlarmConfigDetailPage(queryParams);
};

const [TableCard, gridApi] =
  useYlVxeTableCard<RuleEngineAlarmConfigApi.AlarmConfigDetail>({
    cardOptions: {
      minWidth: 320,
    },
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
          storageKey: 'iot-alarm-config-dc-storage',
        },
        mode: 'localstorage',
      },
    },
  });

/**
 * 兼容字符串态和字典态的状态值。
 */
function resolveStateValue(state?: AlarmStateLike) {
  if (typeof state === 'string') {
    return state;
  }

  return state?.value || 'disabled';
}

/**
 * 获取目标类型显示文本。
 */
function getTargetTypeText(targetType?: string) {
  if (!targetType) {
    return '-';
  }

  return targetTypeMap.value.get(targetType) || targetType;
}

/**
 * 获取告警级别显示文本。
 */
function getLevelText(level?: number) {
  if (level === undefined || level === null) {
    return '-';
  }

  return levelMap.value.get(level) || String(level);
}

/**
 * 获取告警配置状态显示对象。
 */
function getStateMeta(state?: AlarmStateLike) {
  const stateValue = resolveStateValue(state);

  return (
    getAlarmConfigStateTagOptions().find(
      (item) => item.value === stateValue,
    ) || {
      color: 'default',
      label: stateValue || '-',
      value: stateValue || '',
    }
  );
}

/**
 * 获取启用状态切换确认文案。
 */
function getToggleConfirmTitle(
  row: RuleEngineAlarmConfigApi.AlarmConfigDetail,
) {
  return resolveStateValue(row.state) === 'enabled'
    ? '确认禁用该告警配置吗？'
    : '确认启用该告警配置吗？';
}

/**
 * 跳转新增详情页。
 */
function handleAdd() {
  router.push('/iot/alarm/config/detail');
}

/**
 * 跳转编辑详情页。
 */
function handleEdit(row: RuleEngineAlarmConfigApi.AlarmConfigDetail) {
  router.push({
    path: '/iot/alarm/config/detail',
    query: { id: row.id },
  });
}

/**
 * 删除告警配置。
 */
async function handleDelete(row: RuleEngineAlarmConfigApi.AlarmConfigDetail) {
  try {
    await AlarmConfigApi.basicCrudApis.deleteById(row.id);
    message.success($t('common.deleteSuccess'));
    await gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

/**
 * 切换告警配置启用状态。
 */
async function handleToggleState(
  row: RuleEngineAlarmConfigApi.AlarmConfigDetail,
) {
  try {
    if (resolveStateValue(row.state) === 'enabled') {
      await disableAlarmConfig(row.id);
      message.success($t('alarm.config.messages.disableSuccess'));
    } else {
      await enableAlarmConfig(row.id);
      message.success($t('alarm.config.messages.enableSuccess'));
    }

    await gridApi.reload();
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
          <template #icon>
            <PlusIcon class="mr-1 size-4" />
          </template>
          {{ $t('alarm.config.list.add') }}
        </Button>
      </template>

      <template #targetType="{ row }">
        <span>{{ getTargetTypeText(row.targetType) }}</span>
      </template>

      <template #level="{ row }">
        <span>{{ getLevelText(row.level) }}</span>
      </template>

      <template #state="{ row }">
        <Tag :color="getStateMeta(row.state).color">
          {{ getStateMeta(row.state).label }}
        </Tag>
      </template>

      <template #action="{ row }">
        <div class="flex-center flex gap-2">
          <Button type="link" size="small" @click.stop="handleEdit(row)">
            {{ $t('common.action.edit') }}
          </Button>
          <Popconfirm
            :title="getToggleConfirmTitle(row)"
            @confirm="handleToggleState(row)"
          >
            <Button type="link" size="small" @click.stop>
              {{
                resolveStateValue(row.state) === 'enabled'
                  ? $t('common.disable')
                  : $t('common.enable')
              }}
            </Button>
          </Popconfirm>
          <Popconfirm
            :title="$t('common.action.confirmDelete')"
            @confirm="handleDelete(row)"
          >
            <Button type="link" size="small" danger @click.stop>
              {{ $t('common.action.delete') }}
            </Button>
          </Popconfirm>
        </div>
      </template>

      <template #card="{ row }">
        <AlarmConfigCard
          :row="row"
          :level-map="levelMap"
          :target-type-map="targetTypeMap"
          @delete="handleDelete"
          @edit="handleEdit"
          @toggle-state="handleToggleState"
        />
      </template>
    </TableCard>
  </Page>
</template>
