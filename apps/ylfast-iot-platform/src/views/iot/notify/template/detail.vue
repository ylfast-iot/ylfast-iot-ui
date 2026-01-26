<script setup lang="ts">
import type { ColumnType } from 'ant-design-vue/es/table';

import type { ConfigMetadata } from '#/types/config-metadata';
import type { DataType } from '#/types/data-type';

import { computed, markRaw, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { createIconifyIcon, IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { useDebounceFn } from '@vueuse/core';
import {
  Button,
  Card,
  Checkbox,
  Empty,
  Input,
  message,
  Popover,
  Select,
  Space,
  Spin,
  Table,
} from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  getNotifyProviders,
  getNotifyTypes,
  IotNotifyConfigApi,
} from '#/api/iot/notify/config';
import {
  getTemplateConfigMetadata,
  IotNotifyTemplateApi,
} from '#/api/iot/notify/template';
import {
  useYlConfigMetadataForm,
  YlConfigMetadataForm,
} from '#/components/yl-config-metadata-form';
import { getTypeDefinitionComponent } from '#/components/yl-data-type-strategies/type-definition';
import IconCardSelect from '#/components/yl-icon-card-select/index.vue';
import { YlMarkdown } from '#/components/yl-markdown';
import { DATA_TYPE_ENUM, DATA_TYPE_OPTIONS } from '#/enums/data-type';
import { NOTIFY_PROVIDER_ENUMS, NOTIFY_TYPE_ENUMS } from '#/enums/notify';

const router = useRouter();
const route = useRoute();
const isEdit = computed(() => !!route.query.id); // 是否为编辑模式
const loading = ref(false); // 页面加载状态
const metadataLoading = ref(false); // 元数据加载状态

// 通知模板表单注册
const [
  registerTemplateForm,
  {
    setContextToConfigMetadataValues,
    validate: validateTemplate,
    setFieldsValue: setTemplateFieldsValue,
  },
] = useYlConfigMetadataForm({
  hideRootHeader: true,
  hideNestedHeader: true,
  layout: 'vertical',
});

const typeOptions = ref<any[]>([]); // 通知类型选项
const providerOptions = ref<any[]>([]); // 提供商选项
const configOptions = ref<any[]>([]); // 通知配置选项
const metadata = ref<ConfigMetadata>(); // 提供商对应的模板元数据
const selectedConfig = ref<IotNotifyConfigApi.NotifyConfig>(); // 选中的通知配置
const selectedProviderId = ref<string>(); // 选中的提供商ID
const varDefs = ref<IotNotifyTemplateApi.VarDef[]>([]); // 模板变量定义列表

// --- 基础信息表单配置 (Vben Form) ---
const [BasicForm, formApi] = useVbenForm({
  wrapperClass: 'grid grid-cols-2 gap-4',
  layout: 'vertical',
  showDefaultActions: false,
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelClass: 'font-bold',
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('notify.template.fields.name'),
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      component: 'Select',
      fieldName: 'type',
      label: $t('notify.template.fields.type'),
      rules: 'required',
      formItemClass: 'col-span-2',
      componentProps: {
        options: typeOptions,
        placeholder: $t('common.placeholder.select'),
        onChange: (val: string) => handleTypeChange(val),
      },
    },
    {
      component: markRaw(IconCardSelect),
      fieldName: 'provider',
      label: $t('notify.template.fields.provider'),
      rules: 'required',
      formItemClass: 'col-span-2',
      modelPropName: 'value',
      dependencies: {
        show: (values) => !!values.type,
        triggerFields: ['type'],
      },
      componentProps: {
        options: providerOptions,
        onChange: (val: string) => handleProviderChange(val),
      },
    },
    {
      component: 'Select',
      fieldName: 'configId',
      label: $t('notify.template.fields.config'),
      rules: 'required',
      formItemClass: 'col-span-2',
      dependencies: {
        show: (values) => !!values.provider,
        triggerFields: ['provider'],
      },
      componentProps: {
        options: configOptions,
        placeholder: $t('common.placeholder.select'),
        showSearch: true,
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
        onChange: (val: string) => handleConfigChange(val),
      },
    },
    {
      fieldName: 'template',
      component: 'YlConfigMetadataForm',
      label: '',
      formItemClass: 'col-span-2',
      renderComponentContent: () => ({
        default: () => null,
      }),
    },
    {
      component: 'Textarea',
      fieldName: 'description',
      componentProps: {
        rows: 4,
      },
      label: $t('notify.template.fields.description'),
      formItemClass: 'col-span-2',
    },
  ],
});

