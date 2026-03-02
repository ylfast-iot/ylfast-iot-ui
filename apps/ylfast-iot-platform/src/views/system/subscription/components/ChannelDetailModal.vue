<script setup lang="ts">
import type { IotNotifyChannelApi } from '#/api/iot/notify/channel';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Descriptions, Modal, Spin, Table, Tag } from 'ant-design-vue';

import { IotNotifyConfigApi } from '#/api/iot/notify/config';
import {
  getTemplateDetail,
  IotNotifyTemplateApi,
} from '#/api/iot/notify/template';
import { queryRolePost } from '#/api/system/role';
import { NOTIFY_PROVIDER_ENUMS } from '#/enums/notify';

const props = defineProps<{
  data: IotNotifyChannelApi.NotifySubscriberChannel | null;
  open: boolean;
}>();

const emit = defineEmits(['update:open']);

const loading = ref(false);
const templateDetail = ref<any>(null);
const notifierDetail = ref<any>(null);
const roleMap = ref<Record<string, string>>({});

async function loadDetail() {
  const templateId = props.data?.channelConfiguration?.templateId;
  const notifierId = props.data?.channelConfiguration?.notifierId;
  if (!templateId && !notifierId) return;

  loading.value = true;
  try {
    const promises = [];
    if (templateId) {
      promises.push(
        Promise.all([
          IotNotifyTemplateApi.basicCrudApis.getById(templateId),
          getTemplateDetail(templateId),
        ]).then(([entity, detail]) => {
          templateDetail.value = { ...entity, ...detail };
        }),
      );
    }
    if (notifierId) {
      promises.push(
        IotNotifyConfigApi.basicCrudApis.getById(notifierId).then((res) => {
          notifierDetail.value = res;
        }),
      );
    }
    // 查询所有角色用于回显名称
    promises.push(
      queryRolePost({ pageIndex: 0, pageSize: 9999, paging: false }).then(
        (res) => {
          const map: Record<string, string> = {};
          res.data.forEach((r) => {
            map[r.id] = r.name;
          });
          roleMap.value = map;
        },
      ),
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to load detail:', error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      templateDetail.value = null;
      notifierDetail.value = null;
      loadDetail();
    }
  },
);

function handleCancel() {
  emit('update:open', false);
}

// 辅助函数
const getProviderConfig = (providerId: string): any => {
  return (
    Object.values(NOTIFY_PROVIDER_ENUMS).find(
      (p: any) => p.subscriberProviderId === providerId,
    ) || {}
  );
};

// 变量表格列
const varColumns = computed(() => [
  {
    title: $t('subscription.detail.varName'),
    dataIndex: 'name',
    key: 'name',
    width: 150,
  },
  {
    title: $t('subscription.detail.varId'),
    dataIndex: 'id',
    key: 'id',
    width: 150,
  },
  {
    title: $t('subscription.detail.configSource'),
    dataIndex: 'source',
    key: 'source',
    width: 100,
  },
  {
    title: $t('subscription.detail.configContent'),
    dataIndex: 'value',
    key: 'value',
  },
]);

const getVarData = () => {
  if (!props.data?.channelConfiguration?.variables) return [];
  const vars = props.data.channelConfiguration.variables;
  return Object.entries(vars).map(([id, val]: [string, any]) => {
    let sourceLabel = val.source;
    let content = '';

    switch (val.source) {
      case 'fixed': {
        sourceLabel = $t('subscription.detail.sourceFixed');
        content = val.value || '-';

        break;
      }
      case 'relation': {
        sourceLabel = $t('subscription.detail.sourceRelation');
        content = `${val.relation?.objectType || ''} (${$t('subscription.detail.sourceFrom', { key: val.relation?.objectSource?.upperKey || '' })})`;

        break;
      }
      case 'upper': {
        sourceLabel = $t('subscription.detail.sourceUpper');
        content = val.upperKey || '-';

        break;
      }
      // No default
    }

    // 从模板详情中查找名称
    const varDef = templateDetail.value?.varDefs?.find((v: any) => v.id === id);
    const name = varDef?.name || id;

    return { id, name, source: sourceLabel, value: content };
  });
};
</script>

