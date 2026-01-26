<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button,
  Form,
  FormItem,
  Input,
  message,
  Spin,
  Steps,
  Table,
  Tag,
  Textarea,
  Tooltip,
} from 'ant-design-vue';

import {
  getGatewayConfigMetadata,
  getGatewayDetail,
  getGatewayProviders,
  getTransportDetail,
  IotGatewayApi,
} from '#/api/iot/gateway';
import { getAliveNetworkInfo } from '#/api/iot/network-config';
import { getPluginConfigMetadata, getPluginList } from '#/api/iot/plugin';
import { getSupportTransportProtocols } from '#/api/iot/protocol';
import { YlConfigMetadataForm } from '#/components/yl-config-metadata-form';
import { YlMarkdown } from '#/components/yl-markdown';
import { CHANNEL_TYPE } from '#/enums/channel-type';

import AccessNetworkSelector from './components/AccessNetworkSelector.vue';
import AccessPluginSelector from './components/AccessPluginSelector.vue';
import AccessProtocolSelector from './components/AccessProtocolSelector.vue';
import PluginConfigeMetadataForm from './components/PluginConfigeMetadataForm.vue';
import { useGatewayChannel } from './hooks/useGatewayChannel';
import { useGatewayRoutes } from './hooks/useGatewayRoutes';

const route = useRoute();
const router = useRouter();

// 图标中心
const ArrowLeftIcon = createIconifyIcon('lucide:arrow-left');
const ArrowRightIcon = createIconifyIcon('lucide:arrow-right');
const CheckIcon = createIconifyIcon('lucide:check');
const NetworkIcon = createIconifyIcon('lucide:network');
const BoxIcon = createIconifyIcon('lucide:box');
const PluginIcon = createIconifyIcon('lucide:plug');
const ProtocolIcon = createIconifyIcon('lucide:file-json-2');
const TransportIcon = createIconifyIcon('lucide:zap');

// 路由参数
const id = route.query.id as string;
const providerId = route.query.providerId as string;
const isEdit = !!id;

// 基础状态
const currentStep = ref(0);
const loading = ref(false);
const submitting = ref(false);
const provider = ref<IotGatewayApi.GatewayProviderDetail>();
const configMetadata = ref<any[]>([]);
const pluginMetadata = ref<any[]>([]);
const transportDetail = ref<IotGatewayApi.TransportDetail>();
const selectedNetwork = ref<any>();
const selectedProtocol = ref<any>();
const selectedPlugin = ref<any>();

// 表单响应式模型
const formModel = reactive<Partial<IotGatewayApi.DeviceGatewayDetail>>({
  id: undefined,
  name: '',
  description: '',
  provider: providerId,
  channel: '',
  transport: '',
  channelId: undefined,
  protocolId: undefined,
  configuration: {},
  state: { value: 'enabled', label: $t('gateway.states.enabled') } as any,
});

/**
 * 根据通道类型判断并生成步骤配置
 */
function getProviderSteps(channelType?: string) {
  if (!channelType) return [];

  const items = [];
  switch (channelType) {
    case CHANNEL_TYPE.CHANNEL_NETWORK: {
      items.push(
        {
          component: 'NetworkSelector',
          key: 'channelId',
          title: $t('gateway.detail.network.title'),
        },
        {
          component: 'ProtocolSelector',
          key: 'protocolId',
          title: $t('gateway.detail.protocol.title'),
        },
      );
      break;
    }
    case CHANNEL_TYPE.CHANNEL_PLUGIN: {
      items.push({
        component: 'PluginSelector',
        key: 'channelId',
        title: $t('gateway.detail.plugin.title'),
      });

      break;
    }
    case CHANNEL_TYPE.CHANNEL_SUB: {
      // 子设备模式，直接进入最后一步

      break;
    }
    // No default
  }

  items.push({
    title: $t('gateway.detail.basicInfo'),
    key: 'final',
    component: 'FinalStep',
  });
  return items;
}

// 动态计算步骤条配置
const stepConfigs = computed(() => getProviderSteps(provider.value?.channel));

// 获取当前步骤详细配置
const currentStepConfig = computed(() => stepConfigs.value[currentStep.value]);

