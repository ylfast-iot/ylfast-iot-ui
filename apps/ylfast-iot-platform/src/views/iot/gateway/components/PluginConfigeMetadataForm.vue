<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button as AButton,
  Card as ACard,
  Collapse as ACollapse,
  CollapsePanel as ACollapsePanel,
  Empty as AEmpty,
  Popconfirm as APopconfirm,
  Select as ASelect,
  message,
} from 'ant-design-vue';

import { getClusterNodes } from '#/api/system/monitor/cluster';
import { YlConfigMetadataForm } from '#/components/yl-config-metadata-form';

const props = defineProps<{
  disabled?: boolean;
  gatewayMetadata?: any[];
  modelValue?: any;
  pluginMetadata?: any[];
}>();

const emit = defineEmits(['update:modelValue', 'register']);

const PlusIcon = createIconifyIcon('lucide:plus');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const ServerIcon = createIconifyIcon('lucide:server');
const CopyIcon = createIconifyIcon('lucide:copy');

// --- Types & Defaults ---
interface Configuration {
  serverId?: string;
  tags?: Record<string, string>;
  props?: Record<string, any>;
}

interface PluginGateway {
  runMode: 'multi' | 'single';
  sharedConfig: Configuration;
  sharedConfigEnabled: boolean;
  nodeConfigs: Configuration[];
}

const createEmptyConfig = (): Configuration => ({
  serverId: undefined,
  tags: {},
  props: {},
});

// --- State ---
const clusterNodes = ref<{ label: string; value: string }[]>([]);
const pluginGateway = reactive<PluginGateway>({
  runMode: 'single',
  sharedConfig: createEmptyConfig(),
  sharedConfigEnabled: true,
  nodeConfigs: [],
});

// Icons for Toggles
const SingleIcon = createIconifyIcon('lucide:server');
const MultiIcon = createIconifyIcon('lucide:layers');
const SharedIcon = createIconifyIcon('lucide:share-2');
const IndependentIcon = createIconifyIcon('lucide:split');
const CheckIcon = createIconifyIcon('lucide:check');

const runModeOptions = computed(() => {
  return [
    {
      label: $t('gateway.plugin.runModeSingle'),
      value: 'single',
      desc: $t('gateway.plugin.runModeSingleDesc'),
      icon: SingleIcon,
      disabled: props.disabled,
    },
    {
      label: $t('gateway.plugin.runModeMulti'),
      value: 'multi',
      desc: $t('gateway.plugin.runModeMultiDesc'),
      icon: MultiIcon,
      disabled: props.disabled,
    },
  ];
});

const configModeOptions = computed(() => {
  return [
    {
      label: $t('gateway.plugin.sharedConfig'),
      value: true,
      desc: $t('gateway.plugin.sharedEnabled'),
      icon: SharedIcon,
      disabled: props.disabled,
    },
    {
      label: $t('gateway.plugin.configModeIndependent'),
      value: false,
      desc: $t('gateway.plugin.sharedDisabled'),
      icon: IndependentIcon,
      disabled: props.disabled,
    },
  ];
});

const gatewayConfig = ref<Record<string, any>>({});

// --- Refs for Validation ---
const gatewayFormRef = ref();
const sharedFormRef = ref();
const nodeFormRefs = ref<Map<number, any>>(new Map());

function handleNodeRegister(index: number, action: any) {
  if (action) {
    nodeFormRefs.value.set(index, action);
  }
}

