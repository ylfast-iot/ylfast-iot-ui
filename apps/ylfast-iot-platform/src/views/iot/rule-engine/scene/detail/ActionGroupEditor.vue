<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import type { SceneActionExecutor, SceneRuleModel } from './types';

import type { RuleEngineSceneUtilsApi } from '#/api/iot/rule-engine/scene-utils';
import type { SceneAction, SceneActions } from '#/api/iot/rule-engine/types';

import { computed, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { Button, Collapse, Empty, Modal, Tag } from 'ant-design-vue';

import { parseSceneVariables } from '#/api/iot/rule-engine/scene-utils';

import ActionTypeModal from './ActionTypeModal.vue';
import AlarmActionModal from './AlarmActionModal.vue';
import DelayActionModal from './DelayActionModal.vue';
import DeviceActionModal from './DeviceActionModal.vue';
import DeviceInfoActionModal from './DeviceInfoActionModal.vue';
import NotifyActionModal from './NotifyActionModal.vue';
import TermEditor from './TermEditor.vue';
import {
  actionName,
  getAlarmBindings,
  nextActionId,
  variableTreeToTermColumns,
} from './utils';

const props = defineProps<{
  actionSupports: RuleEngineSceneUtilsApi.SceneActionInfo[];
  branchIndex: number;
  group: SceneActions;
  groupIndex: number;
  scene: SceneRuleModel;
  termColumns: any[];
}>();

const emit = defineEmits<{
  changed: [];
  'update:scene': [value: SceneRuleModel];
}>();

const CollapsePanel = Collapse.Panel;

const typeOpen = ref(false);
const delayOpen = ref(false);
const alarmOpen = ref(false);
const deviceOpen = ref(false);
const deviceInfoOpen = ref(false);
const notifyOpen = ref(false);
const editingIndex = ref<number>();
const editingAction = ref<SceneAction>();
const alarmMode = ref<'relieve' | 'trigger'>('trigger');
const activeKeys = ref(['group']);

const PlusIcon = createIconifyIcon('lucide:plus');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const EditIcon = createIconifyIcon('lucide:pencil');
const BellIcon = createIconifyIcon('lucide:bell');
const ClockIcon = createIconifyIcon('lucide:clock-3');
const DatabaseIcon = createIconifyIcon('lucide:database');
const MegaphoneIcon = createIconifyIcon('lucide:megaphone');
const SirenIcon = createIconifyIcon('lucide:siren');
const CpuIcon = createIconifyIcon('lucide:cpu');

const iconMap = {
  alarm: SirenIcon,
  delay: ClockIcon,
  device: CpuIcon,
  'device-data': DatabaseIcon,
  notify: MegaphoneIcon,
} as const;

const actionList = computed(() => props.group.actions || []);
const serialConditionColumns = ref<Record<number, any[]>>({});
let latestRequestKey: symbol | undefined;
const alarmTargetType = computed<'collector' | 'device' | 'scene'>(() => {
  if (props.scene.trigger?.type === 'device') {
    return 'device';
  }
  return 'scene';
});

const actionContextSignature = computed(() =>
  JSON.stringify(actionList.value.map(({ terms: _terms, ...rest }) => rest)),
);

watch(
  () => [
    props.branchIndex,
    props.groupIndex,
    props.group.parallel,
    actionList.value.length,
    actionContextSignature.value,
  ],
  async () => {
    if (props.group.parallel || actionList.value.length <= 1) {
      serialConditionColumns.value = {};
      return;
    }

    const requestKey = Symbol('serial-condition-columns');
    latestRequestKey = requestKey;

    const entries = await Promise.all(
      actionList.value.map(async (_action, index) => {
        if (index >= actionList.value.length - 1) {
          return [index, []] as const;
        }
        const variables = await parseSceneVariables(props.scene, {
          action: index,
          branch: props.branchIndex,
          branchGroup: props.groupIndex,
        });
        return [index, variableTreeToTermColumns(variables || [])] as const;
      }),
    );

    if (latestRequestKey !== requestKey) {
      return;
    }

    serialConditionColumns.value = Object.fromEntries(entries);
  },
  { immediate: true },
);

function openTypeModal() {
  editingIndex.value = undefined;
  editingAction.value = undefined;
  typeOpen.value = true;
}

function openActionModal(
  executor: SceneActionExecutor,
  mode?: 'relieve' | 'trigger',
) {
  alarmMode.value = mode || 'trigger';
  if (executor === 'delay') delayOpen.value = true;
  if (executor === 'alarm') alarmOpen.value = true;
  if (executor === 'device') deviceOpen.value = true;
  if (executor === 'device-data') deviceInfoOpen.value = true;
  if (executor === 'notify') notifyOpen.value = true;
}

function editAction(action: SceneAction, index: number) {
  editingIndex.value = index;
  editingAction.value = action;
  openActionModal(action.executor as SceneActionExecutor, action.alarm?.mode);
}

function saveAction(action: SceneAction) {
  const actions = props.group.actions || [];
  if (editingIndex.value === undefined) {
    actions.push(action);
  } else {
    actions.splice(editingIndex.value, 1, action);
  }
  props.group.actions = actions;
  emit('update:scene', props.scene);
  emit('changed');
}

function removeAction(index: number) {
  Modal.confirm({
    title: '删除动作',
    content: '删除后当前动作配置将丢失，是否继续？',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => {
      const actions = props.group.actions || [];
      if (index < 0 || index >= actions.length) return;
      actions.splice(index, 1);
      props.group.actions = [...actions];
      if (editingIndex.value === index) {
        editingIndex.value = undefined;
        editingAction.value = undefined;
      }
      emit('update:scene', props.scene);
      emit('changed');
    },
  });
}

function updateTerms(action: SceneAction, terms: any[]) {
  action.terms = terms;
  emit('update:scene', props.scene);
  emit('changed');
}

function delayUnitText(unit?: string) {
  if (unit === 'hours') return '小时';
  if (unit === 'seconds') return '秒';
  return '分钟';
}

function actionSummary(action: SceneAction) {
  if (action.executor === 'delay') {
    return `${action.delay?.time || 0}${delayUnitText(action.delay?.unit)}后，执行后续动作`;
  }
  if (action.executor === 'alarm') {
    const alarms = getAlarmBindings(action);
    if (alarms.length === 0) {
      return `${action.alarm?.mode === 'relieve' ? '解除' : '触发'} 告警`;
    }
    if (alarms.length === 1) {
      return `${action.alarm?.mode === 'relieve' ? '解除' : '触发'} ${alarms[0]?.alarmName || '告警'}`;
    }
    return `${action.alarm?.mode === 'relieve' ? '解除' : '触发'} ${alarms.length} 条告警`;
  }
  if (action.executor === 'device-data') {
    const selectedNames = (action.configuration?.selector?.selectorValues || [])
      .map((item: any) => item?.name || item?.value)
      .filter(Boolean);
    if (selectedNames.length > 0) {
      return `获取 ${selectedNames.join(' / ')} 的设备信息`;
    }
    const productName =
      action.options?.productName ||
      action.configuration?.productName ||
      '设备';
    return `获取 ${productName} 的设备信息`;
  }
  if (action.executor === 'device') {
    return (
      action.options?.summary || action.options?.name || '执行设备输出动作'
    );
  }
  if (action.executor === 'notify') {
    return `${action.options?.configName || '通知配置'} / ${action.options?.templateName || '通知模板'}`;
  }
  return action.options?.name || actionName(action);
}

function deviceDataSummary(action: SceneAction) {
  const targetName = action.options?.targetName;
  if (targetName) {
    return `获取 ${targetName} 的设备信息`;
  }
  const selectedNames = (
    action.options?.deviceNames ||
    action.configuration?.selector?.selectorValues ||
    []
  )
    .map((item: any) => item?.name || item?.value)
    .filter(Boolean);
  if (selectedNames.length > 0) {
    return `获取 ${selectedNames.join(' / ')} 的设备信息`;
  }
  const productName =
    action.options?.productName || action.configuration?.productName || '设备';
  return `获取 ${productName} 的设备信息`;
}

function actionIcon(action: SceneAction) {
  return iconMap[action.executor as keyof typeof iconMap] || BellIcon;
}
</script>

<template>
  <div class="action-group-editor">
    <Collapse v-model:active-key="activeKeys" class="action-group-collapse">
      <CollapsePanel key="group">
        <template #header>
          <div class="action-group-header">
            <div>
              <span class="font-medium">{{
                group.parallel ? '并行' : '串行'
              }}</span>
              <span class="ml-2 text-xs text-muted-foreground">
                {{
                  group.parallel
                    ? '同时执行所有动作，不依赖先后顺序'
                    : '按顺序依次执行，可基于前一个动作输出判断是否继续'
                }}
              </span>
            </div>
            <Tag :color="group.parallel ? 'green' : 'blue'">
              {{ actionList.length }} 个动作
            </Tag>
          </div>
        </template>

        <div class="space-y-3">
          <Empty
            v-if="actionList.length === 0"
            description="暂无执行动作"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
          />

          <div
            v-for="(action, index) in actionList"
            :key="action.actionId || index"
            class="action-item"
          >
            <div class="action-index">{{ index + 1 }}-</div>
            <Button
              class="action-remove"
              type="text"
              @click.stop="removeAction(index)"
            >
              <template #icon><TrashIcon class="size-3.5" /></template>
            </Button>

            <div class="action-box" @click="editAction(action, index)">
              <div class="action-box-icon">
                <component :is="actionIcon(action)" class="size-4" />
              </div>
              <div class="action-box-content">
                <div class="action-box-title">
                  {{ action.options?.name || actionName(action) }}
                </div>
                <div class="action-box-subtitle">
                  {{
                    action.executor === 'device-data'
                      ? deviceDataSummary(action)
                      : actionSummary(action)
                  }}
                </div>
              </div>
              <EditIcon class="action-box-edit size-3.5" />
            </div>

            <div
              v-if="!group.parallel && index < actionList.length - 1"
              class="action-terms"
            >
              <div class="action-terms-title">满足此条件后执行后续动作</div>
              <TermEditor
                :columns="serialConditionColumns[index] || []"
                :terms="action.terms || []"
                @changed="emit('changed')"
                @update:terms="updateTerms(action, $event)"
              />
            </div>
          </div>

          <Button block type="dashed" @click="openTypeModal">
            <template #icon><PlusIcon class="size-4" /></template>
            添加执行动作
          </Button>
        </div>
      </CollapsePanel>
    </Collapse>

    <ActionTypeModal
      v-model:open="typeOpen"
      :action-supports="actionSupports"
      :parallel="!!group.parallel"
      @select="openActionModal"
    />
    <DelayActionModal
      v-model:open="delayOpen"
      :action="editingAction"
      :action-id="nextActionId(scene)"
      @save="saveAction"
    />
    <AlarmActionModal
      v-model:open="alarmOpen"
      :action="editingAction"
      :action-id="nextActionId(scene)"
      :mode="alarmMode"
      :target-type="alarmTargetType"
      @save="saveAction"
    />
    <DeviceActionModal
      v-model:open="deviceOpen"
      :action="editingAction"
      :action-id="nextActionId(scene)"
      :action-index="editingIndex ?? actionList.length"
      :branch-index="branchIndex"
      :group-index="groupIndex"
      :scene="scene"
      @save="saveAction"
    />
    <DeviceInfoActionModal
      v-model:open="deviceInfoOpen"
      :action="editingAction"
      :action-id="nextActionId(scene)"
      :action-index="editingIndex ?? actionList.length"
      :branch-index="branchIndex"
      :group-index="groupIndex"
      :scene="scene"
      @save="saveAction"
    />
    <NotifyActionModal
      v-model:open="notifyOpen"
      :action="editingAction"
      :action-id="nextActionId(scene)"
      :action-index="editingIndex ?? actionList.length"
      :branch-index="branchIndex"
      :group-index="groupIndex"
      :scene="scene"
      @save="saveAction"
    />
  </div>
</template>

<style scoped>
.action-group-editor {
  display: block;
  width: 100%;
}

.action-group-collapse {
  display: block;
  width: 100%;
  background: #fff;
}

.action-group-collapse :deep(.ant-collapse-item) {
  width: 100%;
}

.action-group-collapse :deep(.ant-collapse-header) {
  align-items: center;
  padding: 10px 12px !important;
}

.action-group-collapse :deep(.ant-collapse-content-box) {
  padding: 12px !important;
}

.action-group-header {
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.action-item {
  position: relative;
  padding: 18px 14px 14px;
  background: #fff;
  border: 1px dashed #d9d9d9;
}

.action-index {
  position: absolute;
  top: -10px;
  left: 8px;
  padding: 0 4px;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  background: #fff;
}

.action-remove {
  position: absolute;
  top: -12px;
  right: -12px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #ff4d4f;
  background: rgb(255 77 79 / 16%);
  border-radius: 9999px;
}

.action-remove:hover {
  color: #ff4d4f !important;
  background: rgb(255 77 79 / 24%) !important;
}

.action-box {
  display: inline-flex;
  gap: 0;
  align-items: center;
  max-width: 100%;
  min-height: 64px;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.action-box:hover {
  background: #fff;
  border-color: #91caff;
}

.action-box-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  min-height: 64px;
  color: #595959;
  background: #f5f5f5;
  border-right: 1px solid #f0f0f0;
}

.action-box-content {
  min-width: 0;
  padding: 10px 14px 10px 12px;
}

.action-box-title {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.action-box-subtitle {
  margin-top: 2px;
  font-size: 12px;
  color: #8c8c8c;
}

.action-box-edit {
  margin-right: 10px;
  color: #8c8c8c;
}

.action-terms {
  margin-top: 14px;
}

.action-terms-title {
  margin-bottom: 8px;
  font-size: 12px;
  color: #8c8c8c;
}
</style>