<template>
  <Modal
    :open="open"
    :title="$t('subscription.action.view')"
    :width="1000"
    :footer="null"
    @cancel="handleCancel"
  >
    <Spin :spinning="loading">
      <div v-if="data" class="flex flex-col gap-6 p-2">
        <!-- 基础信息 -->
        <Descriptions bordered size="small" :column="2">
          <template #title>
            <div class="flex items-center gap-2">
              <IconifyIcon icon="lucide:info" class="size-4 text-primary" />
              <span>{{ $t('subscription.detail.basicInfo') }}</span>
            </div>
          </template>
          <Descriptions.Item :label="$t('subscription.detail.channelName')">
            <span class="font-medium text-foreground">{{ data.name }}</span>
          </Descriptions.Item>
          <Descriptions.Item :label="$t('subscription.detail.provider')">
            <div class="flex items-center gap-2">
              <IconifyIcon
                :icon="
                  getProviderConfig(data.channelProvider).icon || 'lucide:bell'
                "
                :class="`size-4 text-${getProviderConfig(data.channelProvider).color || 'blue'}-500`"
              />
              <span>{{
                getProviderConfig(data.channelProvider).label ||
                data.channelProvider
              }}</span>
            </div>
          </Descriptions.Item>
          <Descriptions.Item :label="$t('subscription.detail.config')">
            <div class="flex flex-col gap-0.5">
              <span class="font-medium">{{ notifierDetail?.name || '-' }}</span>
              <span
                class="font-mono text-[10px] text-muted-foreground opacity-70"
              >
                {{ data.channelConfiguration.notifierId }}
              </span>
            </div>
          </Descriptions.Item>
        </Descriptions>

        <!-- 模板信息 -->
        <Descriptions bordered size="small" :column="1">
          <template #title>
            <div class="flex items-center gap-2">
              <IconifyIcon
                icon="lucide:layout-template"
                class="size-4 text-primary"
              />
              <span>{{ $t('subscription.detail.templateDetail') }}</span>
            </div>
          </template>
          <Descriptions.Item :label="$t('subscription.detail.templateName')">
            {{ templateDetail?.name || data.channelConfiguration.templateId }}
          </Descriptions.Item>
          <Descriptions.Item
            v-if="templateDetail?.template"
            :label="$t('subscription.detail.templateContent')"
          >
            <div
              class="max-h-[200px] overflow-auto rounded bg-muted/30 p-2 text-xs"
            >
              <pre class="whitespace-pre-wrap font-sans">{{
                templateDetail.template
              }}</pre>
            </div>
          </Descriptions.Item>
        </Descriptions>

        <!-- 变量配置 -->
        <div class="flex flex-col gap-2">
          <div
            class="flex items-center gap-2 text-sm font-bold text-foreground"
          >
            <IconifyIcon icon="lucide:variable" class="size-4 text-primary" />
            <span>{{ $t('subscription.detail.templateVariables') }}</span>
          </div>
          <Table
            :columns="varColumns"
            :data-source="getVarData()"
            size="small"
            :pagination="false"
            bordered
          />
        </div>

        <!-- 权限配置 -->
        <div class="flex flex-col gap-2">
          <div
            class="flex items-center gap-2 text-sm font-bold text-foreground"
          >
            <IconifyIcon
              icon="lucide:shield-check"
              class="size-4 text-primary"
            />
            <span>{{ $t('subscription.detail.subscribePermission') }}</span>
          </div>
          <div
            class="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/5 p-3"
          >
            <template v-if="data.grant?.role?.idList?.length">
              <Tag v-for="id in data.grant.role.idList" :key="id" color="blue">
                {{ roleMap[id] || id }}
              </Tag>
            </template>
            <span v-else class="text-xs italic text-muted-foreground">
              {{ $t('subscription.detail.noRoleLimit') }}
            </span>
          </div>
        </div>
      </div>
    </Spin>
  </Modal>
</template>

<style scoped>
pre {
  margin: 0;
}
</style>
