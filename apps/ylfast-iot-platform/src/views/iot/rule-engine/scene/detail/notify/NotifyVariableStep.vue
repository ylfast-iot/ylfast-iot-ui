<script setup lang="ts">
import type { SceneRuleModel } from '../types';

import { computed, reactive, ref, watch, watchEffect } from 'vue';

import { Empty, Input, Tag } from 'ant-design-vue';

import { parseSceneVariables } from '#/api/iot/rule-engine/scene-utils';

import NotifyBuildInItem from './variable-item/NotifyBuildInItem.vue';
import NotifyFileItem from './variable-item/NotifyFileItem.vue';
import NotifyOrgItem from './variable-item/NotifyOrgItem.vue';
import NotifyTagItem from './variable-item/NotifyTagItem.vue';
import NotifyUserItem from './variable-item/NotifyUserItem.vue';

type VariableRecord = Record<string, any>;

const props = defineProps<{
  actionIndex: number;
  branchIndex?: number;
  groupIndex?: number;
  modelValue: VariableRecord;
  notifierId: string;
  notifyType: string;
  options?: Record<string, any>;
  scene?: SceneRuleModel;
  templateDetail?: any;
  variableDefinitions: any[];
}>();

const emit = defineEmits<{
  change: [value: Record<string, any>];
  'update:modelValue': [value: VariableRecord];
}>();

const modelRef = reactive<VariableRecord>({});
const builtinTree = ref<any[]>([]);
const otherColumns = ref<(string | undefined)[]>([]);
const fieldErrors = ref<Record<string, string>>({});

const hasVariables = computed(
  () => (props.variableDefinitions || []).length > 0,
);

watch(
  () => props.modelValue,
  (value) => {
    Object.keys(modelRef).forEach((key) => delete modelRef[key]);
    Object.assign(modelRef, value || {});
  },
  { deep: true, immediate: true },
);

watch(
  () => props.options?.otherColumns,
  (value) => {
    otherColumns.value = Array.isArray(value) ? [...value] : [];
  },
  { deep: true, immediate: true },
);

watch(
  () => props.variableDefinitions,
  () => ensureDefaultValues(),
  { deep: true, immediate: true },
);

watch(
  () => [props.scene, props.actionIndex, props.branchIndex, props.groupIndex],
  async () => {
    if (!props.scene) {
      builtinTree.value = [];
      return;
    }
    const result = await parseSceneVariables(props.scene, {
      action: props.actionIndex,
      branch: props.branchIndex,
      branchGroup: props.groupIndex,
    });
    builtinTree.value = buildBuiltinTree(result || []);
  },
  { deep: true, immediate: true },
);

watchEffect(() => {
  const sendTo = props.templateDetail?.template?.sendTo;
  if (Array.isArray(sendTo) && sendTo.length > 0) {
    emit('change', { sendTo: sendTo.join(' ') });
  }
});

function normalizeNotifyType(type: string) {
  return type === 'weixin' ? 'wechat' : type;
}

function getBusinessType(item: any) {
  return (
    item?.expands?.businessType || item?.type?.type || item?.type || 'string'
  );
}

function isRequired(item: any) {
  const type = getBusinessType(item);
  return (
    !['file', 'org', 'tag', 'user'].includes(type) || item.id === 'calledNumber'
  );
}

function createDefaultValue(item: any) {
  const type = getBusinessType(item);
  if (type === 'file' || type === 'link') {
    return item.defaultValue;
  }
  if (type === 'user' && normalizeNotifyType(props.notifyType) === 'email') {
    return { source: 'fixed', value: [] };
  }
  return { source: 'fixed', value: item.defaultValue };
}

function ensureDefaultValues() {
  for (const item of props.variableDefinitions || []) {
    if (modelRef[item.id] === undefined) {
      modelRef[item.id] = createDefaultValue(item);
    }
  }
  syncModel();
}

function syncModel() {
  emit('update:modelValue', structuredClone(modelRef));
}

function setFieldError(itemId: string, value = '') {
  fieldErrors.value = {
    ...fieldErrors.value,
    [itemId]: value,
  };
}

