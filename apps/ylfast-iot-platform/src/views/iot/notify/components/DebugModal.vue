<script setup lang="ts">
import type { ColumnType } from 'ant-design-vue/es/table';

import type { ConfigPropertyMetadata } from '#/types/config-metadata';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  Button,
  Card,
  Empty,
  Input,
  message,
  Select,
  Spin,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  getNotifyProviders,
  getNotifyTypes,
  getTemplateDetail,
  IotNotifierApi,
  IotNotifyConfigApi,
  IotNotifyTemplateApi,
  queryHistoryByTemplateId,
  queryTemplatesDetailByConfigId,
} from '#/api/iot/notify';
import { getFormItemComponent } from '#/components/yl-data-type-strategies/value-input';
import IconCardSelect from '#/components/yl-icon-card-select/index.vue';
import { NOTIFY_PROVIDER_ENUMS, NOTIFY_TYPE_ENUMS } from '#/enums/notify';

import NotifyHistoryList from './NotifyHistoryList.vue';

const emit = defineEmits(['success']);

// --- 状态变量 ---
const templatesLoading = ref(false); // 模板列表加载状态
const basicLoading = ref(false); // 基础数据加载状态

const notifierId = ref<string>(''); // 通知配置ID
const templateId = ref<string>(''); // 当前选中的模板ID
const selectedTemplate = ref<IotNotifyTemplateApi.NotifyTemplate | null>(null); // 选中的模板对象
const templateOptions = ref<any[]>([]); // 模板下拉选项
const context = ref<Record<string, any>>({}); // 模板变量输入上下文

const notifyType = ref<string>(''); // 通知类型
const provider = ref<string>(''); // 提供商标识
const isFromTemplate = ref(false); // 是否从模板列表打开
const typeOptions = ref<any[]>([]); // 通知类型下拉选项
const providerOptions = ref<any[]>([]); // 提供商卡片选项

const historyListRef = ref<any>(null); // 历史记录组件引用

// --- 弹窗配置 ---
const [Modal, modalApi] = useVbenModal({
  draggable: true,
  title: $t('notify.debug.title'),
  class: 'w-[1200px]',
  closeOnClickModal: false,
  showCancelButton: false,
  showConfirmButton: false,
  onCancel: () => modalApi.close(),
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<any>();
      if (data) {
        handleInitialize(data);
      }
    }
  },
});

/**
 * 执行调试发送
 */
async function handleSend() {
  if (!templateId.value) {
    message.warning($t('notify.debug.requireTemplate'));
    return;
  }

  // 变量必填项验证
  const variables = selectedTemplate.value?.varDefs || [];
  for (const v of variables) {
    if (
      v.required &&
      (context.value[v.id] === undefined ||
        context.value[v.id] === null ||
        context.value[v.id] === '')
    ) {
      message.warning($t('notify.debug.requireVar', { name: v.name || v.id }));
      return;
    }
  }

  modalApi.lock();
  try {
    await IotNotifierApi.sendNotifyWithTemplate(
      notifierId.value,
      templateId.value,
      context.value,
    );
    message.success($t('notify.debug.sendSuccess'));
    // 成功后刷新历史记录组件
    if (historyListRef.value) {
      historyListRef.value.reload();
    }
    emit('success');
  } catch (error: any) {
    console.error(error);
  } finally {
    modalApi.lock(false);
  }
}

/**
 * 加载特定配置下的模板列表
 */
async function loadTemplates(configId: string, initialTemplateId?: string) {
  templatesLoading.value = true;
  try {
    const res = await queryTemplatesDetailByConfigId(configId, {
      pageIndex: 0,
      pageSize: 99,
      paging: false,
    } as any);
    const data = Array.isArray(res) ? res : (res as any).data || [];
    templateOptions.value = data.map(
      (t: IotNotifyTemplateApi.NotifyTemplate) => ({
        label: t.name,
        value: t.id,
        ...t,
      }),
    );

    // 如果指定了初始模板ID则选中，否则默认选中第一个
    if (initialTemplateId) {
      templateId.value = initialTemplateId;
      handleTemplateChange(initialTemplateId);
    } else if (templateOptions.value.length > 0) {
      templateId.value = templateOptions.value[0].value;
      handleTemplateChange(templateId.value);
    }
  } finally {
    templatesLoading.value = false;
  }
}

/**
 * 模板切换处理
 */
