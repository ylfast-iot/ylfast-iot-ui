<script setup lang="ts">
import type { ApplicationApi } from '#/api/system/application';

import { computed, markRaw, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Alert,
  Button,
  Card,
  message,
  Space,
  Spin,
  TabPane,
  Tabs,
} from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  applicationCrudApis,
  queryApplicationProviders,
  saveApplicationAndGrant,
} from '#/api/system/application';
import IconCardSelect from '#/components/yl-icon-card-select/index.vue';
import { getProviderConfig } from '#/enums/application';
import ImageUpload from '#/views/system/config/components/ImageUpload.vue';

import { integrationStrategies } from './schemas/integration-strategies';

// Icons
const SaveIcon = createIconifyIcon('lucide:save');
const BackIcon = createIconifyIcon('lucide:arrow-left');
const AppIcon = createIconifyIcon('lucide:toggle-left');

const route = useRoute();
const router = useRouter();

const type = computed(() => route.query.type as 'add' | 'edit');
const providerId = computed(() => route.query.provider as string);
const appId = computed(() => route.query.id as string);

const loading = ref(false);
const submitting = ref(false);

const formData = ref<Partial<ApplicationApi.ApplicationEntity>>({});
const providerInfo = ref<ApplicationApi.ApplicationProviderInfo | null>(null);

const activeTab = ref<string>('');

const providerOptions = ref<any[]>([]);

// Left basic info form
const [BasicForm, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  commonConfig: {
    componentProps: { class: 'w-full' },
  },
  schema: [
    {
      fieldName: 'name',
      label: '应用名称',
      component: 'Input',
      rules: 'required',
      componentProps: { placeholder: '请输入应用名称' },
    },
    {
      fieldName: 'provider',
      label: '应用',
      component: markRaw(IconCardSelect),
      modelPropName: 'value',
      rules: 'required',
      componentProps: {
        options: providerOptions,
        disabled: true, // Fixed as per user request
      },
    },
    {
      fieldName: 'code',
      label: '应用编码',
      component: 'Input',
      componentProps: { placeholder: '可为空，系统自动生成或手动指定' },
    },
    {
      fieldName: 'logoUrl',
      label: 'Logo/图标',
      component: markRaw(ImageUpload),
      modelPropName: 'value',
      componentProps: {
        bucketName: 'public',
        dir: 'application',
        width: '80px',
      },
    },
    {
      fieldName: 'description',
      label: '描述说明',
      component: 'Textarea',
      componentProps: { rows: 3 },
    },
    {
      fieldName: 'integrationModes',
      label: '集成方式 (功能勾选)',
      component: 'CheckboxGroup',
      componentProps: {
        options: [], // Dynamically filled
        onChange: (checkedValues: string[]) => {
          selectedModes.value = checkedValues || [];
          if (
            selectedModes.value.length > 0 &&
            !selectedModes.value.includes(activeTab.value)
          ) {
            activeTab.value = selectedModes.value[0] || '';
          }
        },
      },
      defaultValue: [],
    },
  ],
});

// Sub-forms for configurations initialized via Strategy Pattern
const [SsoForm, ssoFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  commonConfig: { componentProps: { class: 'w-full' } },
  schema: [],
});

const [ApiClientForm, apiClientFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  commonConfig: { componentProps: { class: 'w-full' } },
  schema: integrationStrategies.apiClient.buildSchema({}),
});

const [ApiServerForm, apiServerFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  commonConfig: { componentProps: { class: 'w-full' } },
  schema: integrationStrategies.apiServer.buildSchema({}),
});

const [PageForm, pageFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  commonConfig: { componentProps: { class: 'w-full' } },
  schema: integrationStrategies.page.buildSchema({}),
});

const selectedModes = ref<string[]>([]);
const availableModes = ref<{ label: string; value: string }[]>([]);

const modeLabels: Record<string, string> = {
  ssoClient: 'SSO单点登录',
  apiClient: 'API客户端',
  apiServer: 'API服务端',
  page: '页面集成',
};