// 辅助方法：判断通道类型
const { isNetwork, isPlugin } = useGatewayChannel(
  computed(() => provider.value?.channel),
);

// 页面初始化
async function init() {
  loading.value = true;
  try {
    // 1. 获取所有提供者，匹配当前接入方式
    const providers = await getGatewayProviders();
    const currentProvider = providers.find((p) => p.id === providerId);
    if (!currentProvider) {
      message.error($t('gateway.detail.notFound'));
      router.back();
      return;
    }
    provider.value = currentProvider;
    formModel.channel = currentProvider.channel;
    formModel.transport = currentProvider.transport.id;

    // 2. 如果是编辑模式，预加载已有详情
    if (isEdit) {
      const detail = await getGatewayDetail(id);
      Object.assign(formModel, detail);

      // 3. 回显详情信息 (补全名称)
      await fetchEchoDetails();
    }

    // 4. 加载接入方式特定的配置元数据
    await loadGatewayMetadata();
    if (isPlugin()) {
      await loadPluginMetadata();
    }
  } catch (error) {
    console.error('初始化失败:', error);
  } finally {
    loading.value = false;
  }
}

// 补全回显详情
async function fetchEchoDetails() {
  if (!isEdit) return;

  // 1. 网络组件回显
  if (isNetwork() && formModel.channelId) {
    try {
      const networks = await getAliveNetworkInfo(
        provider.value?.other?.networkType?.id || '',
        formModel.channelId,
        {
          pageIndex: 0,
          pageSize: 1,
        },
      );
      if (networks && networks.length > 0) {
        selectedNetwork.value = networks[0];
      }
    } catch (error) {
      console.warn('回显网络组件失败:', error);
    }
  }

  // 2. 协议回显
  if (isNetwork() && formModel.protocolId && formModel.transport) {
    try {
      const protocols = await getSupportTransportProtocols(
        formModel.transport,
        {
          paging: false,
          filter: { protocolId$eq: formModel.protocolId },
        },
      );
      if (protocols && protocols.length > 0) {
        selectedProtocol.value = protocols[0];
      }
    } catch (error) {
      console.warn('回显协议失败:', error);
    }
  }

  // 3. 插件回显
  if (isPlugin() && formModel.channelId) {
    try {
      const { data } = await getPluginList({
        paging: false,
        terms: [
          {
            column: 'id',
            termType: 'eq',
            value: formModel.channelId,
          },
        ],
      });
      if (data && data.length > 0) {
        selectedPlugin.value = data[0];
      }
    } catch (error) {
      console.warn('回显插件失败:', error);
    }
  }
}

// 加载网关配置元数据
async function loadGatewayMetadata() {
  if (!providerId) return;
  try {
    const gatewayMetadata = await getGatewayConfigMetadata(providerId);
    configMetadata.value = gatewayMetadata ? [gatewayMetadata] : [];
  } catch (error) {
    console.error('加载网关元数据失败:', error);
  }
}

// 加载插件配置元数据
async function loadPluginMetadata() {
  if (!isPlugin() || !formModel.channelId) {
    pluginMetadata.value = [];
    return;
  }
  try {
    const metadata = await getPluginConfigMetadata(formModel.channelId);
    pluginMetadata.value = metadata ? [metadata] : [];
  } catch (error) {
    console.error('加载插件元数据失败:', error);
  }
}

// 监听插件选择变化，重新加载元数据
watch(
  () => formModel.channelId,
  (newVal) => {
    if (isPlugin() && newVal) {
      loadPluginMetadata();
    }
  },
);

// 加载协议对应的传输详情（文档及功能点）
async function loadTransportDetail() {
  // 只在网络组件模式下加载协议详情
  if (!isNetwork()) return;

  if (formModel.protocolId && formModel.transport) {
    try {
      const res = await getTransportDetail(
        formModel.protocolId,
        formModel.transport,
      );
      transportDetail.value = res;
    } catch (error) {
      console.error('加载传输详情失败:', error);
    }
  }
}

watch(
  () => formModel.protocolId,
  () => {
    loadTransportDetail();
  },
);

// 获取排序后的路由数据及动态列
const { routeColumns, sortedRoutes } = useGatewayRoutes(
  computed(() => transportDetail.value?.routes),
  computed(() => formModel.transport),
);

