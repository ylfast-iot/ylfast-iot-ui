<script setup lang="ts">
import type { AlarmLevelCardOption } from './data';

import type { RuleEngineAlarmConfigApi } from '#/api/iot';

import { computed, markRaw, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button,
  Empty,
  message,
  Space,
  Spin,
  TabPane,
  Tabs,
} from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { RuleEngineAlarmConfigApi as AlarmConfigApi } from '#/api/iot';
import { YlCardSelect } from '#/components/yl-card-select';

import {
  fetchAlarmLevelCardOptions,
  fetchAlarmTargetTypeSelectOptions,
} from './data';

type DetailTabKey = 'basic' | 'record' | 'scene';

const router = useRouter();
const route = useRoute();

const BackIcon = createIconifyIcon('lucide:arrow-left');
const SaveIcon = createIconifyIcon('lucide:save');

const activeTab = ref<DetailTabKey>('basic');
const currentId = ref<string>((route.query.id as string) || '');
const levelOptions = ref<AlarmLevelCardOption[]>([]);
const loading = ref(false);

const isEdit = computed(() => !!currentId.value);

const [BasicForm, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelClass: 'font-medium',
  },
  layout: 'vertical',
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('common.placeholder.input'),
      },
      fieldName: 'name',
      formItemClass: 'col-span-1',
      label: $t('alarm.config.fields.name'),
      rules: 'required',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: fetchAlarmTargetTypeSelectOptions,
        placeholder: $t('common.placeholder.select'),
      },
      fieldName: 'targetType',
      formItemClass: 'col-span-1',
      label: $t('alarm.config.fields.targetType'),
      rules: 'required',
    },
    {
      component: markRaw(YlCardSelect),
      componentProps: {
        class: 'alarm-level-card-select',
        columns: 5,
        options: levelOptions.value,
      },
      fieldName: 'level',
      formItemClass: 'col-span-2',
      label: $t('alarm.config.fields.level'),
      modelPropName: 'value',
      rules: 'required',
    },
    {
      component: 'Textarea',
      componentProps: {
        maxlength: 200,
        placeholder: $t('common.placeholder.input'),
        rows: 4,
        showCount: true,
      },
      fieldName: 'description',
      formItemClass: 'col-span-2',
      label: $t('alarm.config.fields.description'),
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 gap-x-6 lg:grid-cols-2',
});

/**
 * 返回列表页。
 */
function handleBack() {
  router.push('/iot/alarm/config');
}

/**
 * 加载告警级别卡片选项。
 */
async function loadLevelOptions() {
  levelOptions.value = await fetchAlarmLevelCardOptions();

  formApi.updateSchema([
    {
      componentProps: {
        class: 'alarm-level-card-select',
        columns: 5,
        options: levelOptions.value,
      },
      fieldName: 'level',
    },
  ]);
}

/**
 * 加载编辑详情数据。
 */
async function loadDetail() {
  if (!currentId.value) {
    await formApi.resetForm();
    return;
  }

  const data = await AlarmConfigApi.basicCrudApis.getById(currentId.value);

  formApi.setValues({
    description: data.description || '',
    level: data.level,
    name: data.name,
    targetType: data.targetType,
  });
}

/**
 * 初始化页面数据。
 */
async function initPage() {
  loading.value = true;

  try {
    await loadLevelOptions();
    await loadDetail();
  } catch (error) {
    console.error('Failed to initialize alarm config detail page:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void initPage();
});

/**
 * 切换标签页。
 */
function handleTabChange(key: number | string) {
  const tabKey = String(key);

  if (!isEdit.value && tabKey !== 'basic') {
    message.warning($t('alarm.config.detail.messages.saveBeforeMoreTabs'));
    activeTab.value = 'basic';
    return;
  }

  activeTab.value = tabKey as DetailTabKey;
}

/**
 * 保存基础配置。
 */
async function handleSave() {
  try {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    const values = await formApi.getValues();
    const payload: Partial<RuleEngineAlarmConfigApi.AlarmConfigEntity> = {
      description: values.description || '',
      level: values.level,
      name: values.name,
      targetType: values.targetType,
    };

    loading.value = true;

    if (currentId.value) {
      await AlarmConfigApi.basicCrudApis.patchSave({
        ...payload,
        id: currentId.value,
      });
      message.success($t('common.updateSuccess'));
      return;
    }

    const created = await AlarmConfigApi.basicCrudApis.postAdd(
      payload as RuleEngineAlarmConfigApi.AlarmConfigEntity,
    );

    currentId.value = created.id;
    message.success($t('common.createSuccess'));

    await router.replace({
      path: '/iot/alarm/config/detail',
      query: { id: created.id },
    });
  } catch (error) {
    console.error('Failed to save alarm config:', error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page auto-content-height class="h-full">
    <template #title>
      <div class="flex items-center gap-2">
        <Button type="link" @click="handleBack">
          <template #icon><BackIcon /></template>
        </Button>
        <span class="text-lg font-medium">
          {{
            isEdit
              ? $t('alarm.config.detail.title.edit')
              : $t('alarm.config.detail.title.add')
          }}
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

    <div class="flex h-full min-h-0 flex-col p-4">
      <div
        class="flex min-h-0 flex-1 flex-col rounded-md border border-border bg-background px-5 py-4"
      >
        <Tabs
          v-model:active-key="activeTab"
          :animated="false"
          class="flex min-h-0 flex-1 flex-col [&_.ant-tabs-content-holder]:min-h-0 [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-content-holder_.ant-tabs-content]:h-full [&_.ant-tabs-content-holder_.ant-tabs-content]:min-h-0 [&_.ant-tabs-content-holder_.ant-tabs-tabpane]:h-full"
          @change="handleTabChange"
        >
          <TabPane key="basic" :tab="$t('alarm.config.detail.tabs.basic')">
            <Spin :spinning="loading" wrapper-class-name="h-full">
              <div class="h-full overflow-y-auto pt-4">
                <BasicForm />
              </div>
            </Spin>
          </TabPane>

          <TabPane key="scene" :tab="$t('alarm.config.detail.tabs.scene')">
            <div
              class="flex h-full min-h-0 items-center justify-center rounded-md border border-dashed border-border bg-background"
            >
              <Empty
                :description="$t('alarm.config.detail.placeholders.scene')"
              />
            </div>
          </TabPane>

          <TabPane key="record" :tab="$t('alarm.config.detail.tabs.record')">
            <div
              class="flex h-full min-h-0 items-center justify-center rounded-md border border-dashed border-border bg-background"
            >
              <Empty
                :description="$t('alarm.config.detail.placeholders.record')"
              />
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  </Page>
</template>

<style scoped>
:deep(.alarm-level-card-select) {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

@media (max-width: 1280px) {
  :deep(.alarm-level-card-select) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  :deep(.alarm-level-card-select) {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>