async function handleTemplateChange(id: any) {
  const t = templateOptions.value.find((item) => item.value === id);
  if (t) {
    selectedTemplate.value = t;
    const newContext: Record<string, any> = {};
    // 初始化变量上下文，带入默认值
    t.varDefs?.forEach((v: IotNotifyTemplateApi.VarDef) => {
      newContext[v.id] = v.defaultValue || '';
    });
    context.value = newContext;
  } else {
    selectedTemplate.value = null;
  }
}

/**
 * 加载基础元数据（通知类型）
 */
async function loadBasicData() {
  const types = await getNotifyTypes();
  const typeEnumMap = NOTIFY_TYPE_ENUMS as any;
  typeOptions.value = types.map((t) => ({
    label: typeEnumMap[t.id]?.label || t.name,
    value: t.id,
  }));
}

/**
 * 加载提供商映射
 */
async function loadProviders(type: string) {
  const providers = await getNotifyProviders(type);
  const providerEnumMap = NOTIFY_PROVIDER_ENUMS as any;
  const typeEnumMap = NOTIFY_TYPE_ENUMS as any;
  const typeConfig = typeEnumMap[type] || {};

  providerOptions.value = providers.map((p) => {
    const pConfig = providerEnumMap[p.id] || {};
    return {
      label: pConfig.label || p.name,
      value: p.id,
      icon: pConfig.icon || typeConfig.icon,
      color: pConfig.color || typeConfig.color,
    };
  });
}

/**
 * 提供商切换（仅限手动选择模式）
 */
async function handleProviderChange(val: any) {
  provider.value = val;
  templateId.value = '';
  selectedTemplate.value = null;
  if (notifierId.value && val) {
    loadTemplates(notifierId.value);
  }
}

/**
 * 弹窗初始化入口
 */
async function handleInitialize(params: {
  notifierId: string;
  templateId?: string;
}) {
  notifierId.value = params.notifierId;
  templateId.value = params.templateId || '';
  isFromTemplate.value = !!params.templateId;
  selectedTemplate.value = null;
  context.value = {};

  basicLoading.value = true;
  try {
    await loadBasicData();
    const config = await IotNotifyConfigApi.basicCrudApis.getById(
      params.notifierId,
    );
    notifyType.value = config.type;
    provider.value = config.provider;
    await loadProviders(config.type);

    // 如果指定了模板ID，优先通过详情接口获取完整定义
    if (params.templateId) {
      const templateDetail = await getTemplateDetail(params.templateId);
      // 注意：getTemplateDetail 返回的是 TemplateInfo，我们需要构造一个选项以保持一致性
      templateId.value = params.templateId;
      selectedTemplate.value = templateDetail as any;

      // 初始化变量上下文
      const newContext: Record<string, any> = {};
      templateDetail.varDefs?.forEach((v) => {
        newContext[v.id] = v.defaultValue || '';
      });
      context.value = newContext;
    }

    await loadTemplates(params.notifierId, params.templateId);
  } finally {
    basicLoading.value = false;
  }
}

// 变量输入列定义
const varColumns: ColumnType[] = [
  {
    title: '变量名称',
    dataIndex: 'name',
    key: 'name',
    align: 'center',
    width: '20%',
  },
  {
    title: '变量标识',
    dataIndex: 'id',
    key: 'id',
    align: 'center',
    width: '20%',
  },
  { title: '变量值', dataIndex: 'value', key: 'value', align: 'center' },
];

/**
 * 查询历史记录接口封装
 */
const queryHistoryApi = (query: any) =>
  queryHistoryByTemplateId(templateId.value, query);

/**
 * 固定查询条件
 */
const fixedTerms = computed(() => [
  { column: 'notifierId', value: notifierId.value },
]);

/**
 * 将通知变量定义转换为策略输入组件所需的属性格式
 */
function getVarDefProp(v: IotNotifyTemplateApi.VarDef): ConfigPropertyMetadata {
  return {
    property: v.id,
    name: v.name,
    type: v.type,
    expands: v.expands,
  } as ConfigPropertyMetadata;
}

defineExpose({});
</script>