function validateSingleField(item: any) {
  const error = getValidationError(item, modelRef[item.id]);
  setFieldError(item.id, error);
  return error;
}

function handleValueChange(item: any, value: any) {
  modelRef[item.id] = value;
  syncModel();
  validateSingleField(item);
}

function handleItemMetaChange(
  payload: Record<string, any>,
  type: string,
  index: number,
) {
  if (type === 'build-in') {
    otherColumns.value[index] = payload.otherColumn;
    emit('change', { otherColumns: [...otherColumns.value] });
    return;
  }

  otherColumns.value[index] = undefined;

  if (type === 'org') {
    emit('change', { orgName: payload.displayName || '', otherColumns: [] });
    return;
  }
  if (type === 'tag') {
    emit('change', { tagName: payload.displayName || '', otherColumns: [] });
    return;
  }
  if (type === 'user') {
    emit('change', { sendTo: payload.displayName || '', otherColumns: [] });
    return;
  }

  emit('change', { otherColumns: [...otherColumns.value] });
}

function buildBuiltinTree(list: any[]) {
  return list.map((item: any) => ({
    children: buildBuiltinTree(item.children || []),
    column: item.column,
    description: item.description,
    fullTitle: item.fullName || item.name,
    key: item.id,
    title: item.name,
    value: item.id,
    variableType: String(item.type || item.valueType?.type || '').toLowerCase(),
  }));
}

function getValidationError(item: any, value: any) {
  const type = getBusinessType(item);
  const name = item?.name || item?.id;
  const notifyType = normalizeNotifyType(props.notifyType);

  if (
    !value &&
    ['departmentIdList', 'file', 'org', 'tag', 'user', 'userIdList'].includes(
      type,
    )
  ) {
    return '';
  }

  if (type === 'file') return '';

  if (type === 'link') {
    if (!value) return `请输入${name}`;
    return String(value).length <= 64 ? '' : '链接长度不能超过 64';
  }

  if (type === 'tag' && !value) return `请选择${name}`;

  if (['date', 'org'].includes(type)) {
    if (!value) return `请选择${name}`;
    if (value?.source === 'upper') {
      return value?.upperKey ? '' : `请选择${name}`;
    }
    return value?.value ? '' : `请选择${name}`;
  }

  if (value?.source === 'fixed' && !value?.value) {
    return notifyType === 'email' ? '请至少输入一个邮箱' : `请输入${name}`;
  }

  if (value?.source === 'relation' && !value?.value && !value?.relation) {
    return `请选择${name}`;
  }

  if (value?.source === 'upper' && !value?.upperKey) {
    return `请选择${name}`;
  }

  if (type === 'user') {
    if (notifyType === 'email' && value?.source !== 'relation') {
      if (!Array.isArray(value?.value) || value.value.length === 0) {
        return '请至少输入一个邮箱';
      }
      const valid = value.value.every((itemValue: string) =>
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(itemValue),
      );
      return valid ? '' : '邮箱格式不正确';
    }

    if (
      ['sms', 'voice'].includes(notifyType) &&
      value?.source !== 'relation' &&
      value?.value
    ) {
      return /^1[3-9]\d{9}$/.test(String(value.value))
        ? ''
        : '手机号格式不正确';
    }
  }

  return '';
}

function validateReceivers() {
  const receiverDefs = (props.variableDefinitions || []).filter((item) =>
    ['departmentIdList', 'org', 'tag', 'user', 'userIdList'].includes(
      getBusinessType(item),
    ),
  );
  if (receiverDefs.length === 0) return true;
  return receiverDefs.some((item) => {
    const value = modelRef[item.id];
    if (item.id === 'toUser' && value?.source === 'relation') {
      return value?.relation?.objectId || value?.relation?.related;
    }
    if (item.id === 'userIdList') {
      return value?.value || value?.relation?.objectId;
    }
    return value?.value;
  });
}

