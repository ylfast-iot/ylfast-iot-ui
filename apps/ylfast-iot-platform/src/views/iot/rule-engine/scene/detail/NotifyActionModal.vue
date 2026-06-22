<script setup lang="ts">
import type { SceneRuleModel } from './types';

import type { SceneAction } from '#/api/iot/rule-engine/types';

import { computed, ref, watch } from 'vue';

import { Button, Modal, Steps } from 'ant-design-vue';

import { IotNotifyConfigApi } from '#/api/iot/notify/config';
import { getTemplateDetail } from '#/api/iot/notify/template';

import NotifyConfigStep from './notify/NotifyConfigStep.vue';
import NotifyTemplateStep from './notify/NotifyTemplateStep.vue';
import NotifyTypeStep from './notify/NotifyTypeStep.vue';
import NotifyVariableStep from './notify/NotifyVariableStep.vue';

const props = defineProps<{
  action?: SceneAction;
  actionId: number;
  actionIndex?: number;
  branchIndex?: number;
  groupIndex?: number;
  open: boolean;
  scene?: SceneRuleModel;
}>();

const emit = defineEmits<{
  save: [value: SceneAction];
  'update:open': [value: boolean];
}>();

const current = ref(0);
const notifyType = ref('');
const notifierId = ref('');
const templateId = ref('');
const configDetail = ref<any>();
const templateDetail = ref<any>();
const variableDefinitions = ref<any[]>([]);
const variables = ref<Record<string, any>>({});
const actionOptions = ref<Record<string, any>>({});
const variableRef = ref<any>();

const actionNotify = computed(() => props.action?.notify || {});
const stepItems = [
  { title: '通知方式' },
  { title: '通知配置' },
  { title: '通知模板' },
  { title: '模板变量' },
];

function closeModal() {
  emit('update:open', false);
}

function resetTemplateState() {
  templateId.value = '';
  templateDetail.value = undefined;
  variableDefinitions.value = [];
  variables.value = {};
}

function resetConfigState() {
  notifierId.value = '';
  configDetail.value = undefined;
  resetTemplateState();
}

async function loadConfigDetail(id: string) {
  if (!id) return undefined;
  return IotNotifyConfigApi.basicCrudApis.getById(id);
}

async function loadTemplateDetail(id: string) {
  if (!id) return undefined;
  return getTemplateDetail(id);
}

async function initFromAction() {
  notifyType.value = actionNotify.value.notifyType || '';
  notifierId.value = actionNotify.value.notifierId || '';
  templateId.value = actionNotify.value.templateId || '';
  variables.value = { ...actionNotify.value.variables };
  actionOptions.value = { ...props.action?.options };
  configDetail.value = undefined;
  templateDetail.value = undefined;
  variableDefinitions.value = [];

  if (notifierId.value) {
    configDetail.value = await loadConfigDetail(notifierId.value);
  }

  if (templateId.value) {
    templateDetail.value = await loadTemplateDetail(templateId.value);
    variableDefinitions.value =
      templateDetail.value?.varDefs ||
      templateDetail.value?.variableDefinitions ||
      [];
  }

  if (templateId.value) {
    current.value = 3;
  } else if (notifierId.value) {
    current.value = 2;
  } else if (notifyType.value) {
    current.value = 1;
  } else {
    current.value = 0;
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    await initFromAction();
  },
);

function handleTypeSelect(value: string) {
  notifyType.value = value;
  resetConfigState();
  current.value = 1;
}

function handleConfigSelect(config: any) {
  configDetail.value = config;
  notifierId.value = config?.id || '';
  if (config?.type) {
    notifyType.value = config.type === 'weixin' ? 'wechat' : config.type;
  }
  resetTemplateState();
  current.value = 2;
}

function handleTemplateSelect(template: any) {
  templateDetail.value = template;
  templateId.value = template?.id || '';
  variableDefinitions.value =
    template?.varDefs || template?.variableDefinitions || [];
  variables.value =
    actionNotify.value.templateId === template?.id
      ? { ...actionNotify.value.variables }
      : {};
  current.value = 3;
}