// 图标定义
const SaveIcon = createIconifyIcon('lucide:save');
const BackIcon = createIconifyIcon('lucide:arrow-left');
const PlusIcon = createIconifyIcon('lucide:plus');
const DeleteIcon = createIconifyIcon('lucide:trash-2');

// 初始化数据加载
onMounted(async () => {
  loading.value = true;
  try {
    // 加载通知类型
    const types = await getNotifyTypes();
    const typeEnumMap = NOTIFY_TYPE_ENUMS as any;
    typeOptions.value = types.map((t) => {
      const config = typeEnumMap[t.id] || typeEnumMap[t.id.toLowerCase()] || {};
      return {
        label: config.label || t.name,
        value: t.id,
      };
    });

    // 如果是编辑模式，加载已有数据
    if (isEdit.value) {
      const data = await IotNotifyTemplateApi.basicCrudApis.getById(
        route.query.id as string,
      );
      formApi.setValues({
        name: data.name,
        type: data.type,
        provider: data.provider,
        configId: data.configId,
        description: data.description || '',
      });
      selectedProviderId.value = data.provider;
      varDefs.value = (data.varDefs || []).map((v: any) => ({
        ...v,
        type: typeof v.type === 'string' ? { type: v.type } : v.type,
      }));

      await loadProviders(data.type);
      await loadConfigs(data.type, data.provider);
      await loadMetadata(data.type, data.provider);

      // 元数据加载后，设置模板配置表单的值
      setTimeout(() => {
        setTemplateFieldsValue(data.template || {});
      }, 500);
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    loading.value = false;
  }
});

/**
 * 加载提供商
 */
async function loadProviders(type: string) {
  const providers = await getNotifyProviders(type);
  const providerEnumMap = NOTIFY_PROVIDER_ENUMS as any;
  const typeEnumMap = NOTIFY_TYPE_ENUMS as any;
  const typeConfig = typeEnumMap[type] || typeEnumMap[type.toLowerCase()] || {};

  providerOptions.value = providers.map((p) => {
    const pConfig =
      providerEnumMap[p.id] || providerEnumMap[p.id.toLowerCase()] || {};
    return {
      label: pConfig.label || p.name,
      value: p.id,
      icon: pConfig.icon || typeConfig.icon,
      color: pConfig.color || typeConfig.color,
    };
  });
}

/**
 * 加载通知配置列表
 */
async function loadConfigs(type: string, provider: string) {
  const configs = await IotNotifyConfigApi.basicCrudApis.postQuery({
    pageIndex: 0,
    pageSize: 999,
    paging: false,
    terms: [
      { column: 'type', value: type },
      { column: 'provider', value: provider },
    ],
  });
  configOptions.value = configs.data.map((c: any) => ({
    label: c.name,
    value: c.id,
    ...c,
  }));
}

/**
 * 处理类型切换
 */
async function handleTypeChange(newType: string) {
  providerOptions.value = [];
  configOptions.value = [];
  formApi.setFieldValue('provider', undefined);
  formApi.setFieldValue('configId', undefined);
  selectedProviderId.value = undefined;
  metadata.value = undefined;
  if (newType) {
    await loadProviders(newType);
    // 自动选中第一个提供商
    if (providerOptions.value.length > 0) {
      const firstProvider = providerOptions.value[0].value;
      formApi.setFieldValue('provider', firstProvider);
      handleProviderChange(firstProvider);
    }
  }
}

/**
 * 处理提供商切换
 */
async function handleProviderChange(newProvider: string) {
  configOptions.value = [];
  formApi.setFieldValue('configId', undefined);
  selectedProviderId.value = newProvider;
  metadata.value = undefined;
  const values = await formApi.getValues();
  if (newProvider && values.type) {
    await loadConfigs(values.type, newProvider);
    await loadMetadata(values.type, newProvider);
  }
}

/**
 * 处理配置切换
 */
async function handleConfigChange(configId: string) {
  const config = configOptions.value.find((c) => c.value === configId);
  if (config) {
    selectedConfig.value = config;
    await loadMetadata(config.type, config.provider);

    // 设置上下文信息到配置model中，通常和后端的configMetadata配置配合使用，最主要用于做联动
    setContextToConfigMetadataValues({
      configId: config.id,
      provider: config.provider,
    });
  } else {
    selectedConfig.value = undefined;
    metadata.value = undefined;
  }
}

/**
 * 自动提取模板中的变量
 */
const handleTemplateChange = useDebounceFn((values: any) => {
  const text = JSON.stringify(values);
  const regex = /\$\{([^}]+)\}/g;
  const matches = new Set<string>();
  let match;
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      matches.add(match[1]);
    }
  }

  // 1. 识别并移除已经不在模板中且未被用户深度修改的“自动变量”
  varDefs.value = varDefs.value.filter((v) => {
    // 如果变量还在模板中，保留
    if (matches.has(v.id)) return true;

    // 如果变量不在模板中，检查它是否被修改过
    // 自动生成的默认特征：id 等于 name，类型为 STRING，无默认值，且必填
    const isAutoGenerated =
      v.id === v.name &&
      v.type?.type === DATA_TYPE_ENUM.STRING.value &&
      !v.defaultValue &&
      v.required;

    // 如果是用户手动修改过的（或不是自动生成的碎片），即使暂时不在模板中也保留
    return !isAutoGenerated;
  });

  // 2. 新增模板中出现但当前变量列表中没有的变量
  const currentVars = new Set(varDefs.value.map((v) => v.id));
  let hasNew = false;
  matches.forEach((varId) => {
    if (!currentVars.has(varId)) {
      varDefs.value.push({
        id: varId,
        name: varId,
        required: true,
        type: { type: DATA_TYPE_ENUM.STRING.value },
        defaultValue: '',
      });
      hasNew = true;
    }
  });

  if (hasNew) {
    // 只有真正新增了才提示
    message.info(
      $t('notify.template.vars.extractMsg', { count: matches.size }),
    );
  }
}, 500);

