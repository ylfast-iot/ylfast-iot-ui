<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import type { SceneRuleModel } from './types';

import type { RuleEngineSceneUtilsApi } from '#/api/iot/rule-engine/scene-utils';
import type { SceneConditionAction } from '#/api/iot/rule-engine/types';

import { computed, ref, watch, watchEffect } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { Button, Card, Modal, Switch, Tabs, Tag } from 'ant-design-vue';

import BranchEditor from './BranchEditor.vue';
import {
  createDefaultGroups,
  createTerm,
  normalizeBranches,
  setBranchGroups,
} from './utils';

const props = defineProps<{
  actionSupports: RuleEngineSceneUtilsApi.SceneActionInfo[];
  scene: SceneRuleModel;
  termColumns: RuleEngineSceneUtilsApi.TermColumn[];
}>();

const emit = defineEmits<{
  changed: [];
  'update:scene': [value: SceneRuleModel];
}>();

const ActionIcon = createIconifyIcon('lucide:workflow');
const PlusIcon = createIconifyIcon('lucide:plus');
const CloseIcon = createIconifyIcon('lucide:x');

const branchEnabled = ref(false);
const activeKey = ref('1');

const branchList = computed(() => props.scene.branches || []);

function firstBranch() {
  return props.scene.branches[0];
}

watchEffect(() => {
  props.scene.branches = normalizeBranches(props.scene.branches);

  if (
    (props.scene.terms || []).length > 0 &&
    (firstBranch()?.when || []).length === 0
  ) {
    const branch = firstBranch();
    if (branch) {
      branch.when = [...(props.scene.terms || [])];
    }
    props.scene.terms = [];
  }

  branchEnabled.value = props.scene.branches.some(
    (item) => (item.when || []).length > 0,
  );
});

watch(
  branchList,
  (branches) => {
    const current = branches.find(
      (item) => String(item.branchId) === activeKey.value,
    );
    if (!current && branches[0]) {
      activeKey.value = String(branches[0].branchId);
    }
  },
  { deep: true, immediate: true },
);

function updateScene() {
  emit('update:scene', props.scene);
  emit('changed');
}

function defaultWhen() {
  return [createTerm(props.termColumns[0]?.column || '')];
}

function collapseToSingleBranch(branch: SceneConditionAction) {
  const nextBranch: SceneConditionAction = {
    ...branch,
    branchName: branch.branchName || '条件 1',
    when: [],
  };
  setBranchGroups(nextBranch, branch.then || createDefaultGroups());
  props.scene.branches = [nextBranch];
  activeKey.value = String(nextBranch.branchId || 1);
}

function applyBranchEnabled(enabled: boolean) {
  branchEnabled.value = enabled;
  props.scene.branches = normalizeBranches(props.scene.branches);

  if (enabled) {
    const branch = firstBranch();
    if (branch && (branch.when || []).length === 0) {
      branch.when = defaultWhen();
    }
  } else {
    const branch = firstBranch();
    if (branch) {
      collapseToSingleBranch(branch);
    }
  }

  props.scene.terms = [];
  updateScene();
}

function toggleBranchEnabled(enabled: boolean) {
  if (enabled || !branchEnabled.value) {
    applyBranchEnabled(enabled);
    return;
  }

  Modal.confirm({
    title: '确认关闭条件？',
    content: '关闭后会清空当前条件分支，仅保留第一个执行分支的动作。',
    okText: '确认关闭',
    cancelText: '取消',
    onOk: () => applyBranchEnabled(false),
  });
}

function createBranch(index: number): SceneConditionAction {
  const branchId =
    Math.max(
      0,
      ...normalizeBranches(props.scene.branches).map(
        (item) => item.branchId || 0,
      ),
    ) + 1;
  const branch: SceneConditionAction = {
    branchId,
    branchName: `条件 ${index + 1}`,
    when: defaultWhen(),
  };
  setBranchGroups(branch, createDefaultGroups());
  return branch;
}

function addBranch() {
  const branches = normalizeBranches(props.scene.branches);
  const next = createBranch(branches.length);
  props.scene.branches = [...branches, next];
  branchEnabled.value = true;
  activeKey.value = String(next.branchId);
  updateScene();
}

function removeBranch(index: number) {
  if (branchList.value.length <= 1) return;
  Modal.confirm({
    title: '确认删除条件分支？',
    content: '删除后该条件分支下的条件和执行动作都会被移除。',
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: () => {
      props.scene.branches = normalizeBranches(props.scene.branches).filter(
        (_item, itemIndex) => itemIndex !== index,
      );
      updateScene();
    },
  });
}
</script>

<template>
  <Card class="action-section" size="small">
    <template #title>
      <div class="section-title">
        <ActionIcon class="size-4 text-primary" />
        <span>执行动作</span>
        <Tag v-if="actionSupports.length > 0" color="processing">
          {{ actionSupports.length }} 类动作
        </Tag>
      </div>
    </template>

    <div class="condition-switch">
      <div class="switch-label">执行</div>
      <Switch
        :checked="branchEnabled"
        checked-children="开"
        un-checked-children="关"
        @update:checked="toggleBranchEnabled"
      />
    </div>

    <div v-if="branchEnabled" class="terms-tabs">
      <Tabs v-model:active-key="activeKey" class="condition-tabs" type="card">
        <template #rightExtra>
          <Button size="small" type="link" @click="addBranch">
            <template #icon><PlusIcon class="size-3.5" /></template>
            添加条件
          </Button>
        </template>

        <Tabs.TabPane
          v-for="(branch, index) in branchList"
          :key="String(branch.branchId || index)"
          :closable="false"
        >
          <template #tab>
            <div class="condition-tab-label">
              <span>{{ branch.branchName || `条件 ${index + 1}` }}</span>
              <Button
                v-if="branchList.length > 1"
                class="tab-close"
                danger
                shape="circle"
                size="small"
                type="text"
                @click.stop="removeBranch(index)"
              >
                <template #icon><CloseIcon class="size-3" /></template>
              </Button>
            </div>
          </template>

          <BranchEditor
            :action-supports="actionSupports"
            :bordered="true"
            :branch="branch"
            :branch-index="index"
            :deletable="false"
            condition-label="当"
            :scene="scene"
            :show-condition="true"
            :term-columns="termColumns"
            @changed="emit('changed')"
            @update:scene="emit('update:scene', $event)"
          />
        </Tabs.TabPane>
      </Tabs>
    </div>

    <div v-else class="single-branch">
      <BranchEditor
        :action-supports="actionSupports"
        :bordered="false"
        :branch="branchList[0]"
        :branch-index="0"
        :deletable="false"
        :scene="scene"
        :show-condition="false"
        :term-columns="termColumns"
        @changed="emit('changed')"
        @update:scene="emit('update:scene', $event)"
      />
    </div>
  </Card>
</template>

<style scoped>
.action-section :deep(.ant-card-body) {
  padding: 0;
}

.section-title {
  display: flex;
  gap: 8px;
  align-items: center;
}

.condition-switch {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 16px 14px;
}

.switch-label {
  font-weight: 600;
}

.terms-tabs {
  padding: 0 16px 16px;
}

.condition-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 16px;
}

.condition-tab-label {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.tab-close {
  display: none;
  width: 18px;
  min-width: 18px;
  height: 18px;
  padding: 0;
}

.condition-tab-label:hover .tab-close {
  display: inline-flex;
}

.single-branch {
  padding: 0 16px 16px;
}
</style>
