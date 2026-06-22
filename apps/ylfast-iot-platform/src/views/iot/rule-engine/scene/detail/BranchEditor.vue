<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import type { SceneRuleModel } from './types';

import type { SceneConditionAction } from '#/api/iot/rule-engine/types';

import { createIconifyIcon } from '@vben/icons';

import { Button, Modal } from 'ant-design-vue';

import ActionGroupEditor from './ActionGroupEditor.vue';
import ShakeLimitEditor from './ShakeLimitEditor.vue';
import TermEditor from './TermEditor.vue';
import { normalizeGroups, setBranchGroups } from './utils';

const props = defineProps<{
  actionSupports?: any[];
  bordered?: boolean;
  branch: SceneConditionAction;
  branchIndex: number;
  conditionLabel?: string;
  deletable?: boolean;
  scene: SceneRuleModel;
  showCondition?: boolean;
  termColumns: any[];
}>();

const emit = defineEmits<{
  changed: [];
  remove: [];
  'update:scene': [value: SceneRuleModel];
}>();

const CloseIcon = createIconifyIcon('lucide:x');

function ensureGroups() {
  setBranchGroups(props.branch, normalizeGroups(props.branch.then));
}

ensureGroups();

function confirmRemove() {
  Modal.confirm({
    title: '确认删除条件分支？',
    content: '删除后该分支下的条件和执行动作都会被移除。',
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: () => emit('remove'),
  });
}
</script>

<template>
  <div class="branch-editor" :class="{ bordered }">
    <Button
      v-if="bordered && deletable !== false && branchIndex > 0"
      class="branch-delete"
      danger
      shape="circle"
      size="small"
      type="text"
      @click="confirmRemove"
    >
      <template #icon><CloseIcon class="size-3" /></template>
    </Button>

    <div v-if="showCondition" class="condition-line mb-3 flex gap-3 pb-3">
      <div class="branch-label">{{ conditionLabel || '当' }}</div>
      <div class="min-w-0 flex-1">
        <TermEditor
          :columns="termColumns"
          :terms="branch.when || []"
          @changed="emit('changed')"
          @update:terms="branch.when = $event"
        />
      </div>
    </div>

    <ShakeLimitEditor
      :value="branch.shakeLimit"
      @changed="emit('changed')"
      @update:value="branch.shakeLimit = $event"
    />

    <div class="action-groups">
      <ActionGroupEditor
        v-for="(group, groupIndex) in branch.then"
        :key="groupIndex"
        :action-supports="actionSupports || []"
        :branch-index="branchIndex"
        :group="group"
        :group-index="groupIndex"
        :scene="scene"
        :term-columns="termColumns"
        @changed="emit('changed')"
        @update:scene="emit('update:scene', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.branch-editor {
  position: relative;
  padding: 12px;
  background: #fff;
}

.branch-editor.bordered {
  border: 1px dashed #bfbfbf;
}

.branch-delete {
  position: absolute;
  top: -10px;
  right: -10px;
  z-index: 2;
  display: none;
  align-items: center;
  justify-content: center;
  width: 22px;
  min-width: 22px;
  height: 22px;
  padding: 0;
  color: #ff4d4f;
  background: #fff1f0;
}

.branch-editor.bordered:hover > .branch-delete {
  display: inline-flex;
}

.action-groups {
  display: grid;
  gap: 12px;
  width: 100%;
}

.branch-label {
  min-width: 28px;
  font-size: 14px;
  font-weight: 600;
  color: #6154c8;
}

.condition-line {
  align-items: center;
}
</style>