onMounted(async () => {
  try {
    loading.value = true;
    const providers = await queryApplicationProviders();
    let currentProviderId = '';

    let res: any = null;

    if (type.value === 'edit' && appId.value) {
      res = await applicationCrudApis.getById(appId.value);
      if (res) {
        formData.value = res;
        currentProviderId = res.provider;
      }
    } else if (type.value === 'add' && providerId.value) {
      currentProviderId = providerId.value;
      formData.value.provider = providerId.value;
    } else {
      message.error($t('common.invalidParams', '参数错误'));
      handleCancel();
      return;
    }

    if (currentProviderId && providers) {
      // Build Provider Options for IconCardSelect
      providerOptions.value = providers.map((p) => {
        const config = getProviderConfig(p.provider) || {};
        return {
          label: p.name,
          value: p.provider,
          icon: (config as any).icon || 'lucide:layout-grid',
          color: (config as any).color || 'bg-blue-500',
        };
      });

      providerInfo.value =
        providers.find((p) => p.provider === currentProviderId) || null;
      if (providerInfo.value) {
        // Setup SSO Form Schema specific to this provider via Strategy Pattern
        const dynamicSsoSchema = integrationStrategies.ssoClient.buildSchema({
          provider: currentProviderId,
        });
        ssoFormApi.setState({ schema: dynamicSsoSchema });

        availableModes.value = (providerInfo.value.integrationModes || []).map(
          (m) => ({
            label: modeLabels[m] || m,
            value: m,
          }),
        );

        formApi.updateSchema([
          {
            fieldName: 'integrationModes',
            componentProps: { options: availableModes.value },
          },
        ]);
      }
    }

    // Set values AFTER schema has been populated
    if (type.value === 'edit' && res) {
      // Load default values into forms
      const modes = (res.integrationModes || []).map((m: any) => m.value || m);

      await formApi.setValues({
        name: res.name,
        provider: currentProviderId,
        code: res.code,
        logoUrl: res.logoUrl,
        description: res.description,
        integrationModes: modes,
      });
      selectedModes.value = modes;
      if (modes.length > 0) activeTab.value = modes[0] || '';

      if (res.sso) ssoFormApi.setValues(res.sso);
      if (res.apiClient) apiClientFormApi.setValues(res.apiClient);
      if (res.apiServer) {
        const apiServerData = res.apiServer || {};
        apiServerFormApi.setValues({ ...apiServerData, clientId: res.id });
      }
      if (res.page) pageFormApi.setValues(res.page);
    } else if (type.value === 'add') {
      await formApi.setValues({
        provider: currentProviderId,
      });
    }
  } catch (error) {
    console.error('Failed to init:', error);
  } finally {
    loading.value = false;
  }
});

// Remove unstable watcher that caused infinite rerender