// --- Sync with modelValue ---
watch(
  () => props.modelValue,
  (newVal) => {
    // Avoid re-assigning if the values are logically the same as our current state
    // This prevents infinite recursive updates
    const currentLocal = {
      ...gatewayConfig.value,
      pluginGateway: { ...pluginGateway },
    };
    if (JSON.stringify(newVal) === JSON.stringify(currentLocal)) {
      return;
    }

    if (newVal) {
      // 1. Separately handle gateway config (flat)
      const { pluginGateway: pg, ...rest } = newVal;
      gatewayConfig.value = { ...rest };

      // 2. Handle pluginGateway (nested)
      if (pg) {
        Object.assign(pluginGateway, {
          runMode: pg.runMode || 'single',
          sharedConfigEnabled: pg.sharedConfigEnabled !== false,
          sharedConfig: pg.sharedConfig || createEmptyConfig(),
          nodeConfigs: pg.nodeConfigs || [],
        });
      }
    }
  },
  { immediate: true, deep: true },
);

// --- Notify Changes ---
const notifyChange = () => {
  const result = {
    ...gatewayConfig.value,
    pluginGateway: { ...pluginGateway },
  };
  // Avoid unnecessary updates if data is identical
  if (JSON.stringify(result) !== JSON.stringify(props.modelValue)) {
    emit('update:modelValue', result);
  }
};

watch([gatewayConfig, pluginGateway], notifyChange, { deep: true });

// Watch for shared config toggle - inherit config when switching to independent
watch(
  () => pluginGateway.sharedConfigEnabled,
  (newVal, oldVal) => {
    // When switching from shared (true) to independent (false)
    if (
      oldVal === true &&
      newVal === false && // If shared config has data and no node configs exist yet
      pluginGateway.sharedConfig.props &&
      Object.keys(pluginGateway.sharedConfig.props).length > 0 &&
      pluginGateway.nodeConfigs.length === 0
    ) {
      // Create first node config based on shared config
      pluginGateway.nodeConfigs.push({
        serverId: pluginGateway.sharedConfig.serverId,
        tags: { ...pluginGateway.sharedConfig.tags },
        props: structuredClone(pluginGateway.sharedConfig.props),
      });
    }
  },
);

// --- Methods ---
async function fetchNodes() {
  try {
    const res = await getClusterNodes();
    const nodeMap = new Map();

    // Add local node (if present)
    if (res.local) {
      const sid = res.local.serverId || res.local.id;
      if (sid) {
        nodeMap.set(sid, { ...res.local, serverId: sid });
      }
    }

    // Add remote nodes (will overwrite if serverId matches local)
    if (res.nodes) {
      res.nodes.forEach((node) => {
        const sid = node.serverId || node.id;
        if (sid) {
          nodeMap.set(sid, { ...node, serverId: sid });
        }
      });
    }

    clusterNodes.value = [...nodeMap.values()].map((node) => ({
      label: (node.alias || node.serverId || '') as string,
      value: (node.serverId || '') as string,
    }));
  } catch (error) {
    console.error('Failed to fetch cluster nodes:', error);
  }
}

function addNodeConfig() {
  pluginGateway.nodeConfigs.push(createEmptyConfig());
}

function copyNodeConfig(index: number) {
  const sourceConfig = pluginGateway.nodeConfigs[index];
  if (sourceConfig) {
    const copiedConfig: Configuration = {
      serverId: undefined, // Don't copy serverId, user should select new node
      tags: structuredClone(sourceConfig.tags || {}),
      props: structuredClone(sourceConfig.props || {}),
    };
    pluginGateway.nodeConfigs.push(copiedConfig);
  }
}

function removeNodeConfig(index: number) {
  pluginGateway.nodeConfigs.splice(index, 1);
  nodeFormRefs.value.delete(index);
}