// 手工切换步骤
function handleNext() {
  const currentConfig = stepConfigs.value[currentStep.value];
  if (currentConfig && currentConfig.key) {
    const val =
      formModel[currentConfig.key as keyof IotGatewayApi.DeviceGatewayDetail];
    if (!val && currentConfig.key !== 'final') {
      message.warning(
        $t('gateway.detail.validation.select', { title: currentConfig.title }),
      );
      return;
    }
  }

  if (currentStep.value < stepConfigs.value.length - 1) {
    currentStep.value++;
  }
}

function handlePrev() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

// 表单引用
const formRef = ref();
const configFormRef = ref();
const pluginConfigFormRef = ref();
const formRules: any = {
  name: [
    {
      required: true,
      message: $t('gateway.detail.validation.nameRequired'),
      trigger: 'blur',
    },
  ],
};

// 最终保存提交
async function handleSave() {
  try {
    // 1. 校验最后一步的表单
    await formRef.value?.validate();

    // 2. 校验配置表单（如果有）
    if (isPlugin()) {
      await pluginConfigFormRef.value?.validate();
    } else if (configFormRef.value) {
      await configFormRef.value.validate();
    }

    // 3. 提交数据
    submitting.value = true;
    if (isEdit) {
      await IotGatewayApi.basicCrudApis.patchSave(formModel);
      message.success($t('gateway.detail.updateSuccess'));
    } else {
      await IotGatewayApi.basicCrudApis.postAdd(formModel as any);
      message.success($t('gateway.detail.createSuccess'));
    }
    router.push('/iot/gateway');
  } catch (error) {
    console.error('验证或提交失败:', error);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  init();
});
</script>

