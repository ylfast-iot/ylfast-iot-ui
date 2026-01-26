<script setup lang="ts">
import type { ConfigMetadata } from '#/types/config-metadata';

import { computed, markRaw, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Card, Empty, message, Space, Spin } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  getNotifyConfigMetadata,
  getNotifyProviders,
  getNotifyTypes,
  IotNotifyConfigApi,
} from '#/api/iot/notify/config';
import {
  useYlConfigMetadataForm,
  YlConfigMetadataForm,
} from '#/components/yl-config-metadata-form';
import IconCardSelect from '#/components/yl-icon-card-select/index.vue';
import { YlMarkdown } from '#/components/yl-markdown';
import { NOTIFY_PROVIDER_ENUMS, NOTIFY_TYPE_ENUMS } from '#/enums/notify';

const router = useRouter();
const route = useRoute();
const isEdit = computed(() => !!route.query.id); // 是否为编辑模式
const loading = ref(false); // 页面加载状态
const metadataLoading = ref(false); // 元数据加载状态

// 配置表单注册
const [registerConfigForm, { validate, setFieldsValue }] =
  useYlConfigMetadataForm({
    hideRootHeader: true,
    hideNestedHeader: true,
    layout: 'vertical',
  });

const typeOptions = ref<any[]>([]); // 通知类型选项
const providerOptions = ref<any[]>([]); // 提供商选项
const metadata = ref<ConfigMetadata>(); // 提供商对应的配置元数据
const currentProvider = ref<string>(); // 当前选中的提供商ID

// --- 基础信息表单配置 (Vben Form) ---
const [BasicForm, formApi] = useVbenForm({
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
      label: $t('notify.config.fields.name'),
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      component: 'Select',
      fieldName: 'type',
      label: $t('notify.config.fields.type'),
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
      label: $t('notify.config.fields.provider'),
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
      fieldName: 'configuration',
      component: 'YlConfigMetadataForm',
      label: '',
      formItemClass: 'col-span-2',
      componentProps: {
        onRegister: registerConfigForm,
      },
      renderComponentContent: () => ({
        default: () => null, // 元数据通过内部组件处理
      }),
    },
    {
      component: 'Textarea',
      fieldName: 'description',
      componentProps: {
        rows: 4,
      },
      label: $t('notify.config.fields.description'),
      formItemClass: 'col-span-2',
    },
  ],
});

// 图标定义
const SaveIcon = createIconifyIcon('lucide:save');
const BackIcon = createIconifyIcon('lucide:arrow-left');

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
        icon: config.icon,
        color: config.color,
      };
    });

    // 如果是编辑模式，加载已有数据
    if (isEdit.value) {
      const data = await IotNotifyConfigApi.basicCrudApis.getById(
        route.query.id as string,
      );
      formApi.setValues({
        name: data.name,
        type: data.type,
        provider: data.provider,
        description: data.description || '',
      });
      currentProvider.value = data.provider;
      // 加载提供商列表
      await loadProviders(data.type);
      // 加载元数据
      await loadMetadata(data.type, data.provider);
      // 元数据加载后，设置具体配置项的值
      setTimeout(() => {
        setFieldsValue(data.configuration || {});
      }, 500);
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    loading.value = false;
  }
});

/**
 * 加载特定类型下的提供商
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
      color: pConfig.color || typeConfig.color, // 携带类型颜色以保证UI一致性
    };
  });
}

/**
 * 加载提供商配置项元数据
 */
async function loadMetadata(type: string, provider: string) {
  metadataLoading.value = true;
  try {
    metadata.value = await getNotifyConfigMetadata(type, provider);
  } catch (error) {
    console.error('Failed to load metadata:', error);
  } finally {
    metadataLoading.value = false;
  }
}

/**
 * 处理类型切换符
 */
async function handleTypeChange(newType: string) {
  if (newType) {
    await loadProviders(newType);
    // 自动选中第一个提供商
    if (providerOptions.value.length > 0) {
      const firstProvider = providerOptions.value[0].value;
      formApi.setFieldValue('provider', firstProvider);
      handleProviderChange(firstProvider);
    } else {
      formApi.setFieldValue('provider', undefined);
      currentProvider.value = undefined;
      metadata.value = undefined;
    }
  } else {
    providerOptions.value = [];
    formApi.setFieldValue('provider', undefined);
    currentProvider.value = undefined;
    metadata.value = undefined;
  }
}

/**
 * 处理提供商切换
 */
async function handleProviderChange(newProvider: string) {
  currentProvider.value = newProvider;
  const values = await formApi.getValues();
  if (newProvider && values.type) {
    await loadMetadata(values.type, newProvider);
  } else {
    metadata.value = undefined;
  }
}

// --- 保存处理 ---

/**
 * 执行保存（新建/更新）
 */
async function handleSave() {
  try {
    const { valid: basicValid } = await formApi.validate();
    if (!basicValid) return;

    const basicValues = await formApi.getValues();

    let configData = {};
    if (metadata.value) {
      configData = await validate();
    }

    loading.value = true;

    const postData = {
      ...basicValues,
      configuration: configData,
    };

    if (isEdit.value) {
      await IotNotifyConfigApi.basicCrudApis.putUpdate(
        route.query.id as string,
        postData,
      );
      message.success($t('common.updateSuccess'));
    } else {
      await IotNotifyConfigApi.basicCrudApis.postAdd(postData as any);
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
</script>

<template>
  <Page auto-content-height>
    <template #title>
      <div class="flex items-center gap-2">
        <Button type="link" @click="handleBack">
          <template #icon><BackIcon /></template>
        </Button>
        <span class="text-lg font-medium">
          {{ isEdit ? $t('common.action.edit') : $t('notify.config.list.add') }}
        </span>
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
        <Card
          :title="$t('notify.config.save.basicInfo')"
          class="mb-4 shadow-sm"
        >
          <BasicForm>
            <template #configuration>
              <div v-if="metadata" class="col-span-2 mt-4 w-full">
                <div
                  class="mb-2 w-full font-bold text-slate-700 dark:text-gray-200"
                >
                  {{ $t('notify.config.save.configInfo') }}
                </div>
                <Spin :spinning="metadataLoading" class="w-full">
                  <YlConfigMetadataForm
                    :metadata="metadata"
                    @register="registerConfigForm"
                    class="w-full"
                  />
                </Spin>
              </div>
              <div
                v-else-if="!metadataLoading"
                class="col-span-2 mt-4 flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 transition-colors dark:border-gray-800 dark:bg-gray-900/20"
              >
                <Empty
                  :description="
                    currentProvider
                      ? $t('notify.config.save.noConfig')
                      : $t('notify.config.save.noProvider')
                  "
                  :image="Empty.PRESENTED_IMAGE_SIMPLE"
                />
              </div>
            </template>
          </BasicForm>
        </Card>
      </div>

      <!-- 右侧：说明文档 -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <Card
          :title="$t('notify.config.save.docInfo')"
          class="flex h-full flex-col shadow-sm"
        >
          <div v-if="metadata?.document" class="flex-1 overflow-y-auto">
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
            v-else
            class="flex h-full items-center justify-center font-medium text-slate-400"
          >
            {{
              currentProvider
                ? $t('notify.config.save.noDoc')
                : $t('notify.config.save.selectProvider')
            }}
          </div>
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
</style>