function handleNext() {
  if (current.value === 0 && notifyType.value) {
    current.value = 1;
    return;
  }
  if (current.value === 1 && notifierId.value) {
    current.value = 2;
    return;
  }
  if (current.value === 2 && templateId.value) {
    current.value = 3;
  }
}

function handleVariableMetaChange(payload: Record<string, any>) {
  actionOptions.value = {
    ...actionOptions.value,
    ...payload,
  };
}

async function handleOk() {
  const variableData =
    current.value >= 3 ? (await variableRef.value?.onSave?.()) || {} : {};

  emit('save', {
    actionId: props.action?.actionId || props.actionId,
    executor: 'notify',
    notify: {
      notifierId: notifierId.value,
      notifyType: notifyType.value,
      templateId: templateId.value,
      variables: variableData,
    },
    options: {
      ...actionOptions.value,
      configName: configDetail.value?.name,
      name: '消息通知',
      notifyType: notifyType.value,
      templateName: templateDetail.value?.name,
    },
    terms: props.action?.terms || [],
  });
  closeModal();
}
</script>

<template>
  <Modal
    :open="open"
    title="执行动作"
    width="980px"
    :destroy-on-close="true"
    :mask-closable="false"
    :body-style="{
      height: '60vh',
      overflow: 'hidden',
      padding: '20px 24px 12px',
    }"
    wrap-class-name="scene-notify-modal"
    @cancel="closeModal"
  >
    <div class="notify-modal-shell">
      <Steps
        :current="current"
        size="small"
        class="notify-steps"
        :items="stepItems"
      />

      <div class="notify-modal-body">
        <div v-show="current === 0" class="notify-step-pane">
          <NotifyTypeStep
            v-model:value="notifyType"
            @select="handleTypeSelect"
          />
        </div>

        <div v-show="current === 1" class="notify-step-pane">
          <NotifyConfigStep
            :notify-type="notifyType"
            :value="configDetail"
            @select="handleConfigSelect"
            @update:value="configDetail = $event"
          />
        </div>

        <div v-show="current === 2" class="notify-step-pane">
          <NotifyTemplateStep
            :notify-type="notifyType"
            :notifier-id="notifierId"
            :value="templateDetail"
            @select="handleTemplateSelect"
            @update:value="templateDetail = $event"
            @detail="templateDetail = $event"
          />
        </div>

        <div v-show="current === 3" class="notify-step-pane variable-pane">
          <NotifyVariableStep
            ref="variableRef"
            v-model="variables"
            :action-index="props.actionIndex ?? 0"
            :branch-index="branchIndex"
            :group-index="groupIndex"
            :notify-type="notifyType"
            :notifier-id="notifierId"
            :options="actionOptions"
            :scene="scene"
            :template-detail="templateDetail"
            :variable-definitions="variableDefinitions"
            @change="handleVariableMetaChange"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <Button @click="closeModal">取消</Button>
      <Button v-if="current > 0" @click="current -= 1">上一步</Button>
      <Button
        v-if="current < 3"
        type="primary"
        :disabled="
          (current === 0 && !notifyType) ||
          (current === 1 && !notifierId) ||
          (current === 2 && !templateId)
        "
        @click="handleNext"
      >
        下一步
      </Button>
      <Button v-else type="primary" @click="handleOk">确定</Button>
    </template>
  </Modal>
</template>

<style scoped>
.notify-modal-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.notify-steps {
  padding: 0 4px;
  margin-bottom: 22px;
}

.notify-modal-body {
  height: calc(60vh - 116px);
  padding: 18px;
  overflow: hidden;
  background: #fafafa;
  border-radius: 16px;
}

.notify-step-pane {
  height: 100%;
  padding-bottom: 8px;
  overflow: auto;
}

.variable-pane {
  padding-right: 4px;
  overflow: auto;
}
</style>