/**
 * 加载提供商元数据
 */
async function loadMetadata(type: string, provider: string) {
  metadataLoading.value = true;
  try {
    metadata.value = await getTemplateConfigMetadata(type, provider);
  } catch (error) {
    console.error('Failed to load metadata:', error);
  } finally {
    metadataLoading.value = false;
  }
}

// --- 变量定义处理 ---

/**
 * 判断数据类型是否包含额外定义配置
 */
function hasDefinition(type: DataType) {
  return !!getTypeDefinitionComponent(type);
}

/**
 * 处理变量类型切换
 */
function handleVarTypeChange(record: any) {
  // 切换类型时重置扩展配置
  record.expands = {};
  const type = record.type.type;
  // 特殊类型初始化逻辑
  if (type === 'ENUM') {
    record.type.enums = [];
  } else if (type === 'ARRAY') {
    record.type.elementType = { type: 'STRING' };
  }
}

/**
 * 新增变量建议行
 */
function addVar() {
  varDefs.value.push({
    id: '',
    name: '',
    required: false,
    type: { type: DATA_TYPE_ENUM.STRING.value },
    defaultValue: '',
  });
}

/**
 * 移除变量建议行
 */
function removeVar(index: number) {
  varDefs.value.splice(index, 1);
}

// --- 保存逻辑 ---

/**
 * 执行保存（新增/更新）
 */