async function handleSave() {
  try {
    const { valid } = await formApi.validate();
    if (!valid) {
      message.error('请完善左侧必填的基础信息');
      return;
    }

    submitting.value = true;
    const vals = await formApi.getValues();

    const requestData: ApplicationApi.ApplicationSaveRequest = {
      application: {
        ...formData.value,
        name: vals.name,
        code: vals.code,
        logoUrl: vals.logoUrl,
        description: vals.description,
        state: formData.value.state || { text: '启用', value: 'enabled' },
        integrationModes: (vals.integrationModes || []).map((m: string) => ({
          value: m,
          text: modeLabels[m] || m,
        })),
        sso: vals.integrationModes?.includes('ssoClient')
          ? await ssoFormApi.getValues()
          : undefined,
        apiClient: vals.integrationModes?.includes('apiClient')
          ? await apiClientFormApi.getValues()
          : undefined,
        apiServer: vals.integrationModes?.includes('apiServer')
          ? await apiServerFormApi.getValues()
          : undefined,
        page: vals.integrationModes?.includes('page')
          ? await pageFormApi.getValues()
          : undefined,
      } as ApplicationApi.ApplicationEntity,
      grants: [],
    };

    // Add dummy values logic if we use real endpoint later, but basic is sufficient:
    if (type.value === 'edit' && appId.value) {
      requestData.application.id = appId.value || ''; // Important for edit
    }

    await saveApplicationAndGrant(requestData);
    message.success($t('common.saveSuccess', '保存成功'));
    router.back();
  } catch (error) {
    console.error('Failed to save application:', error);
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  router.back();
}
</script>

<template>
  <Page auto-content-height>
    <template #title>
      <div class="flex items-center gap-2">
        <Button type="link" @click="handleCancel">
          <template #icon><BackIcon /></template>
        </Button>
        <div class="flex items-center gap-2">
          <component
            v-if="getProviderConfig(formData.provider || '')?.icon"
            :is="
              createIconifyIcon(
                getProviderConfig(formData.provider || '')!.icon!,
              )
            "
            class="size-5"
            :class="
              getProviderConfig(formData.provider || '')?.color?.replace(
                'bg-',
                'text-',
              )
            "
          />
          <span class="text-lg font-medium">
            {{
              type === 'add'
                ? $t('application.addTitle', '新增应用接入')
                : $t('application.editTitle', '编辑应用接入')
            }}
            <span
              v-if="providerInfo?.name"
              class="ml-2 text-sm font-normal text-slate-500"
            >
              ({{ providerInfo.name }})
            </span>
          </span>
        </div>
      </div>
    </template>
    <template #extra>
      <Space>
        <Button @click="handleCancel">
          {{ $t('common.action.cancel', '取消') }}
        </Button>
        <Button type="primary" :loading="submitting" @click="handleSave">
          <template #icon><SaveIcon /></template>
          {{ $t('common.action.save', '保存') }}
        </Button>
      </Space>
    </template>

    <Spin :spinning="loading" wrapper-class-name="h-full">
      <div class="flex h-full gap-4 overflow-hidden p-4">
        <!-- Left side: Basic Info -->
        <div class="w-[450px] shrink-0 overflow-y-auto">
          <Card
            :title="$t('basicInfo', '基础信息')"
            class="h-auto shadow-sm"
            :bordered="false"
          >
            <BasicForm />
          </Card>
        </div>

        <!-- Right side: Config Integration -->
        <div class="flex flex-1 flex-col overflow-hidden">
          <Card
            :title="$t('application.configInfo', '集成配置属性')"
            class="flex h-full flex-col shadow-sm"
            :bordered="false"
          >
            <template v-if="selectedModes.length > 0">
              <Tabs v-model:active-key="activeTab" class="h-full w-full">
                <TabPane
                  v-if="selectedModes.includes('ssoClient')"
                  key="ssoClient"
                  :tab="modeLabels.ssoClient"
                  force-render
                >
                  <div class="h-full overflow-y-auto pr-4 pt-4">
                    <div class="max-w-2xl">
                      <Alert
                        message="基于OAuth2或OIDC的统一登录授权接入参数"
                        class="mb-6"
                        type="info"
                        show-icon
                      />
                      <SsoForm />
                    </div>
                  </div>
                </TabPane>
                <TabPane
                  v-if="selectedModes.includes('apiClient')"
                  key="apiClient"
                  :tab="modeLabels.apiClient"
                  force-render
                >
                  <div class="h-full overflow-y-auto pr-4 pt-4">
                    <div class="max-w-2xl">
                      <Alert
                        message="作为客户端调用该应用提供的接口或Webhooks"
                        class="mb-6"
                        type="info"
                        show-icon
                      />
                      <ApiClientForm />
                    </div>
                  </div>
                </TabPane>
                <TabPane
                  v-if="selectedModes.includes('apiServer')"
                  key="apiServer"
                  :tab="modeLabels.apiServer"
                  force-render
                >
                  <div class="h-full overflow-y-auto pr-4 pt-4">
                    <div class="max-w-2xl">
                      <Alert
                        message="允许该应用调用IoT平台的接口时的请求配置"
                        class="mb-6"
                        type="warning"
                        show-icon
                      />
                      <ApiServerForm />
                    </div>
                  </div>
                </TabPane>
                <TabPane
                  v-if="selectedModes.includes('page')"
                  key="page"
                  :tab="modeLabels.page"
                  force-render
                >
                  <div class="h-full overflow-y-auto pr-4 pt-4">
                    <div class="max-w-2xl">
                      <Alert
                        message="以内嵌IFrame或微前端方式加载应用页面"
                        class="mb-6"
                        type="info"
                        show-icon
                      />
                      <PageForm />
                    </div>
                  </div>
                </TabPane>

                <!-- Fallback for other potential integration modes -->
                <template
                  v-for="mode in selectedModes.filter(
                    (m) =>
                      !['ssoClient', 'apiClient', 'apiServer', 'page'].includes(
                        m,
                      ),
                  )"
                  :key="mode"
                >
                  <TabPane
                    :tab="
                      availableModes.find((a) => a.value === mode)?.label ||
                      mode
                    "
                  >
                    <div class="p-8 text-center text-slate-500">
                      此集成方式暂无专属扩展配置项，将使用默认配置生效。
                    </div>
                  </TabPane>
                </template>
              </Tabs>
            </template>
            <div
              v-else
              class="flex h-full items-center justify-center text-slate-400"
            >
              <div class="text-center">
                <AppIcon
                  class="mx-auto mb-4 size-16 text-slate-300 opacity-50"
                />
                <div>尚未启用任何功能，请在左侧"集成方式"中进行勾选</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Spin>
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
  overflow: hidden auto;
}

/* Add custom padding offset for tab component */
:deep(.ant-tabs) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.ant-tabs-content-holder) {
  flex: 1;
  overflow: hidden;
}

:deep(.ant-tabs-content) {
  height: 100%;
}

:deep(.ant-tabs-tabpane) {
  height: 100%;
  overflow: hidden;
}
</style>