<template>
  <Modal>
    <Spin :spinning="basicLoading">
      <div class="flex flex-col gap-6 p-6">
        <!-- 配置信息区域 -->
        <Card
          :title="$t('notify.debug.configInfo')"
          size="small"
          :bordered="true"
          class="debug-card"
        >
          <div class="grid grid-cols-2 gap-6">
            <div class="flex items-center gap-3">
              <span
                class="w-20 shrink-0 text-right text-sm font-bold text-slate-500"
              >
                {{ $t('notify.config.fields.type') }}:
              </span>
              <Select
                v-model:value="notifyType"
                :options="typeOptions"
                disabled
                class="flex-1"
              />
            </div>
            <div class="flex items-center gap-3">
              <span
                class="w-20 shrink-0 text-right text-sm font-bold text-slate-500"
              >
                {{ $t('notify.template.title') }}:
              </span>
              <Select
                v-model:value="templateId"
                :options="templateOptions"
                class="flex-1"
                :placeholder="$t('notify.debug.templatePlaceholder')"
                @change="handleTemplateChange"
                :loading="templatesLoading"
                allow-clear
              />
            </div>
            <div class="col-span-2 flex items-start gap-3">
              <span
                class="mt-2 w-20 shrink-0 text-right text-sm font-bold text-slate-500"
              >
                {{ $t('notify.config.fields.provider') }}:
              </span>
              <div class="min-h-[80px] flex-1">
                <IconCardSelect
                  v-model:value="provider"
                  :options="providerOptions"
                  :disabled="isFromTemplate"
                  @change="handleProviderChange"
                />
              </div>
            </div>
          </div>
        </Card>

        <!-- 变量输入区域 -->
        <Card
          :title="$t('notify.debug.varInput')"
          size="small"
          :bordered="true"
          class="debug-card"
        >
          <template #extra>
            <Button
              v-if="selectedTemplate"
              type="primary"
              size="small"
              @click="handleSend"
            >
              {{ $t('notify.debug.send') }}
            </Button>
          </template>
          <template v-if="selectedTemplate">
            <Table
              :columns="varColumns"
              :data-source="selectedTemplate.varDefs"
              :pagination="false"
              size="small"
              row-key="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <span class="font-medium text-slate-700">{{
                    record.name || record.id
                  }}</span>
                  <span v-if="record.required" class="ml-1 text-rose-500">
                    *
                  </span>
                </template>
                <template v-else-if="column.key === 'id'">
                  <Tag color="blue" class="font-mono text-[10px]">
                    {{ record.id }}
                  </Tag>
                </template>
                <template v-else-if="column.key === 'value'">
                  <component
                    :is="getFormItemComponent(record.type.type as any) || Input"
                    :prop="getVarDefProp(record as any)"
                    v-model:value="context[record.id]"
                    class="w-full"
                    size="small"
                  />
                  <div
                    v-if="record.description"
                    class="mt-1 text-[10px] text-slate-400"
                  >
                    {{ record.description }}
                  </div>
                </template>
              </template>
            </Table>
            <div
              v-if="!selectedTemplate.varDefs?.length"
              class="flex flex-col items-center justify-center py-8"
            >
              <Empty
                :description="$t('notify.debug.noVar')"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />
            </div>
          </template>
          <div
            v-else
            class="flex h-[200px] flex-col items-center justify-center rounded-lg bg-slate-50/50"
          >
            <Empty
              :description="$t('notify.debug.templatePlaceholder')"
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
            />
          </div>
        </Card>

        <!-- 执行历史区域 -->
        <Card
          :title="$t('notify.debug.historyTitle')"
          size="small"
          :bordered="true"
          class="debug-card"
        >
          <NotifyHistoryList
            v-if="templateId"
            ref="historyListRef"
            :api="queryHistoryApi"
            :fixed-terms="fixedTerms"
            height="300px"
          />
          <div
            v-else
            class="flex h-[200px] flex-col items-center justify-center rounded-lg bg-slate-50/50"
          >
            <Empty
              :description="$t('notify.debug.templatePlaceholder')"
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
            />
          </div>
        </Card>
      </div>
    </Spin>
  </Modal>
</template>

<style scoped>
.debug-card {
  border-color: #e5e7eb !important; /* 减轻边框颜色 */
  box-shadow: none !important;
}

:deep(.ant-card) {
  overflow: hidden;
  border-radius: 8px;
}

:deep(.ant-card-head) {
  min-height: 44px;
  background-color: #f8fafc !important; /* 浅色 Header 背景 */
  border-bottom: 1px solid #e5e7eb !important;
}

:deep(.ant-card-head-title) {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
}

:deep(.ant-card-body) {
  padding: 16px;
  background-color: #fff;
}
</style>
