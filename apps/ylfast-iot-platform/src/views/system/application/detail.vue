<script setup lang="ts">
import type { ApplicationApi } from '#/api/system/application';
import type { SystemMenuApi } from '#/api/system/menu';

import { computed, markRaw, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Alert,
  Button,
  Card,
  Empty,
  message,
  Modal,
  Space,
  Spin,
  TabPane,
  Tabs,
  Tree,
} from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  applicationCrudApis,
  queryApplicationMenuListGet,
  queryApplicationProviders,
  queryRemoteMenuTree,
  saveApplicationAndGrant,
  saveApplicationWithMenu,
} from '#/api/system/application';
import IconCardSelect from '#/components/yl-icon-card-select/index.vue';
import { getProviderConfig } from '#/enums/application';
import ImageUpload from '#/views/system/config/components/ImageUpload.vue';

import ApplicationPageMenuEditor from './components/ApplicationPageMenuEditor.vue';
import { integrationStrategies } from './schemas/integration-strategies';

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
// 记录编辑前的集成方式，便于在“取消页面集成”时也能触发一次菜单清理保存。
const originalModes = ref<string[]>([]);
// 页面集成菜单编辑器维护的是应用内菜单树，保存前再转换为后端所需的平铺结构。
const pageMenus = ref<SystemMenuApi.Menu[]>([]);
const PAGE_PATH_OPTION = 'pagePath';
// 实时跟踪页面集成表单中的"菜单查询接口路径"字段，用于控制远程菜单同步按钮的可用性。
const pageRemoteApiPath = ref<string>('');

const activeTab = ref<string>('');
const providerOptions = ref<any[]>([]);

// 新增应用后的同步弹窗逻辑
const syncModalVisible = ref(false);
const syncRemoteMenus = ref<any[]>([]);
const loadingSyncMenus = ref(false);
const syncCheckedKeys = ref<string[]>([]);
const syncTargetAppId = ref('');
const syncTargetRemotePath = ref('');