// --- Validation ---
async function validate() {
  const tasks: Promise<any>[] = [];

  // 1. Gateway basic config
  if (props.gatewayMetadata && props.gatewayMetadata.length > 0) {
    tasks.push(gatewayFormRef.value?.validate());
  }

  // 2. Plugin config
  if (pluginGateway.runMode === 'single') {
    // Single mode: serverId is required
    if (!pluginGateway.sharedConfig.serverId) {
      message.error($t('gateway.detail.validation.selectNode'));
      throw new Error('Validation failed');
    }
    tasks.push(sharedFormRef.value?.validate());
  } else if (pluginGateway.sharedConfigEnabled) {
    // Multi mode with shared config: serverId NOT required
    tasks.push(sharedFormRef.value?.validate());
  } else {
    // Check nodes serverId
    const invalidNodes = pluginGateway.nodeConfigs
      .map((item, index) => (item.serverId ? null : index + 1))
      .filter((v) => v !== null);

    if (invalidNodes.length > 0) {
      const msg = $t('network.clusterConfig.validateError', {
        nodes: invalidNodes.join(', '),
      });
      message.error(msg);
      throw new Error('Validation failed');
    }

    // Check nested forms
    nodeFormRefs.value.forEach((form) => {
      tasks.push(form.validate());
    });
  }

  await Promise.all(tasks);
  return { ...gatewayConfig.value, pluginGateway: { ...pluginGateway } };
}

onMounted(() => {
  fetchNodes();
  emit('register', { validate });
});

defineExpose({ validate });
</script>