async function handleSave() {
  try {
    const { valid: basicValid } = await formApi.validate();
    if (!basicValid) return;

    const basicValues = await formApi.getValues();

    let templateData = {};
    if (metadata.value) {
      templateData = await validateTemplate();
    }

    loading.value = true;

    const postData = {
      ...basicValues,
      type: selectedConfig.value?.type,
      provider: selectedConfig.value?.provider,
      template: templateData,
      varDefs: varDefs.value,
    };

    if (isEdit.value) {
      await IotNotifyTemplateApi.basicCrudApis.putUpdate(
        route.query.id as string,
        postData as any,
      );
      message.success($t('common.updateSuccess'));
    } else {
      await IotNotifyTemplateApi.basicCrudApis.postAdd(postData as any);
      message.success($t('common.createSuccess'));
    }
    router.back();
  } catch (error) {
    console.error('Save failed:', error);
  } finally {
    loading.value = false;
  }
}

function handleBack() {
  router.back();
}

/**
 * 简单的URL检查工具
 */
const isUrl = (str: string) => {
  return /^(?:http|https):\/\//.test(str);
};

// 变量定义表格列配置
const varDefColumns: ColumnType[] = [
  {
    title: $t('notify.template.vars.id'),
    dataIndex: 'id',
    key: 'id',
    width: '10%',
  },
  {
    title: $t('notify.template.vars.name'),
    dataIndex: 'name',
    key: 'name',
    width: '15%',
  },
  {
    title: $t('notify.template.vars.type'),
    dataIndex: 'type',
    key: 'type',
    width: '15%',
  },
  {
    title: $t('notify.template.vars.defaultValue'),
    dataIndex: 'defaultValue',
    key: 'defaultValue',
    width: '20%',
  },
  {
    title: $t('notify.template.vars.required'),
    dataIndex: 'required',
    key: 'required',
    width: '10%',
    align: 'center',
  },
  {
    title: $t('common.action.label'),
    key: 'action',
    width: '10%',
    align: 'center',
  },
];

const varTypeOptions = DATA_TYPE_OPTIONS;
</script>