<template>
  <Page
    :header-hidden="true"
    auto-content-height
    content-class="p-0"
    class="bg-slate-50/50 dark:bg-[#0a0a0a]"
  >
    <!-- 极简流玻璃头 (Fixed Header) -->
    <header
      class="sticky top-0 z-50 shrink-0 border-b border-slate-100 bg-white/80 px-8 py-5 backdrop-blur-md dark:border-gray-800 dark:bg-[#101010]/80"
    >
      <div class="flex items-center justify-between gap-8">
        <!-- Left: Title & Back -->
        <div class="flex shrink-0 items-center gap-6">
          <Button
            type="text"
            class="flex h-10 w-10 items-center justify-center p-0"
            @click="router.back()"
          >
            <ArrowLeftIcon class="size-5" focusable="false" />
          </Button>
          <div class="flex flex-col">
            <h1
              class="m-0 text-xl font-black tracking-tight text-slate-800 dark:text-gray-100"
            >
              {{
                isEdit ? $t('gateway.detail.edit') : $t('gateway.detail.add')
              }}
              <span class="ml-2 text-sm font-medium text-slate-400">
                / {{ provider?.name }}
              </span>
            </h1>
          </div>
        </div>

        <!-- Center: Steps (Flexible width) -->
        <div class="flex max-w-[800px] flex-1 items-center justify-center">
          <Steps :current="currentStep" size="small" class="custom-steps">
            <Steps.Step
              v-for="s in stepConfigs"
              :key="s.title"
              :title="s.title"
            />
          </Steps>
        </div>

        <!-- Right: Actions -->
        <div class="flex shrink-0 items-center gap-3">
          <Button
            v-if="currentStep > 0"
            class="flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium"
            @click="handlePrev"
          >
            <ArrowLeftIcon class="size-3.5" focusable="false" />
            <span>{{ $t('gateway.detail.prev') }}</span>
          </Button>

          <Button
            v-if="currentStep < stepConfigs.length - 1"
            type="primary"
            class="flex h-8 items-center gap-2 rounded-lg px-5 text-xs font-bold shadow-md shadow-primary/10"
            @click="handleNext"
          >
            <span>{{ $t('gateway.detail.next') }}</span>
            <ArrowRightIcon class="size-3.5" focusable="false" />
          </Button>

          <Button
            v-if="currentStep === stepConfigs.length - 1"
            type="primary"
            :loading="submitting"
            class="flex h-8 items-center gap-2 rounded-lg px-5 text-xs font-bold shadow-md shadow-primary/10"
            @click="handleSave"
          >
            <span>{{
              isEdit ? $t('gateway.detail.save') : $t('gateway.detail.create')
            }}</span>
            <CheckIcon class="size-3.5" focusable="false" />
          </Button>
        </div>
      </div>
    </header>

    <div
      class="mx-auto flex min-h-[calc(100vh-170px)] w-full flex-col rounded-b-xl bg-white p-8 shadow-sm transition-all duration-300 dark:bg-[#121212]"
    >
      <Spin :spinning="loading" class="flex flex-1 flex-col">
        <!-- 步骤 1/2: 选择器 -->
        <AccessNetworkSelector
          v-if="currentStepConfig?.component === 'NetworkSelector'"
          v-model:value="formModel.channelId"
          :network-type-id="provider?.other?.networkType?.id"
          :include-id="isEdit ? formModel.channelId : undefined"
          @select="(item) => (selectedNetwork = item)"
        />

        <AccessProtocolSelector
          v-if="currentStepConfig?.component === 'ProtocolSelector'"
          v-model:value="formModel.protocolId"
          :transport-id="provider?.transport.id"
          @select="(item) => (selectedProtocol = item)"
        />

        <AccessPluginSelector
          v-if="currentStepConfig?.component === 'PluginSelector'"
          v-model:value="formModel.channelId"
          @select="(item) => (selectedPlugin = item)"
        />

        <!-- 最后一步: 基本信息与配置 -->
        <div
          v-if="currentStepConfig?.component === 'FinalStep'"
          class="flex flex-1 flex-col gap-8 duration-500 animate-in fade-in slide-in-from-bottom-4 lg:flex-row"
        >
          <!-- 左侧: 表单 -->
          <div class="flex w-full shrink-0 flex-col gap-6 lg:w-1/2">
            <div class="flex flex-col gap-2 pb-2">
              <h2
                class="m-0 text-lg font-black tracking-tight text-slate-800 dark:text-gray-100"
              >
                {{ $t('gateway.detail.basicInfo') }}
              </h2>
              <p class="m-0 text-xs text-slate-400">
                {{ $t('gateway.detail.basicInfoDesc') }}
              </p>
            </div>

            <Form
              ref="formRef"
              layout="vertical"
              :model="formModel"
              :rules="formRules"
            >
              <FormItem :label="$t('gateway.detail.name')" name="name" required>
                <Input
                  v-model:value="formModel.name"
                  :placeholder="$t('gateway.detail.namePlaceholder')"
                />
              </FormItem>
              <FormItem :label="$t('gateway.detail.desc')" name="description">
                <Textarea
                  v-model:value="formModel.description"
                  :rows="3"
                  :placeholder="$t('gateway.detail.descPlaceholder')"
                />
              </FormItem>
            </Form>

            <div
              v-if="configMetadata.length > 0"
              class="mt-4 flex flex-col gap-2 pb-2"
            >
              <h2
                class="m-0 text-lg font-black tracking-tight text-slate-800 dark:text-gray-100"
              >
                {{ $t('gateway.detail.advConfig') }}
              </h2>
              <p class="m-0 text-xs text-slate-400">
                {{ $t('gateway.detail.advConfigDesc') }}
              </p>
            </div>

            <PluginConfigeMetadataForm
              v-if="isPlugin()"
              ref="pluginConfigFormRef"
              v-model:model-value="formModel.configuration"
              :gateway-metadata="configMetadata"
              :plugin-metadata="pluginMetadata"
            />

            <YlConfigMetadataForm
              layout="vertical"
              v-else-if="configMetadata.length > 0"
              ref="configFormRef"
              v-model:model-value="formModel.configuration"
              :metadata="configMetadata"
            />
          </div>

          <!-- 右侧: 配置预览与帮助 -->
          <div class="flex w-full shrink-0 flex-col gap-6 lg:w-1/2">
            <!-- 组件选型流 (Component Selection Cards) -->
            <div class="flex flex-col gap-4">
              <!-- 提供者 (Provider - Base) -->
              <div
                class="group relative flex items-center gap-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-all hover:ring-primary/20 dark:bg-white/5 dark:ring-white/10"
              >
                <div
                  class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20"
                >
                  <BoxIcon class="size-7" focusable="false" />
                </div>
                <div class="flex flex-col">
                  <span
                    class="text-[10px] font-black uppercase tracking-widest text-primary"
                  >
                    {{ provider?.channel }}
                  </span>
                  <span
                    class="text-base font-bold uppercase tracking-tight text-slate-700 dark:text-slate-200"
                  >
                    {{ provider?.name }}
                  </span>
                </div>
              </div>

              <!-- 网络组件 (Network Component) -->
              <div
                v-if="formModel.channelId && isNetwork()"
                class="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all hover:ring-blue-400/20 dark:bg-white/5 dark:ring-white/10"
              >
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-900/30"
                >
                  <NetworkIcon class="size-6" focusable="false" />
                </div>
                <div class="flex flex-col overflow-hidden">
                  <span
                    class="text-[10px] font-black uppercase tracking-widest text-blue-400"
                  >
                    {{ $t('gateway.detail.network.title') }}
                  </span>
                  <span
                    class="truncate text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    {{ selectedNetwork?.name || formModel.channelId }}
                    <span
                      v-if="selectedNetwork?.name"
                      class="ml-1 text-xs font-normal text-slate-400"
                    >
                      ({{ formModel.channelId }})
                    </span>
                  </span>
                </div>
              </div>

              <!-- 消息协议 (Protocol) -->
              <div
                v-if="formModel.protocolId"
                class="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all hover:ring-indigo-400/20 dark:bg-white/5 dark:ring-white/10"
              >
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30"
                >
                  <ProtocolIcon class="size-6" />
                </div>
                <div class="flex flex-col overflow-hidden">
                  <span
                    class="text-[10px] font-black uppercase tracking-widest text-indigo-400"
                  >
                    {{ $t('gateway.detail.protocol.title') }}
                  </span>
                  <span
                    class="truncate text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    {{ selectedProtocol?.name || formModel.protocolId }}
                    <span
                      v-if="selectedProtocol?.name"
                      class="ml-1 text-xs font-normal text-slate-400"
                    >
                      ({{ formModel.protocolId }})
                    </span>
                  </span>
                </div>
              </div>

              <!-- 驱动插件 (Plugin) -->
              <div
                v-if="formModel.channelId && isPlugin()"
                class="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all hover:ring-purple-400/20 dark:bg-white/5 dark:ring-white/10"
              >
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-500 dark:bg-purple-900/30"
                >
                  <PluginIcon class="size-6" focusable="false" />
                </div>
                <div class="flex flex-col overflow-hidden">
                  <span
                    class="text-[10px] font-black uppercase tracking-widest text-purple-400"
                  >
                    {{ $t('gateway.detail.plugin.title') }}
                  </span>
                  <span
                    class="truncate text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    {{ selectedPlugin?.name || formModel.channelId }}
                    <span
                      v-if="selectedPlugin?.name"
                      class="ml-1 text-xs font-normal text-slate-400"
                    >
                      ({{ formModel.channelId }})
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <!-- 传输协议技术规格 (Transport Technical Specifications) -->
            <div
              v-if="transportDetail"
              class="flex flex-col gap-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10"
            >
              <!-- 统一标题样式 (Unified Header Style) -->
              <div
                class="flex items-center gap-4 border-b border-slate-50 pb-4 dark:border-white/5"
              >
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20"
                >
                  <TransportIcon class="size-6" focusable="false" />
                </div>
                <div class="flex flex-col overflow-hidden">
                  <span
                    class="text-[10px] font-black uppercase tracking-widest text-primary/70"
                  >
                    {{ $t('gateway.detail.transportDetails') }}
                  </span>
                  <span
                    class="truncate text-base font-bold uppercase tracking-tight text-slate-700 dark:text-slate-200"
                  >
                    {{ transportDetail.name }}
                    <span class="ml-2 text-xs font-normal text-slate-400">
                      ({{ provider?.transport?.id }})
                    </span>
                  </span>
                </div>
              </div>

              <div
                class="flex flex-col gap-8"
                v-if="
                  transportDetail &&
                  (transportDetail.routes?.length > 0 ||
                    transportDetail.features?.length > 0)
                "
              >
                <!-- 特性展示 -->
                <div v-if="transportDetail.features?.length > 0">
                  <div
                    class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400"
                  >
                    {{ $t('gateway.detail.features') }}
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <Tag
                      v-for="feat in transportDetail.features"
                      :key="feat.id"
                      color="blue"
                      class="rounded-full border-none bg-blue-50 px-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      {{ feat.name }}
                    </Tag>
                  </div>
                </div>

                <!-- 路由信息展示 -->
                <div v-if="transportDetail.routes?.length > 0">
                  <div
                    class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400"
                  >
                    {{ $t('gateway.detail.routes') }}
                  </div>
                  <Table
                    bordered
                    :columns="routeColumns"
                    :data-source="sortedRoutes"
                    :pagination="false"
                    size="small"
                    class="custom-table"
                    :scroll="{ x: 'max-content' }"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'direction'">
                        <div class="flex items-center justify-center gap-1">
                          <Tag v-if="record.upstream" color="blue">
                            {{ $t('gateway.detail.upstream') }}
                          </Tag>
                          <Tag v-if="record.downstream" color="orange">
                            {{ $t('gateway.detail.downstream') }}
                          </Tag>
                        </div>
                      </template>

                      <template v-else-if="column.key === 'method'">
                        <div class="flex flex-wrap gap-1">
                          <Tag v-for="m in record.method" :key="m" color="blue">
                            {{ m }}
                          </Tag>
                        </div>
                      </template>
                      <template v-else-if="column.key === 'contentType'">
                        <div class="flex flex-wrap gap-1">
                          <Tag v-for="ct in record.contentType" :key="ct">
                            {{ ct }}
                          </Tag>
                        </div>
                      </template>
                      <template v-else-if="column.key === 'description'">
                        <Tooltip :title="record.description">
                          <span class="block max-w-[200px] truncate">{{
                            record.description
                          }}</span>
                        </Tooltip>
                      </template>
                    </template>
                  </Table>
                </div>

                <!-- 文档展示 -->
                <div v-if="transportDetail.document">
                  <div
                    class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400"
                  >
                    {{ $t('gateway.detail.docs') }}
                  </div>
                  <YlMarkdown
                    :model-value="transportDetail.document"
                    display-mode="modal"
                    :title="`${transportDetail.name} ${$t('gateway.detail.docs')}`"
                    :trigger-text="$t('common.view')"
                    trigger-type="button"
                    button-size="small"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Spin>
    </div>
  </Page>