<template>
  <div class="plugin-config-form flex flex-col gap-8">
    <!-- 1. Gateway Common Metadata Form -->
    <div v-if="gatewayMetadata && gatewayMetadata.length > 0">
      <div
        class="mb-4 flex flex-col gap-2"
        v-if="
          !gatewayMetadata[0].name && gatewayMetadata[0].properties.length > 0
        "
      >
        <div class="flex items-center gap-2">
          <div class="h-4 w-1 rounded-sm bg-primary"></div>
          <h2 class="m-0 text-base font-bold text-slate-800 dark:text-gray-100">
            {{ $t('gateway.detail.gatewayBasicConfig') }}
          </h2>
        </div>
      </div>
      <YlConfigMetadataForm
        layout="vertical"
        ref="gatewayFormRef"
        v-model:model-value="gatewayConfig"
        :metadata="gatewayMetadata"
        :disabled="disabled"
      />
    </div>

    <!-- 2. Plugin Specific Layout -->
    <div
      v-if="pluginMetadata && pluginMetadata.length > 0"
      class="flex flex-col gap-8"
    >
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <div class="h-4 w-1 rounded-sm bg-primary"></div>
          <h2 class="m-0 text-base font-bold text-slate-800 dark:text-gray-100">
            {{ $t('gateway.detail.pluginRuntimeConfig') }}
          </h2>
        </div>
      </div>

      <!-- Mode Selection Cards (Run Mode) -->
      <div class="flex flex-col gap-4">
        <span
          class="ml-1 text-xs font-bold uppercase tracking-wider text-slate-400"
        >
          {{ $t('gateway.plugin.runMode') }}
        </span>
        <div class="flex w-full gap-4">
          <div
            v-for="item in runModeOptions"
            :key="item.value"
            class="relative flex flex-1 cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-300"
            :class="[
              pluginGateway.runMode === item.value
                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                : 'border-slate-100 bg-white hover:border-primary/50 dark:border-slate-800 dark:bg-slate-900/50',
              disabled ? 'pointer-events-none opacity-60 grayscale' : '',
            ]"
            @click="!disabled && (pluginGateway.runMode = item.value as any)"
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :class="[
                pluginGateway.runMode === item.value
                  ? 'bg-primary text-white'
                  : 'bg-slate-50 text-slate-400 dark:bg-slate-800',
              ]"
            >
              <component :is="item.icon" class="size-5" />
            </div>
            <div class="flex min-w-0 flex-col gap-1">
              <span
                class="text-sm font-bold"
                :class="
                  pluginGateway.runMode === item.value
                    ? 'text-primary'
                    : 'text-slate-700 dark:text-gray-200'
                "
              >
                {{ item.label }}
              </span>
              <span class="text-[11px] leading-relaxed text-slate-400">{{
                item.desc
              }}</span>
            </div>
            <div
              v-if="pluginGateway.runMode === item.value"
              class="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm ring-2 ring-white dark:ring-slate-900"
            >
              <CheckIcon class="size-3" stroke-width="3" />
            </div>
          </div>
        </div>
      </div>

      <!-- Config Mode Cards (only if multi) -->
      <div
        v-if="pluginGateway.runMode === 'multi'"
        class="flex flex-col gap-4 duration-300 animate-in fade-in slide-in-from-top-2"
      >
        <span
          class="ml-1 text-xs font-bold uppercase tracking-wider text-slate-400"
        >
          {{ $t('gateway.plugin.configMode') }}
        </span>
        <div class="flex w-full gap-4">
          <div
            v-for="item in configModeOptions"
            :key="String(item.value)"
            class="relative flex flex-1 cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-300"
            :class="[
              pluginGateway.sharedConfigEnabled === item.value
                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                : 'border-slate-100 bg-white hover:border-primary/50 dark:border-slate-800 dark:bg-slate-900/50',
              disabled ? 'pointer-events-none opacity-60 grayscale' : '',
            ]"
            @click="
              !disabled && (pluginGateway.sharedConfigEnabled = item.value)
            "
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :class="[
                pluginGateway.sharedConfigEnabled === item.value
                  ? 'bg-primary text-white'
                  : 'bg-slate-50 text-slate-400 dark:bg-slate-800',
              ]"
            >
              <component :is="item.icon" class="size-5" />
            </div>
            <div class="flex min-w-0 flex-col gap-1">
              <span
                class="text-sm font-bold"
                :class="
                  pluginGateway.sharedConfigEnabled === item.value
                    ? 'text-primary'
                    : 'text-slate-700 dark:text-gray-200'
                "
              >
                {{ item.label }}
              </span>
              <span class="text-[11px] leading-relaxed text-slate-400">{{
                item.desc
              }}</span>
            </div>
            <div
              v-if="pluginGateway.sharedConfigEnabled === item.value"
              class="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm ring-2 ring-white dark:ring-slate-900"
            >
              <CheckIcon class="size-3" stroke-width="3" />
            </div>
          </div>
        </div>
      </div>

      <!-- Config Form Content -->
      <div class="flex flex-col gap-4">
        <!-- Single Mode or Shared Multi Mode -->
        <div
          v-if="
            pluginGateway.runMode === 'single' ||
            pluginGateway.sharedConfigEnabled
          "
          class="flex flex-col gap-4"
        >
          <ACard
            size="small"
            class="relative overflow-visible border-slate-100 shadow-sm dark:border-slate-800"
          >
            <template #title>
              <div class="flex items-center gap-2 py-0.5">
                <ServerIcon class="size-4 text-primary" />
                <span
                  class="text-sm font-bold text-slate-700 dark:text-gray-300"
                >
                  {{
                    pluginGateway.runMode === 'single'
                      ? $t('gateway.plugin.singleConfig')
                      : $t('gateway.plugin.globalConfig')
                  }}
                </span>
                <div
                  v-if="pluginGateway.runMode === 'single'"
                  class="ml-4 flex items-center gap-2"
                >
                  <span class="text-destructive">*</span>
                  <ASelect
                    v-model:value="pluginGateway.sharedConfig.serverId"
                    :options="clusterNodes"
                    :placeholder="
                      pluginGateway.runMode === 'single'
                        ? $t('network.clusterConfig.assignNode')
                        : $t('network.clusterConfig.assignNode')
                    "
                    size="small"
                    class="w-[240px]"
                    :bordered="false"
                    :disabled="disabled"
                  />
                </div>
              </div>
            </template>
            <YlConfigMetadataForm
              layout="vertical"
              ref="sharedFormRef"
              v-model:model-value="pluginGateway.sharedConfig.props"
              :metadata="pluginMetadata"
              class="p-2"
              :disabled="disabled"
            />
          </ACard>
        </div>

        <!-- Independent Multi Mode -->
        <div
          v-else
          class="flex flex-col gap-4 duration-300 animate-in fade-in slide-in-from-bottom-2"
        >
          <div
            v-if="pluginGateway.nodeConfigs.length > 0"
            class="flex flex-col gap-4"
          >
            <ACollapse :bordered="false" class="bg-transparent">
              <ACollapsePanel
                v-for="(node, index) in pluginGateway.nodeConfigs"
                :key="index"
                class="mb-4 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
              >
                <template #header>
                  <div class="flex items-center gap-2 py-0.5">
                    <ServerIcon class="size-4 text-primary" />
                    <span
                      class="text-sm font-bold text-slate-700 dark:text-gray-300"
                    >
                      {{ $t('network.clusterConfig.nodePrefix')
                      }}{{ index + 1 }}
                    </span>
                    <div class="ml-4 flex items-center gap-2" @click.stop>
                      <span class="text-destructive">*</span>
                      <ASelect
                        v-model:value="node.serverId"
                        :options="clusterNodes"
                        :placeholder="$t('network.clusterConfig.assignNode')"
                        size="small"
                        class="w-[200px]"
                        :bordered="false"
                        :disabled="disabled"
                      />
                    </div>
                  </div>
                </template>
                <template #extra>
                  <div class="flex items-center gap-2">
                    <AButton
                      type="text"
                      size="small"
                      class="flex items-center text-primary hover:text-primary/80"
                      @click.stop="copyNodeConfig(index)"
                      :disabled="disabled"
                    >
                      <template #icon><CopyIcon class="size-3.5" /></template>
                      <span class="ml-1 text-[11px]">{{
                        $t('common.copy')
                      }}</span>
                    </AButton>
                    <APopconfirm
                      :title="$t('common.action.confirmDelete')"
                      @confirm="removeNodeConfig(index)"
                    >
                      <AButton
                        type="text"
                        size="small"
                        danger
                        class="flex items-center"
                        @click.stop
                      >
                        <template #icon>
                          <TrashIcon class="size-3.5" />
                        </template>
                        <span class="ml-1 text-[11px]">{{
                          $t('network.clusterConfig.removeNode')
                        }}</span>
                      </AButton>
                    </APopconfirm>
                  </div>
                </template>

                <YlConfigMetadataForm
                  v-model:model-value="node.props"
                  :register="(action: any) => handleNodeRegister(index, action)"
                  :metadata="pluginMetadata"
                  class="p-4"
                  :disabled="disabled"
                />
              </ACollapsePanel>
            </ACollapse>
          </div>

          <div
            v-if="pluginGateway.nodeConfigs.length === 0"
            class="rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/20 py-10 text-center dark:border-gray-800"
          >
            <AEmpty :description="$t('network.clusterConfig.empty')">
              <AButton type="primary" size="small" @click="addNodeConfig">
                <template #icon><PlusIcon class="size-4" /></template>
                {{ $t('network.clusterConfig.addNode') }}
              </AButton>
            </AEmpty>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plugin-config-form :deep(.ant-card-head) {
  border-bottom: 1px solid hsl(var(--border));
}

.plugin-config-form :deep(.ant-form-item) {
  margin-bottom: 16px;
}

/* Collapse Panel Styling */
.plugin-config-form :deep(.ant-collapse-item) {
  margin-bottom: 16px;
  overflow: hidden;
  border-radius: 12px !important;
}

.plugin-config-form :deep(.ant-collapse-header) {
  align-items: center !important;
  padding: 12px 16px !important;
  background: hsl(var(--muted) / 30%) !important;
  border-bottom: 1px solid hsl(var(--border)) !important;
}

.plugin-config-form :deep(.ant-collapse-header .ant-collapse-arrow) {
  display: flex;
  align-items: center;
  padding: 0 !important;
  margin-top: 0 !important;
}

.plugin-config-form :deep(.ant-collapse-content) {
  background: hsl(var(--background)) !important;
}

.plugin-config-form :deep(.ant-collapse-content-box) {
  padding: 0 !important;
}
</style>