async function onSave() {
  ensureDefaultValues();
  const notifyType = normalizeNotifyType(props.notifyType);
  const nextErrors: Record<string, string> = {};

  if (!validateReceivers() && notifyType === 'wechat') {
    throw new Error('请至少选择一个通知接收人');
  }
  if (!validateReceivers() && notifyType === 'dingTalk') {
    throw new Error('请至少选择一个接收人');
  }

  for (const item of props.variableDefinitions || []) {
    const error = getValidationError(item, modelRef[item.id]);
    if (error) {
      nextErrors[item.id] = error;
    }
  }

  fieldErrors.value = nextErrors;

  const firstError = Object.values(nextErrors)[0];
  if (firstError) {
    throw new Error(firstError);
  }

  return structuredClone(modelRef);
}

defineExpose({ onSave });
</script>

<template>
  <Empty
    v-if="!hasVariables"
    description="当前模板没有变量定义"
    class="py-10"
  />
  <div v-else class="notify-variable-panel">
    <div
      v-for="(item, index) in variableDefinitions"
      :key="item.id"
      class="variable-card"
      :class="{ 'has-error': !!fieldErrors[item.id] }"
    >
      <div class="variable-card-header">
        <div class="variable-card-title-row">
          <span class="variable-card-title">
            <span v-if="isRequired(item)" class="required-mark">*</span>
            {{ item.name }}
          </span>
          <Tag v-if="item.required" color="error" class="variable-required-tag">
            必填
          </Tag>
        </div>
        <div v-if="item.description || item.id" class="variable-card-desc">
          {{ item.description || item.id }}
        </div>
      </div>

      <div class="variable-card-body">
        <NotifyUserItem
          v-if="getBusinessType(item) === 'user'"
          :model-value="modelRef[item.id]"
          :notifier-id="notifierId"
          :notify-type="notifyType"
          :scene="scene"
          @update:model-value="handleValueChange(item, $event)"
          @change="handleItemMetaChange($event, 'user', index)"
        />
        <NotifyOrgItem
          v-else-if="getBusinessType(item) === 'org'"
          :model-value="modelRef[item.id]"
          :notifier-id="notifierId"
          :notify-type="notifyType"
          @update:model-value="handleValueChange(item, $event)"
          @change="handleItemMetaChange($event, 'org', index)"
        />
        <NotifyTagItem
          v-else-if="getBusinessType(item) === 'tag'"
          :model-value="modelRef[item.id]"
          :notifier-id="notifierId"
          @update:model-value="handleValueChange(item, $event)"
          @change="handleItemMetaChange($event, 'tag', index)"
        />
        <NotifyFileItem
          v-else-if="getBusinessType(item) === 'file'"
          :model-value="modelRef[item.id]"
          @update:model-value="handleValueChange(item, $event)"
        />
        <Input
          v-else-if="getBusinessType(item) === 'link'"
          :value="modelRef[item.id]"
          allow-clear
          class="variable-plain-input"
          :status="fieldErrors[item.id] ? 'error' : undefined"
          @update:value="handleValueChange(item, $event)"
        />
        <NotifyBuildInItem
          v-else
          :builtin-tree="builtinTree"
          :definition="item"
          :model-value="modelRef[item.id]"
          @update:model-value="handleValueChange(item, $event)"
          @change="handleItemMetaChange($event, 'build-in', index)"
        />
      </div>

      <div v-if="fieldErrors[item.id]" class="variable-card-error">
        {{ fieldErrors[item.id] }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.notify-variable-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 6px 0 4px;
}

.variable-card {
  padding: 16px 18px;
  background: #fcfcfc;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.variable-card:hover {
  background: #fff;
  border-color: #d9d9d9;
}

.variable-card.has-error {
  background: #fffafa;
  border-color: #ffccc7;
}

.variable-card-header {
  margin-bottom: 10px;
}

.variable-card-title-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.variable-card-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
  color: #1f1f1f;
}

.required-mark {
  margin-right: 4px;
  color: #ff4d4f;
}

.variable-required-tag {
  margin-inline-end: 0;
  font-size: 12px;
  border-radius: 999px;
}

.variable-card-desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: #8c8c8c;
}

.variable-card-body {
  min-height: 40px;
}

.variable-card-error {
  margin-top: 8px;
  font-size: 12px;
  line-height: 18px;
  color: #ff4d4f;
}

.variable-plain-input {
  border-radius: 10px;
}
</style>