const [BasicForm, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  commonConfig: {
    componentProps: { class: 'w-full' },
  },
  schema: [
    {
      fieldName: 'name',
      label: $t('application.name', '应用名称'),
      component: 'Input',
      rules: 'required',
      componentProps: { placeholder: '请输入应用名称' },
    },
    {
      fieldName: 'provider',
      label: $t('application.provider', '应用类型/提供商'),
      component: markRaw(IconCardSelect),
      modelPropName: 'value',
      rules: 'required',
      componentProps: {
        options: providerOptions,
        disabled: true,
      },
    },
    {
      fieldName: 'code',
      label: $t('application.code', '应用编码'),
      component: 'Input',
      componentProps: { placeholder: '可为空，系统自动生成或手动指定' },
    },
    {
      fieldName: 'logoUrl',
      label: $t('application.logoUrl', 'Logo/图标'),
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
      label: $t('application.description', '描述说明'),
      component: 'Textarea',
      componentProps: { rows: 3 },
    },
    {
      fieldName: 'integrationModes',
      label: $t('application.integrationModes', '集成方式 (功能勾选)'),
      component: 'CheckboxGroup',
      componentProps: {
        options: [],
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

const pageSchemaBase = integrationStrategies.page.buildSchema({});
const [PageForm, pageFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  commonConfig: { componentProps: { class: 'w-full' } },
  schema: pageSchemaBase.map((s) =>
    s.fieldName === 'requestQueryMenuApi'
      ? {
          ...s,
          componentProps: {
            ...(s.componentProps as Record<string, unknown>),
            onChange: (e: Event) => {
              const val = (e.target as HTMLInputElement)?.value ?? '';
              pageRemoteApiPath.value = val;
            },
          },
        }
      : s,
  ),
});

const selectedModes = ref<string[]>([]);
const availableModes = ref<{ label: string; value: string }[]>([]);

const modeLabels = computed<Record<string, string>>(() => ({
  ssoClient: $t('application.integration.ssoClient', 'SSO单点登录'),
  apiClient: $t('application.integration.apiClient', 'API客户端'),
  apiServer: $t('application.integration.apiServer', 'API服务端'),
  page: $t('application.integration.page', '页面集成'),
}));

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
        const dynamicSsoSchema = integrationStrategies.ssoClient.buildSchema({
          provider: currentProviderId,
        });
        ssoFormApi.setState({ schema: dynamicSsoSchema });

        availableModes.value = (providerInfo.value.integrationModes || []).map(
          (m) => ({
            label: modeLabels.value[m] || m,
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

    if (type.value === 'edit' && res) {
      const modes = (res.integrationModes || []).map((m: any) => m.value || m);
      originalModes.value = modes;

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
      if (res.page) {
        pageFormApi.setValues({
          routeType: 'hash',
          ...res.page,
        });
        pageRemoteApiPath.value = res.page.requestQueryMenuApi || '';
      }

      if (modes.includes('page') && appId.value) {
        // 编辑页面集成应用时，需要把后端菜单列表回填到本地编辑器模型。
        pageMenus.value = normalizeLoadedMenus(
          await queryApplicationMenuListGet(appId.value),
        );
      }
    } else if (type.value === 'add') {
      await formApi.setValues({
        provider: currentProviderId,
      });
      originalModes.value = [];
      pageFormApi.setValues({ routeType: 'hash' });
    }
  } catch (error) {
    console.error('Failed to init:', error);
  } finally {
    loading.value = false;
  }
});

// 后端返回的是菜单实体视图，这里只保留前端编辑器需要的字段，避免把运行时字段带回表单。
function normalizeLoadedMenus(menus: any[]): SystemMenuApi.Menu[] {
  return (menus || []).map((menu) => {
    const pagePath = menu?.options?.[PAGE_PATH_OPTION] || '';
    return {
      ...menu,
      id: menu.id,
      name: menu.name || '',
      code: menu.code || '',
      icon: menu.icon || '',
      // url 表示当前系统中的路由地址；如果历史数据未分离，则先沿用原 url。
      url: menu.url || pagePath,
      component: menu.component || '',
      describe: menu.describe || '',
      status: menu.status ?? 1,
      permissions: menu.permissions || [],
      buttons: menu.buttons || [],
      owner: menu.owner || '',
      application: menu.application || '',
      creatorId: menu.creatorId || '',
      createTime: menu.createTime || Date.now(),
      options: {
        ...menu.options,
        [PAGE_PATH_OPTION]: pagePath,
      },
      parentId: menu.parentId || undefined,
      sortIndex: menu.sortIndex || 0,
    };
  });
}

// 保存前只提交基础菜单字段；IFrameView、iframeSrc、owner、application 等运行时字段由后端统一补齐。
function normalizePageMenusForSave(): SystemMenuApi.Menu[] {
  return pageMenus.value.map((menu) => {
    const pagePath = `${menu.options?.[PAGE_PATH_OPTION] || ''}`.trim();
    const routeUrl = `${menu.url || ''}`.trim() || pagePath;
    return {
      ...menu,
      id: menu.id,
      name: menu.name,
      code: menu.code,
      icon: menu.icon,
      url: routeUrl,
      component: menu.component,
      describe: menu.describe,
      status: menu.status ?? 1,
      permissions: [],
      buttons: menu.buttons || [],
      owner: menu.owner,
      application: menu.application,
      creatorId: menu.creatorId,
      createTime: menu.createTime,
      options: {
        ...menu.options,
        [PAGE_PATH_OPTION]: pagePath,
      },
      parentId: menu.parentId,
      sortIndex: menu.sortIndex || 0,
    };
  });
}

// 页面集成 V1 至少要有一个菜单；叶子菜单必须提供远端嵌入路径，系统内路由可以为空并由后端回退。
// function validatePageMenus() {
//   if (pageMenus.value.length === 0) {
//     message.error(
//       $t('application.pageMenus.errors.empty', '页面集成至少需要配置一个菜单'),
//     );
//     return false;
//   }
//   const parentIds = new Set(
//     pageMenus.value.map((menu) => menu.parentId).filter(Boolean) as string[],
//   );
//   const invalid = pageMenus.value.find((menu) => {
//     if (!menu.name?.trim() || !menu.code?.trim()) {
//       return true;
//     }
//     const isLeaf = !parentIds.has(menu.id);
//     const pagePath = `${menu.options?.[PAGE_PATH_OPTION] || ''}`.trim();
//     return isLeaf && !pagePath;
//   });
//   if (invalid) {
//     message.error(
//       $t(
//         'application.pageMenus.errors.required',
//         '请为每个页面菜单填写名称、编码；叶子菜单还需填写远端嵌入路径。',
//       ),
//     );
//     return false;
//   }
//   return true;
// }

async function handleInitialRemoteSync(appId: string, remoteApiPath: string) {
  syncTargetAppId.value = appId;
  syncTargetRemotePath.value = remoteApiPath;
  syncModalVisible.value = true;
  loadingSyncMenus.value = true;
  syncCheckedKeys.value = [];
  try {
    const res = await queryRemoteMenuTree(appId, remoteApiPath);
    syncRemoteMenus.value = res || [];
  } catch (error) {
    message.error(
      $t('application.pageMenus.errors.fetchRemote', '获取远程菜单失败'),
    );
    console.error(error);
  } finally {
    loadingSyncMenus.value = false;
  }
}

function handleSyncCheck(checked: any) {
  syncCheckedKeys.value = checked as string[];
}

async function onSyncConfirm() {
  if (syncCheckedKeys.value.length === 0) {
    onSyncCancel();
    return;
  }

  submitting.value = true;
  try {
    // 递归查找并转换选中的菜单
    const selectedMenus: SystemMenuApi.Menu[] = [];
    const findAndConvert = (nodes: any[]) => {
      nodes.forEach((node) => {
        if (syncCheckedKeys.value.includes(node.id)) {
          selectedMenus.push({
            id: node.id,
            name: node.name,
            code: node.code || node.id,
            icon: node.icon || '',
            url: node.url || '',
            describe: node.describe || '',
            status: 1,
            sortIndex: node.sortIndex || 0,
            parentId: node.parentId || '',
            options: {
              [PAGE_PATH_OPTION]: node.options?.[PAGE_PATH_OPTION] || '',
            },
          } as unknown as SystemMenuApi.Menu);
        }
        if (node.children?.length) {
          findAndConvert(node.children);
        }
      });
    };
    findAndConvert(syncRemoteMenus.value);

    // 获取当前应用最新的数据进行二次保存
    const application = {
      ...formData.value,
      id: syncTargetAppId.value,
    } as ApplicationApi.ApplicationEntity;

    await saveApplicationWithMenu({
      application,
      menus: selectedMenus,
    });

    message.success($t('common.saveSuccess', '保存成功'));
    router.back();
  } catch (error) {
    console.error('Failed to sync and save:', error);
  } finally {
    submitting.value = false;
    syncModalVisible.value = false;
  }
}

function onSyncCancel() {
  syncModalVisible.value = false;
  router.back();
}

async function handleSave() {
  try {
    const { valid } = await formApi.validate();
    if (!valid) {
      message.error(
        $t('application.fillBasicInfo', '请完善左侧必填的基础信息'),
      );
      return;
    }

    submitting.value = true;
    const vals = await formApi.getValues();
    // 当前是页面集成，或历史上曾经是页面集成，都要走 with-menu 保存入口，确保菜单能同步新增或清理。
    const integrationModes = vals.integrationModes || [];
    const hasPageMode = integrationModes.includes('page');
    const needMenuSave = hasPageMode || originalModes.value.includes('page');

    const application = {
      ...formData.value,
      name: vals.name,
      code: vals.code,
      logoUrl: vals.logoUrl,
      description: vals.description,
      state: formData.value.state || { text: '启用', value: 'enabled' },
      integrationModes: integrationModes.map((mode: string) => ({
        value: mode,
        text: modeLabels.value[mode] || mode,
      })),
      sso: hasMode(integrationModes, 'ssoClient')
        ? await ssoFormApi.getValues()
        : undefined,
      apiClient: hasMode(integrationModes, 'apiClient')
        ? await apiClientFormApi.getValues()
        : undefined,
      apiServer: hasMode(integrationModes, 'apiServer')
        ? await apiServerFormApi.getValues()
        : undefined,
      page: hasPageMode ? await pageFormApi.getValues() : undefined,
    } as ApplicationApi.ApplicationEntity;

    if (type.value === 'edit' && appId.value) {
      application.id = appId.value || '';
    }

    let result: ApplicationApi.ApplicationEntity;
    // 页面集成场景统一走后端的“应用 + 菜单”整体保存接口，避免出现应用和菜单不一致。
    // eslint-disable-next-line prefer-const
    result = await (needMenuSave
      ? saveApplicationWithMenu({
          application,
          menus: hasPageMode ? normalizePageMenusForSave() : [],
        })
      : saveApplicationAndGrant({ application }));

    message.success($t('common.saveSuccess', '保存成功'));

    // 如果是新增且有页面集成配置了远程地址，则提示进入同步流程；否则返回
    if (type.value === 'add' && result?.id && hasPageMode) {
      const pageVals = await pageFormApi.getValues();
      const remotePath = pageVals.requestQueryMenuApi;
      if (remotePath) {
        await handleInitialRemoteSync(result.id, remotePath);
        return;
      }
    }

    router.back();
  } catch (error) {
    console.error('Failed to save application:', error);
  } finally {
    submitting.value = false;
  }
}

// 不同能力表单按需提交，未勾选的能力不应把空配置写回后端。
function hasMode(modes: string[], target: string) {
  return Array.isArray(modes) && modes.includes(target);
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
        <div class="w-[450px] shrink-0 overflow-y-auto">
          <Card
            :title="$t('application.basicInfo', '基础信息')"
            class="h-auto shadow-sm"
            :bordered="false"
          >
            <BasicForm />
          </Card>
        </div>

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
                        :message="
                          $t(
                            'application.desc.ssoClient',
                            '基于OAuth2 or OIDC的统一登录授权接入参数',
                          )
                        "
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
                        :message="
                          $t(
                            'application.desc.apiClient',
                            '作为客户端调用该应用提供的接口或Webhooks',
                          )
                        "
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
                        :message="
                          $t(
                            'application.desc.apiServer',
                            '允许该应用调用IoT平台的接口时的请求配置',
                          )
                        "
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
                    <div class="max-w-3xl">
                      <Alert
                        :message="
                          $t(
                            'application.desc.page',
                            '以内嵌IFrame或微前端方式加载应用页面',
                          )
                        "
                        class="mb-6"
                        type="info"
                        show-icon
                      />
                      <PageForm />
                      <div class="mt-8 border-t border-dashed pt-6">
                        <ApplicationPageMenuEditor
                          v-model="pageMenus"
                          :app-id="appId"
                          :is-edit="type === 'edit'"
                          :remote-api-path="pageRemoteApiPath"
                        />
                      </div>
                    </div>
                  </div>
                </TabPane>

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
                      {{
                        $t(
                          'application.defaultNoExtraConfig',
                          '此集成方式暂无专属扩展配置项，将使用默认配置生效。',
                        )
                      }}
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
                <div>
                  {{
                    $t(
                      'application.noIntegrationModes',
                      '尚未启用任何功能，请在左侧"集成方式"中进行勾选',
                    )
                  }}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Spin>

    <Modal
      v-model:visible="syncModalVisible"
      :title="$t('application.pageMenus.loadRemote', '加载远程菜单')"
      :confirm-loading="submitting"
      :ok-text="$t('common.confirm', '确认同步')"
      :cancel-text="$t('common.skip', '暂不同步')"
      @ok="onSyncConfirm"
      @cancel="onSyncCancel"
    >
      <div class="mb-4">
        <Alert
          :message="
            $t(
              'application.pageMenus.remoteSyncHint',
              '应用已创建。您可以立即同步远端菜单，或稍后在集成配置中手动同步。',
            )
          "
          type="info"
          show-icon
        />
      </div>
      <div
        class="max-h-[400px] overflow-y-auto rounded-lg border border-slate-100 p-4"
      >
        <Spin :spinning="loadingSyncMenus">
          <Tree
            v-if="syncRemoteMenus.length > 0"
            checkable
            block-node
            default-expand-all
            :tree-data="syncRemoteMenus"
            :checked-keys="syncCheckedKeys"
            :field-names="{ title: 'name', key: 'id', children: 'children' }"
            @check="handleSyncCheck"
          />
          <Empty
            v-else-if="!loadingSyncMenus"
            :description="
              $t(
                'application.pageMenus.errors.noRemoteMenus',
                '未发现可同步的远端菜单',
              )
            "
          />
        </Spin>
      </div>
    </Modal>
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
</style>
