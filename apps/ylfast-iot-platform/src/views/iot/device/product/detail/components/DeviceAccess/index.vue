<script setup lang="ts">
import type { TslMergeStepConfig } from './components/TslMergeModal';

import type { DeviceMetadata } from '#/types/metadata';

/**
 * 设备接入配置组件
 *
 * 功能概述：
 * 1. 选择接入网关（Gateway）
 * 2. 配置网关参数
 * 3. 选择插件产品（仅插件模式）
 * 4. 自动合并物模型（TSL）：插件物模型、传输协议物模型、现有物模型
 * 5. 保存产品的接入配置和物模型
 *
 * 数据流向：
 * Gateway (网关)
 *   ├─> Transport (传输协议) -> transportDetail.metadata (传输协议物模型)
 *   ├─> Protocol (消息协议)
 *   ├─> Channel (通道：网络/插件)
 *   └─> (如果是插件模式) -> Plugin Product (插件产品) -> pluginProductData.metadata (插件物模型)
 *
 * 最终合并：插件物模型 + 传输协议物模型 + 现有产品物模型 = 新的产品物模型
 */
import { ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button,
  Card,
  message,
  Select,
  Spin,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { IotDeviceProductApi } from '#/api/iot/device/product';
import { savePluginDataIdMapping } from '#/api/iot/plugin';
import { YlConfigMetadataForm } from '#/components/yl-config-metadata-form';

import { TslMergeModal } from './components/TslMergeModal';
import { useDeviceGateway } from './hooks/useDeviceGateway';

// ==================== Props & Emits ====================
const props = defineProps<{
  product: IotDeviceProductApi.ProductDetail; // 当前产品详情
}>();

const emit = defineEmits(['update:product']); // 更新产品信息

// ==================== Icons ====================
const GatewayIcon = createIconifyIcon('lucide:router');
const ProtocolIcon = createIconifyIcon('lucide:file-json-2');
const TransportIcon = createIconifyIcon('lucide:zap');
const EditIcon = createIconifyIcon('lucide:edit');
const CheckIcon = createIconifyIcon('lucide:check');
const PluginIcon = createIconifyIcon('lucide:plug');
const NetworkIcon = createIconifyIcon('lucide:network');

// ==================== State ====================
const saving = ref(false); // 保存中状态
const configFormRef = ref(); // 配置表单引用

// ==================== Hooks ====================
/**
 * useDeviceGateway Hook
 * 管理网关选择、插件产品选择、配置元数据等逻辑
 *
 * 主要功能：
 * - loadGatewayInfo: 根据 gatewayId 加载网关详情
 * - handleSelectGateway: 打开网关选择器
 * - handlePluginProductChange: 处理插件产品切换
 * - isPlugin/isNetwork: 判断网关通道类型
 * - gatewayDetail: 当前选中的网关详情
 * - configMetadata: 动态配置元数据（用于生成配置表单）
 * - pluginProducts: 可用的插件产品列表
 */
const {
  GatewaySelector, // 网关选择器组件
  channelMap, // 通道类型映射表
  configFormModel, // 配置表单数据模型
  configMetadata, // 配置元数据（动态表单 Schema）
  gatewayDetail, // 网关详情
  handlePluginProductChange, // 插件产品切换处理
  handleSelectGateway, // 打开网关选择器
  isNetwork, // 是否为网络通道
  isPlugin, // 是否为插件通道
  loadGatewayInfo, // 加载网关信息
  loading, // 加载中状态
  pluginProductData, // 当前选中的插件产品数据
  pluginProducts, // 插件产品列表
  providerMap, // 网关提供商映射表
  routeColumns, // 路由表格列配置
  selectedPluginProductId, // 选中的插件产品 ID
  sortedRoutes, // 排序后的路由列表
  transportDetail, // 传输协议详情
} = useDeviceGateway(props);

/**
 * TSL 合并状态管理
 */
const tslMergeVisible = ref(false); // 合并弹窗显示状态
const tslMergeSteps = ref<TslMergeStepConfig[]>([]); // 合并步骤配置
const existingTsl = ref<DeviceMetadata>(); // 现有物模型

// ==================== 保存逻辑 ====================
/**
 * 主保存函数（用户点击保存按钮触发）
 *
 * 流程：
 * 1. 校验配置表单
 * 2. 校验插件产品是否已选择（插件模式必须）
 * 3. 准备物模型并构建合并步骤配置
 * 4. 显示合并弹窗或直接保存
 */
async function handleSave() {
  if (!gatewayDetail.value) return;

  // 1. 校验配置表单（如果有配置元数据）
  if (configMetadata.value.length > 0 && configFormRef.value) {
    try {
      await configFormRef.value.validate();
    } catch {
      return;
    }
  }

  // 2. 校验插件产品选择（插件模式必须选择）
  if (
    isPlugin() &&
    pluginProducts.value.length > 0 &&
    !selectedPluginProductId.value
  ) {
    message.warning($t('gateway.deviceAccess.selectPluginProduct'));
    return;
  }

  // 3. 准备物模型数据
  const pluginTsl = pluginProductData.value?.metadata || null;
  const transportTsl = gatewayDetail.value.transportDetail?.metadata
    ? JSON.parse(gatewayDetail.value.transportDetail.metadata)
    : null;
  existingTsl.value = props.product.tsl ? JSON.parse(props.product.tsl) : {};

  // 4. 构建合并步骤配置
  const steps: TslMergeStepConfig[] = [];

  // 如果有传输协议物模型
  if (transportTsl && Object.keys(transportTsl).length > 0) {
    steps.push({
      order: 1,
      name: $t('gateway.deviceAccess.tsl.mergeSteps.transport.name'),
      description: $t(
        'gateway.deviceAccess.tsl.mergeSteps.transport.description',
      ),
      metadata: transportTsl,
    });
  }

  // 如果有插件物模型（插件模式）
  if (pluginTsl && Object.keys(pluginTsl).length > 0) {
    steps.push({
      order: 2,
      name: $t('gateway.deviceAccess.tsl.mergeSteps.plugin.name'),
      description: $t('gateway.deviceAccess.tsl.mergeSteps.plugin.description'),
      metadata: pluginTsl,
    });
  }

  // 5. 如果有需要合并的步骤，显示弹窗；否则直接保存
  if (steps.length > 0) {
    tslMergeSteps.value = steps;
    tslMergeVisible.value = true;
  } else {
    // 没有需要合并的物模型，直接保存现有物模型
    await doSave(existingTsl.value);
  }
}

/**
 * 用于 TslMergeModal 的回调包装
 */
function handleTslMergeConfirm(mergedTsl: any) {
  tslMergeVisible.value = false;
  doSave(mergedTsl);
}

/**
 * 执行保存（由 useTslMerge 在合并完成后调用）
 *
 * 流程：
 * 1. 保存产品基本信息 + 物模型
 * 2. 保存插件映射关系（仅插件模式）
 * 3. 通知父组件更新
 *
 * @param tsl 合并后的最终物模型
 */
async function doSave(tsl: any) {
  saving.value = true;
  try {
    // 1. 构建更新数据
    const updateData: any = {
      ...props.product, // 保留产品其他字段
      channel: gatewayDetail.value?.channel, // 通道类型（network/plugin）
      configuration: configFormModel.value, // 网关配置参数
      gatewayId: gatewayDetail.value?.id, // 网关 ID
      gatewayName: gatewayDetail.value?.name, // 网关名称
      gatewayProvider: gatewayDetail.value?.provider, // 网关提供商
      protocolId: gatewayDetail.value?.protocolId, // 消息协议 ID
      protocolName: gatewayDetail.value?.protocolDetail?.name, // 消息协议名称
      transport: gatewayDetail.value?.transport, // 传输协议类型
      tsl: JSON.stringify(tsl), // 合并后的物模型（JSON 字符串）
    };

    // 2. 保存产品信息
    await IotDeviceProductApi.basicCrudApis.patchSave(updateData);

    // 3. 保存插件映射关系（仅插件模式需要）
    // 插件映射：记录产品与插件产品的对应关系
    if (
      isPlugin() &&
      gatewayDetail.value?.id &&
      selectedPluginProductId.value
    ) {
      try {
        await savePluginDataIdMapping(
          'product', // 映射类型
          gatewayDetail.value.id, // 网关 ID
          props.product.id, // 产品 ID
          selectedPluginProductId.value, // 插件产品 ID
        );
      } catch (error) {
        console.error('Failed to save plugin mapping', error);
        message.warning(`${$t('common.saveFailed')} (Plugin Mapping)`);
      }
    }

    // 4. 保存成功
    message.success($t('gateway.deviceAccess.saveSuccess'));
    emit('update:product', updateData); // 通知父组件更新产品数据
  } catch (error) {
    console.error(error);
    message.error($t('gateway.deviceAccess.saveFailed'));
  } finally {
    saving.value = false;
  }
}

// ==================== 初始化加载 ====================
/**
 * 监听产品的 gatewayId 变化
 * 当产品已经绑定了网关时，自动加载网关信息
 */
watch(
  () => props.product.gatewayId,
  (newId) => {
    if (newId) {
      loadGatewayInfo(newId); // 加载网关详情、配置元数据、插件产品等
    }
  },
  { immediate: true }, // 组件挂载时立即执行
);
</script>

<template>
  <Spin :spinning="loading" wrapper-class-name="h-full">
    <div
      class="flex h-full w-full flex-col bg-slate-50/50 lg:flex-row dark:bg-[#0a0a0a]"
    >
      <!-- Left Panel: Configuration -->
      <div
        class="flex h-full w-full flex-col overflow-hidden border-r border-slate-200 bg-white lg:w-1/2 dark:border-gray-800 dark:bg-[#151515]"
      >
        <!-- Scrollable Content -->
        <div class="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          <!-- Gateway Selection Card -->
          <!-- Gateway Selection (Flat Layout) -->
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-lg font-bold">
                <div class="h-4 w-1 bg-primary"></div>
                {{ $t('gateway.deviceAccess.accessGateway') }}
              </div>
              <Tooltip
                :title="
                  props.product.deviceCount > 0
                    ? $t('gateway.deviceAccess.disableSwitch')
                    : ''
                "
              >
                <Button
                  v-if="gatewayDetail"
                  :disabled="props.product.deviceCount > 0"
                  type="link"
                  @click="handleSelectGateway"
                >
                  <template #icon><EditIcon /></template>
                  {{ $t('gateway.deviceAccess.switchGateway') }}
                </Button>
              </Tooltip>
            </div>

            <!-- Selected Gateway Info -->
            <div
              v-if="gatewayDetail"
              class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-10 items-center justify-center rounded-lg bg-white text-primary shadow-sm dark:bg-white/10"
                  >
                    <GatewayIcon class="size-6" />
                  </div>
                  <div>
                    <div class="text-base font-bold">
                      {{ gatewayDetail.name }}
                    </div>
                    <div class="mt-0.5 text-xs text-slate-500">
                      ID: {{ gatewayDetail.id }}
                    </div>
                  </div>
                </div>
                <Tag
                  :color="
                    gatewayDetail.state?.value === 'enabled' ? 'green' : 'red'
                  "
                >
                  {{
                    gatewayDetail.state
                      ? $t(`gateway.states.${gatewayDetail.state.value}`)
                      : ''
                  }}
                </Tag>
              </div>

              <div
                class="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200/50 pt-4 dark:border-white/5"
              >
                <div>
                  <div class="mb-1 text-xs text-slate-500">
                    {{ $t('gateway.provider') }}
                  </div>
                  <div class="text-sm font-medium">
                    {{
                      providerMap[gatewayDetail.provider] ||
                      gatewayDetail.provider
                    }}
                  </div>
                </div>
                <div>
                  <div class="mb-1 text-xs text-slate-500">
                    {{ $t('gateway.channel') }}
                  </div>
                  <div class="text-sm font-medium">
                    {{
                      channelMap[gatewayDetail.channel] ||
                      gatewayDetail.channelInfo?.name ||
                      gatewayDetail.channel
                    }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-else
              class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-slate-400 dark:border-white/10 dark:bg-white/5"
            >
              <GatewayIcon class="mb-2 size-10 opacity-20" />
              <span>{{ $t('gateway.deviceAccess.selectGateway') }}</span>
              <Button class="mt-4" type="primary" @click="handleSelectGateway">
                {{ $t('gateway.deviceAccess.selectNow') }}
              </Button>
            </div>
          </div>

          <!-- Plugin Product Selector -->
          <Card
            v-if="isPlugin() && pluginProducts.length > 0"
            :bordered="false"
            class="shadow-sm ring-1 ring-slate-100 dark:ring-white/10"
          >
            <template #title>
              <div class="flex items-center gap-2">
                <PluginIcon class="text-purple-500" />
                <span class="font-bold">{{
                  $t('gateway.deviceAccess.pluginProduct')
                }}</span>
              </div>
            </template>
            <Select
              v-model:value="selectedPluginProductId"
              :options="
                pluginProducts.map((p) => ({ label: p.name, value: p.id }))
              "
              :placeholder="$t('gateway.deviceAccess.selectPluginProduct')"
              class="w-full"
              @change="handlePluginProductChange"
            />
          </Card>

          <!-- Dynamic Configuration -->
          <div v-if="configMetadata.length > 0" class="flex flex-col gap-4">
            <YlConfigMetadataForm
              ref="configFormRef"
              v-model="configFormModel"
              :metadata="configMetadata"
              layout="vertical"
            />
          </div>
        </div>

        <!-- Fixed Footer Action -->
        <!-- Fixed Footer Action -->
        <div
          class="flex justify-end border-t border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#151515]"
        >
          <Button
            :disabled="!gatewayDetail"
            :loading="saving"
            type="primary"
            @click="handleSave"
          >
            <template #icon><CheckIcon /></template>
            {{ $t('gateway.deviceAccess.saveConfig') }}
          </Button>
        </div>
      </div>

      <!-- Right Panel: Protocol Details -->
      <div
        class="flex h-full w-full flex-col gap-6 overflow-y-auto p-6 lg:w-1/2 dark:bg-[#0a0a0a]"
      >
        <!-- Channel Info (Network/Plugin) -->
        <div
          v-if="gatewayDetail?.channelInfo && (isNetwork() || isPlugin())"
          class="flex flex-col gap-4"
        >
          <div class="flex items-center gap-2 text-lg font-bold">
            <div class="h-4 w-1 bg-primary"></div>
            {{ $t('gateway.deviceAccess.channelInfo') }}
          </div>

          <div
            class="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
          >
            <div
              class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-500 shadow-sm dark:bg-white/10"
            >
              <component
                :is="isNetwork() ? NetworkIcon : PluginIcon"
                class="size-6"
              />
            </div>
            <div class="flex min-w-0 flex-1 flex-col">
              <div class="flex items-center gap-2">
                <div class="truncate text-base font-bold">
                  {{ gatewayDetail.channelInfo.name }}
                </div>
                <Tag :color="isNetwork() ? 'blue' : 'purple'" class="mr-0">
                  {{
                    isNetwork()
                      ? $t('gateway.channels.network')
                      : $t('gateway.channels.plugin')
                  }}
                </Tag>
              </div>

              <div class="mt-1 font-mono text-xs text-slate-500">
                ID: {{ gatewayDetail.channelId }}
              </div>

              <!-- Addresses -->
              <div
                v-if="gatewayDetail.channelInfo.addresses?.length"
                class="mt-3 flex flex-wrap gap-2"
              >
                <Tooltip
                  v-for="(addr, idx) in gatewayDetail.channelInfo.addresses"
                  :key="idx"
                  :title="
                    addr.health === 1 ? $t('common.success') : $t('common.fail')
                  "
                >
                  <div
                    class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm dark:border-white/10 dark:bg-white/5"
                  >
                    <div
                      :class="addr.health === 1 ? 'bg-green-500' : 'bg-red-500'"
                      class="flex size-2 rounded-full"
                    ></div>
                    <span class="font-mono text-slate-600 dark:text-slate-300">
                      {{ addr.address }}
                    </span>
                  </div>
                </Tooltip>
              </div>
              <div v-else class="mt-2 text-xs text-slate-400">
                {{ $t('gateway.deviceAccess.noAddress') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Protocol Info Group -->
        <div
          v-if="gatewayDetail?.protocolDetail || transportDetail"
          class="flex flex-col gap-4"
        >
          <div class="flex items-center gap-2 text-lg font-bold">
            <div class="h-4 w-1 bg-primary"></div>
            {{ $t('gateway.deviceAccess.protocolInfo') }}
          </div>

          <!-- Message Protocol Card -->
          <div
            v-if="gatewayDetail?.protocolDetail"
            class="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
          >
            <div
              class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white text-orange-500 shadow-sm dark:bg-white/10"
            >
              <ProtocolIcon class="size-6" />
            </div>
            <div class="flex min-w-0 flex-1 flex-col">
              <div class="flex items-center gap-2">
                <div class="truncate text-base font-bold">
                  {{ gatewayDetail.protocolDetail.name }}
                </div>
                <Tag color="orange">{{ $t('gateway.protocol') }}</Tag>
              </div>
              <div class="mt-1 font-mono text-xs text-slate-500">
                ID: {{ gatewayDetail.protocolId }}
              </div>
              <div
                :title="gatewayDetail.protocolDetail.description"
                class="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-gray-400"
              >
                {{
                  gatewayDetail.protocolDetail.description ||
                  $t('gateway.deviceAccess.noDesc')
                }}
              </div>
            </div>
          </div>

          <!-- Transport Detail Card -->
          <div
            v-if="transportDetail"
            class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
          >
            <!-- Transport Header -->
            <div class="flex items-center gap-4">
              <div
                class="flex size-12 items-center justify-center rounded-lg bg-white text-blue-500 shadow-sm dark:bg-white/10"
              >
                <TransportIcon class="size-6" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <div class="text-xl font-bold">
                    {{ transportDetail.name }}
                  </div>
                  <Tag color="blue">{{ $t('gateway.transport') }}</Tag>
                </div>
                <div class="text-sm text-slate-500">
                  {{ gatewayDetail?.transport }}
                </div>
              </div>
            </div>

            <!-- Features -->
            <div
              v-if="transportDetail.features?.length"
              class="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-white/10"
            >
              <div
                class="flex items-center gap-2 text-xs font-bold text-slate-500"
              >
                <CheckIcon class="size-3 text-green-500" />
                {{ $t('gateway.detail.features') }}
              </div>
              <div class="flex flex-wrap gap-2">
                <Tag
                  v-for="feat in transportDetail.features"
                  :key="feat.id"
                  class="rounded-full px-3 py-1"
                  color="blue"
                >
                  {{ feat.name }}
                </Tag>
              </div>
            </div>

            <!-- Routes -->
            <div
              v-if="transportDetail.routes?.length"
              class="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-white/10"
            >
              <div
                class="flex items-center gap-2 text-xs font-bold text-slate-500"
              >
                <NetworkIcon class="size-3 text-orange-500" />
                {{ $t('gateway.detail.routes') }}
              </div>
              <Table
                :columns="routeColumns"
                :data-source="sortedRoutes"
                :pagination="false"
                :scroll="{ x: true }"
                class="rounded-lg border border-slate-100 bg-white p-2 shadow-sm dark:border-white/5 dark:bg-[#151515]"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'direction'">
                    <div class="flex items-center gap-1">
                      <Tag v-if="record.upstream" color="blue">
                        {{ $t('gateway.detail.upstream') }}
                      </Tag>
                      <Tag v-if="record.downstream" color="orange">
                        {{ $t('gateway.detail.downstream') }}
                      </Tag>
                    </div>
                  </template>
                </template>
              </Table>
            </div>
          </div>
        </div>
        <div
          v-else
          class="flex h-full flex-col items-center justify-center text-slate-400"
        >
          <div
            class="flex size-20 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5"
          >
            <ProtocolIcon class="size-10 opacity-50" />
          </div>
          <div class="mt-4 font-medium">
            {{ $t('gateway.deviceAccess.noProtocolDetail') }}
          </div>
          <div class="text-xs opacity-70">
            {{ $t('gateway.deviceAccess.selectGatewayFirst') }}
          </div>
        </div>
      </div>
    </div>
  </Spin>

  <!-- Gateway Selector Modal -->
  <GatewaySelector />

  <!-- TSL Merge Modal -->
  <TslMergeModal
    :visible="tslMergeVisible"
    :steps="tslMergeSteps"
    :existing-tsl="existingTsl"
    :on-confirm="handleTslMergeConfirm"
    :on-cancel="() => (tslMergeVisible = false)"
  />
</template>