<template>
  <Page auto-content-height>
    <template #title>
      <div class="flex items-center gap-2">
        <Button type="link" @click="handleBack">
          <template #icon><BackIcon /></template>
        </Button>
        <span class="text-lg font-medium">{{
          isEdit ? $t('common.action.edit') : $t('notify.template.list.add')
        }}</span>
      </div>
    </template>

    <template #extra>
      <Space>
        <Button @click="handleBack">{{ $t('common.action.cancel') }}</Button>
        <Button type="primary" :loading="loading" @click="handleSave">
          <template #icon><SaveIcon /></template>
          {{ $t('common.action.save') }}
        </Button>
      </Space>
    </template>

    <div class="flex h-full gap-4 overflow-hidden p-4">
      <!-- 左侧：表单配置 -->
      <div class="flex-1 overflow-y-auto">
        <!-- 基础信息 -->
        <Card
          :title="$t('notify.template.save.basicInfo')"
          class="mb-4 shadow-sm"
        >
          <BasicForm>
            <template #template>
              <div v-if="metadata" class="col-span-2 mt-4 w-full">
                <div
                  class="mb-2 w-full font-bold text-slate-700 dark:text-gray-200"
                >
                  {{ $t('notify.template.save.templateInfo') }}
                </div>
                <Spin :spinning="metadataLoading" class="w-full">
                  <!-- 动态加载各提供商特有的模板配置表单 -->
                  <YlConfigMetadataForm
                    :metadata="metadata"
                    @register="registerTemplateForm"
                    class="w-full"
                    @change="handleTemplateChange"
                  />
                </Spin>
              </div>
              <div
                v-else-if="!metadataLoading"
                class="col-span-2 mt-4 flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 transition-colors dark:border-gray-800 dark:bg-gray-900/20"
              >
                <Empty
                  :description="
                    selectedProviderId
                      ? $t('notify.template.vars.noMetadata')
                      : $t('notify.template.vars.noProvider')
                  "
                  :image="Empty.PRESENTED_IMAGE_SIMPLE"
                />
              </div>
            </template>
          </BasicForm>
        </Card>

        <!-- 变量定义列表 -->
        <Card :title="$t('notify.template.save.varDefInfo')" class="shadow-sm">
          <template #extra>
            <Button type="link" size="small" @click="addVar">
              <template #icon><PlusIcon /></template>
              {{ $t('notify.template.vars.add') }}
            </Button>
          </template>

          <Table
            :columns="varDefColumns"
            :data-source="varDefs"
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'id'">
                <Input
                  v-model:value="record.id"
                  :placeholder="$t('notify.template.vars.idPlaceholder')"
                  size="small"
                />
              </template>
              <template v-else-if="column.key === 'name'">
                <Input
                  v-model:value="record.name"
                  :placeholder="$t('notify.template.vars.namePlaceholder')"
                  size="small"
                />
              </template>
              <template v-else-if="column.key === 'type'">
                <div class="flex items-center gap-1">
                  <Select
                    v-model:value="record.type.type"
                    :options="varTypeOptions"
                    class="flex-1"
                    size="small"
                    @change="handleVarTypeChange(record)"
                  />
                  <!-- 如果类型支持高级定义，显示设置按钮 -->
                  <Popover
                    v-if="hasDefinition(record.type.type)"
                    trigger="click"
                    placement="bottomRight"
                  >
                    <template #content>
                      <div class="w-[450px] p-2">
                        <component
                          :is="getTypeDefinitionComponent(record.type.type)"
                          v-model:value="record.type"
                        />
                      </div>
                    </template>
                    <Button
                      size="small"
                      type="link"
                      class="flex items-center justify-center p-0"
                    >
                      <template #icon>
                        <IconifyIcon icon="lucide:settings" class="size-4" />
                      </template>
                    </Button>
                  </Popover>
                </div>
              </template>
              <template v-else-if="column.key === 'defaultValue'">
                <Input
                  v-model:value="record.defaultValue"
                  :placeholder="$t('notify.template.vars.defaultPlaceholder')"
                  size="small"
                />
              </template>
              <template v-else-if="column.key === 'required'">
                <Checkbox v-model:checked="record.required" />
              </template>
              <template v-else-if="column.key === 'action'">
                <Button
                  type="link"
                  danger
                  size="small"
                  @click="removeVar(index)"
                >
                  <template #icon><DeleteIcon /></template>
                </Button>
              </template>
            </template>
          </Table>
        </Card>
      </div>

      <!-- 右侧：提供商说明文档 -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <Card
          :title="$t('notify.template.save.docInfo')"
          class="flex h-full flex-col shadow-sm"
        >
          <Spin
            :spinning="metadataLoading"
            class="flex-1 overflow-hidden"
            wrapper-class-name="h-full flex flex-col"
          >
            <div
              v-if="metadata?.document"
              class="h-full flex-1 overflow-y-auto"
            >
              <iframe
                v-if="isUrl(metadata.document)"
                :src="metadata.document"
                class="h-full w-full border-0"
              ></iframe>
              <div v-else class="h-full w-full">
                <YlMarkdown
                  :model-value="metadata.document"
                  display-mode="flat"
                  mode="preview"
                  height="100%"
                />
              </div>
            </div>
            <div
              v-else-if="!metadataLoading"
              class="flex h-full items-center justify-center font-medium text-slate-400"
            >
              {{
                selectedProviderId
                  ? $t('notify.template.vars.noDoc')
                  : $t('notify.template.vars.noProvider')
              }}
            </div>
          </Spin>
        </Card>
      </div>
    </div>
  </Page>
</template>

<style scoped>
:deep(.ant-card) {
  display: flex;
  flex-direction: column;
}

:deep(.ant-card-body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}

:deep(.ant-spin-nested-loading),
:deep(.ant-spin-container) {
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
}
</style>