</template>

<style scoped>
.custom-steps :deep(.ant-steps-item-title) {
  @apply text-xs font-black font-bold;
}

.custom-descriptions :deep(.ant-descriptions-item-label) {
  @apply font-medium text-slate-400;
}

.custom-descriptions :deep(.ant-descriptions-item-content) {
  @apply text-right font-bold text-slate-700 dark:text-slate-300;
}

:deep(.ant-card-head-title) {
  @apply text-base font-black tracking-tight;
}

.selection-card {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 5%);
}

.custom-table :deep(.ant-table-thead > tr > th) {
  @apply whitespace-nowrap bg-slate-50/50 py-3 dark:bg-white/5;
}

.custom-table :deep(.ant-table-cell) {
  @apply py-3;
}

/* 确保表格在窄屏幕下不会挤压文字 */
.custom-table :deep(.ant-table) {
  background: transparent !important;
}

/* 确保 Spin 组件及其内部容器铺满剩余高度 */
:deep(.ant-spin-nested-loading),
:deep(.ant-spin-container) {
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
}

/* 修复步骤条垂直对齐问题 */
:deep(.ant-steps) {
  display: flex;
  align-items: center;
}

:deep(.ant-steps-item-container) {
  display: flex !important;
  align-items: center !important;
}

:deep(.ant-steps-item-title) {
  display: flex !important;
  align-items: center !important;
  line-height: 1 !important;
}

:deep(.ant-steps-item-icon) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-bottom: 0 !important;
}

:deep(.ant-steps-item-tail) {
  top: 50% !important;
  padding: 0 10px !important;
  margin-top: 0 !important;
  transform: translateY(-50%);
}
</style>
