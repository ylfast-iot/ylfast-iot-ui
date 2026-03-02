<script setup lang="ts">
import type { PropertyMetadata } from '#/types/metadata';

import { computed, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import { Button, message, Modal, Steps } from 'ant-design-vue';

import {
  getChannelProviders,
  getNotifyVariables,
  IotNotifyChannelApi,
  saveProviderChannels,
} from '#/api/iot/notify/channel';
import { IotNotifyConfigApi } from '#/api/iot/notify/config';
import {
  getTemplateDetail,
  IotNotifyTemplateApi,
} from '#/api/iot/notify/template';
// 子组件
import RoleSelector from '#/components/business/system/role-selector.vue';
import { NOTIFY_PROVIDER_ENUMS } from '#/enums/notify';

import StepComplete from './wizard/StepComplete.vue';
import StepConfigVars from './wizard/StepConfigVars.vue';
import StepSelectConfig from './wizard/StepSelectConfig.vue';
import StepSelectProvider from './wizard/StepSelectProvider.vue';
import StepSelectTemplate from './wizard/StepSelectTemplate.vue';

const props = defineProps<{
  data?: IotNotifyChannelApi.NotifySubscriberChannel | null;
  mode?: 'add' | 'edit';
  open: boolean;
  providerId: string;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [boolean];
}>();

const Step = Steps.Step;

// 流程控制
const currentStep = ref(0);
const saving = ref(false);

// 状态汇总
const selectedProvider = ref('');
const providerOptions = ref<any[]>([]);
const providerLoading = ref(false);

const selectedNotifierId = ref('');
const selectedNotifierRow = ref<any>(null);

const selectedTemplateId = ref('');
const selectedTemplateRow = ref<any>(null);

const varDefs = ref<IotNotifyTemplateApi.VarDef[]>([]);
const variables = ref<Record<string, any>>({});
const builtinVars = ref<PropertyMetadata[]>([]);
const varLoading = ref(false);
const templateDetail = ref<any>(null);

const roleIds = ref<string[]>([]);
const channelName = ref('');

/**
 * 校验每一步是否已配置
 */
const stepStatus = computed(() => {
  // Step 3 变量校验逻辑
  const isVarsValid = varDefs.value.every((v) => {
    if (!v.required) return true;
    const variable = variables.value[v.id];
    if (!variable) return false;
    if (variable.source === 'upper') {
      return !!variable.upperKey;
    }
    // fixed 模式，校验 value
    return (
      variable.value !== undefined &&
      variable.value !== null &&
      variable.value !== ''
    );
  });

  const status = [
    !!selectedProvider.value, // Step 0
    !!selectedNotifierId.value, // Step 1
    !!selectedTemplateId.value, // Step 2
    !!selectedTemplateId.value && isVarsValid, // Step 3 (选了模板且变量有效才算完成)
    !!selectedTemplateId.value, // Step 4 (选了模板才算开启权限配置)
    !!channelName.value.trim(), // Step 5
  ];
  return status;
});

/**
 * 处理步骤点击跳转
 */
const handleStepChange = async (targetStep: number) => {
  // 已经是当前步，不做处理
  if (targetStep === currentStep.value) return;

  // 校验是否允许跳转到目标步
  // 规则：可以跳回之前的步，或者跳转到所有前置步骤都已配置的步
  let canJump = true;
  for (let i = 0; i < targetStep; i++) {
    if (!stepStatus.value[i]) {
      canJump = false;
      break;
    }
  }

  if (canJump) {
    // 如果目标是第4步（变量），确保加载了变量定义
    if (targetStep === 3 && currentStep.value < 3) {
      await loadTemplateVars();
    }
    currentStep.value = targetStep;
  }
};

const steps = computed(() => [
  { title: $t('subscription.wizard.steps.selectProvider') },
  { title: $t('subscription.wizard.steps.selectConfig') },
  { title: $t('subscription.wizard.steps.selectTemplate') },
  { title: $t('subscription.wizard.steps.configVars') },
  { title: $t('subscription.wizard.steps.configPermission') },
  { title: $t('subscription.wizard.steps.complete') },
]);

const canNext = computed(() => {
  return stepStatus.value[currentStep.value] || false;
});

/** 加载通知方式 */
async function loadProviders() {
  providerLoading.value = true;
  try {
    const data = await getChannelProviders();
    providerOptions.value = data
      .filter((p) => p.id !== 'inside-mail')
      .map((p) => {
        const conf = Object.values(NOTIFY_PROVIDER_ENUMS).find(
          (c: any) => c.subscriberProviderId === p.id,
        );
        return {
          label: conf?.label || p.name,
          value: p.id,
          icon: conf?.icon || 'lucide:bell',
          color: conf?.color || 'blue',
        };
      });
  } finally {
    providerLoading.value = false;
  }
}

/** 加载变量定义 */
async function loadTemplateVars() {
  if (!selectedTemplateId.value) return;
  varLoading.value = true;
  try {
    const detail = await getTemplateDetail(selectedTemplateId.value);
    const definitions = detail.varDefs || [];
    varDefs.value = definitions;

    // 获取当前提供商配置
    const providerEnum = Object.values(NOTIFY_PROVIDER_ENUMS).find(
      (e) =>
        e.value === selectedProvider.value ||
        e.subscriberProviderId === selectedProvider.value,
    );

    const autoVarIds = new Set<string>();

    // 1. 获取自动填充的类型列表 (逻辑对齐老版本)
    const getType =
      selectedProvider.value === 'notifier-dingTalk'
        ? ['user', 'tag']
        : ['user', 'org', 'tag'];

    // 2. 收集需要自动填充的 ID (业务类型匹配者)
    for (const v of definitions) {
      const bizType = v.type?.expands?.businessType || v.type?.type || '';
      if (getType.includes(bizType as string)) {
        autoVarIds.add(v.id);
      }
    }

    // 3. 直接加入提供商指定的 userField
    if (providerEnum?.userField) {
      autoVarIds.add(providerEnum.userField);
    }

    const mergedVariables: Record<string, any> = { ...variables.value };

    // 4. 确保模板定义的所有变量及其自动填充逻辑都被应用
    for (const v of definitions) {
      const id = v.id;
      // 只有在变量不存在时才应用默认值或自动填充
      if (!mergedVariables[id]) {
        mergedVariables[id] = autoVarIds.has(id)
          ? {
              source: 'relation',
              relation: {
                objectType: 'user',
                objectSource: {
                  source: 'upper',
                  upperKey: 'subscriber',
                },
              },
            }
          : {
              source: 'fixed',
              value: v.defaultValue || '',
            };
      }
    }

    // 5. 确保 autoVarIds 中的字段也被自动填充（针对模板中未定义但 provider 要求的字段）
    for (const id of autoVarIds) {
      if (!mergedVariables[id]) {
        mergedVariables[id] = {
          source: 'relation',
          relation: {
            objectType: 'user',
            objectSource: {
              source: 'upper',
              upperKey: 'subscriber',
            },
          },
        };
      }
    }

    variables.value = mergedVariables;
    if (props.providerId) {
      builtinVars.value = await getNotifyVariables(props.providerId);
    }
  } finally {
    varLoading.value = false;
  }
}

async function handleNext() {
  if (currentStep.value === 2) await loadTemplateVars();
  currentStep.value++;
}

function handlePrev() {
  if (currentStep.value > 0) currentStep.value--;
}

function handleCancel() {
  emit('update:open', false);
}

async function handleSave() {
  saving.value = true;
  try {
    const channel: IotNotifyChannelApi.NotifySubscriberChannel = {
      id: props.data?.id, // 关键：编辑模式下保留原其 ID
      providerId: props.providerId,
      name: channelName.value.trim(),
      channelProvider: selectedProvider.value,
      channelConfiguration: {
        notifierId: selectedNotifierId.value,
        templateId: selectedTemplateId.value,
        variables: variables.value,
      },
      grant: { role: { idList: roleIds.value } },
      i18nMessages: {
        ...props.data?.i18nMessages,
        name: {
          ...props.data?.i18nMessages?.name,
          zh_CN: channelName.value.trim(),
          en_US:
            props.data?.i18nMessages?.name?.en_US || channelName.value.trim(),
        },
      },
    };
    await saveProviderChannels(props.providerId, [channel]);
    message.success($t('subscription.saveSuccess'));
    emit('success');
  } finally {
    saving.value = false;
  }
}

function resetState() {
  currentStep.value = 0;
  selectedProvider.value = '';
  selectedNotifierId.value = '';
  selectedNotifierRow.value = null;
  selectedTemplateId.value = '';
  selectedTemplateRow.value = null;
  varDefs.value = [];
  variables.value = {};
  builtinVars.value = [];
  roleIds.value = [];
  channelName.value = '';
}

/** 回显数据 */
async function echoData() {
  if (!props.data) return;
  const d = props.data;
  selectedProvider.value = d.channelProvider;
  const config = d.channelConfiguration;
  selectedNotifierId.value = config.notifierId;
  selectedTemplateId.value = config.templateId;
  variables.value = config.variables || {};
  roleIds.value = d.grant?.role?.idList || [];
  channelName.value = d.name || '';

  // 预加载必要数据
  if (selectedNotifierId.value) {
    try {
      selectedNotifierRow.value =
        await IotNotifyConfigApi.basicCrudApis.getById(
          selectedNotifierId.value,
        );
    } catch (error) {
      console.error(error);
    }
  }

  if (selectedTemplateId.value) {
    varLoading.value = true;
    try {
      // 获取模板详情 (含完整变量定义)
      const detail = await IotNotifyTemplateApi.basicCrudApis.getById(
        selectedTemplateId.value,
      );
      templateDetail.value = detail;
      selectedTemplateRow.value = detail;
      varDefs.value = detail.varDefs || [];
    } finally {
      varLoading.value = false;
    }
  }
}

watch(
  () => props.open,
  async (val) => {
    if (val) {
      resetState();
      await loadProviders();
      if (props.mode === 'edit') {
        await echoData();
      }
    }
  },
  { immediate: true },
);

// 过滤逻辑
const configFilterTerms = computed(() => {
  const terms = [
    { column: 'provider', termType: 'not', value: 'dingTalkRobotWebHook' },
  ];
  if (selectedProvider.value) {
    const p = Object.values(NOTIFY_PROVIDER_ENUMS).find(
      (i) => i.subscriberProviderId === selectedProvider.value,
    )?.value;
    if (p) terms.push({ column: 'provider', termType: 'eq', value: p });
  }
  return terms;
});

const templateFilterTerms = computed(() => {
  if (!selectedNotifierId.value) return [];
  return [
    { column: 'configId', termType: 'eq', value: selectedNotifierId.value },
  ];
});

function handleConfigSelection(rows: any[]) {
  const row = rows[0];
  if (row) {
    selectedNotifierId.value = row.id;
    selectedNotifierRow.value = row;
    selectedTemplateId.value = '';
    selectedTemplateRow.value = null;
  } else {
    selectedNotifierId.value = '';
    selectedNotifierRow.value = null;
  }
}

function handleTemplateSelection(rows: any[]) {
  const row = rows[0];
  if (row) {
    selectedTemplateId.value = row.id;
    selectedTemplateRow.value = row;
  } else {
    selectedTemplateId.value = '';
    selectedTemplateRow.value = null;
  }
}
</script>

<template>
  <Modal
    :open="open"
    :mask-closable="false"
    :title="$t('subscription.wizard.title')"
    :width="1100"
    :footer="null"
    destroy-on-close
    @cancel="handleCancel"
  >
    <div class="flex flex-col gap-6 p-2">
      <Steps
        :current="currentStep"
        size="small"
        type="navigation"
        @change="handleStepChange"
      >
        <Step
          v-for="(s, i) in steps"
          :key="i"
          :title="s.title"
          :status="
            i === currentStep ? 'process' : i < currentStep ? 'finish' : 'wait'
          "
        />
      </Steps>

      <div class="min-h-[350px] rounded-lg border border-border bg-card p-6">
        <!-- 步骤 1 -->
        <StepSelectProvider
          v-if="currentStep === 0"
          v-model:value="selectedProvider"
          :options="providerOptions"
          :loading="providerLoading"
        />

        <!-- 步骤 2 -->
        <StepSelectConfig
          v-else-if="currentStep === 1"
          :selected-row="selectedNotifierRow"
          :filter-terms="configFilterTerms"
          @change="handleConfigSelection"
        />

        <!-- 步骤 3 -->
        <StepSelectTemplate
          v-else-if="currentStep === 2"
          :selected-row="selectedTemplateRow"
          :filter-terms="templateFilterTerms"
          @change="handleTemplateSelection"
        />

        <!-- 步骤 4 -->
        <StepConfigVars
          v-else-if="currentStep === 3"
          :var-defs="varDefs"
          v-model:variables="variables"
          :builtin-vars="builtinVars"
          :selected-provider="selectedProvider"
          :loading="varLoading"
        />

        <!-- 步骤 5 -->
        <div v-else-if="currentStep === 4">
          <p class="mb-4 text-sm text-muted-foreground">
            {{ $t('subscription.wizard.configPermissionTip') }}
          </p>
          <RoleSelector v-model:value="roleIds" max-height="300px" />
        </div>

        <!-- 步骤 6 -->
        <StepComplete
          v-else-if="currentStep === 5"
          v-model:channel-name="channelName"
          :selected-provider="selectedProvider"
          :selected-notifier-id="selectedNotifierId"
          :selected-template-id="selectedTemplateId"
          :selected-role-count="roleIds.length"
          :variables="variables"
          :var-defs="varDefs"
          :template-detail="templateDetail"
          :role-ids="roleIds"
          :mode="mode"
        />
      </div>

      <!-- 底部控制 -->
      <div class="flex items-center justify-end gap-3">
        <Button @click="handleCancel">{{ $t('common.action.cancel') }}</Button>
        <Button v-if="currentStep > 0" @click="handlePrev">
          {{ $t('common.action.prev') || '上一步' }}
        </Button>
        <Button
          v-if="currentStep < 5"
          type="primary"
          :disabled="!canNext"
          @click="handleNext"
        >
          {{ $t('common.action.next') || '下一步' }}
        </Button>
        <Button
          v-if="currentStep === 5"
          type="primary"
          :loading="saving"
          :disabled="!canNext"
          @click="handleSave"
        >
          {{ $t('common.action.save') || '保存' }}
        </Button>
      </div>
    </div>
  </Modal>
</template>
