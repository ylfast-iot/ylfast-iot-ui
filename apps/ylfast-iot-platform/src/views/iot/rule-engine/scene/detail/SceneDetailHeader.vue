<script setup lang="ts">
import type { RuleEngineSceneUtilsApi } from '#/api/iot/rule-engine/scene-utils';

import { computed, nextTick, ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { Button, Input } from 'ant-design-vue';

const props = defineProps<{
  description?: string;
  name: string;
  triggerSupports: RuleEngineSceneUtilsApi.SceneTriggerInfo[];
  triggerType: string;
}>();

const emit = defineEmits<{
  back: [];
  'update:description': [value: string];
  'update:name': [value: string];
}>();

const triggerName = computed(() => {
  return (
    props.triggerSupports.find((item) => item.provider === props.triggerType)
      ?.name || props.triggerType
  );
});

const TriggerIcon = createIconifyIcon('lucide:workflow');
const EditIcon = createIconifyIcon('lucide:pencil');

const editingDescription = ref(false);
const descriptionInputRef = ref<InstanceType<typeof Input> | null>(null);

async function openDescriptionEditor() {
  editingDescription.value = true;
  await nextTick();
  descriptionInputRef.value?.focus?.();
}

function confirmDescription() {
  editingDescription.value = false;
}
</script>

<template>
  <div class="scene-header">
    <div class="scene-header-left">
      <Input
        :bordered="false"
        :value="name"
        class="scene-name"
        name="sceneRuleName"
        placeholder="请输入场景名称"
        @update:value="emit('update:name', $event)"
      />
      <Button size="small">
        <template #icon>
          <TriggerIcon class="size-3.5" />
        </template>
        {{ triggerName }}
      </Button>

      <Button
        v-if="!description && !editingDescription"
        size="small"
        type="primary"
        @click="openDescriptionEditor"
      >
        + 场景说明
      </Button>

      <div
        v-else-if="description && !editingDescription"
        class="scene-description-text"
        @click="openDescriptionEditor"
      >
        <span>{{ description }}</span>
        <EditIcon class="size-3.5 text-primary" />
      </div>
    </div>

    <div v-if="editingDescription" class="scene-description-editor">
      <Input
        ref="descriptionInputRef"
        :maxlength="200"
        :show-count="true"
        :value="description"
        name="sceneRuleDescription"
        placeholder="请输入说明"
        size="small"
        @press-enter="confirmDescription"
        @update:value="emit('update:description', $event)"
      />
      <Button size="small" @click="editingDescription = false">取消</Button>
      <Button size="small" type="primary" @click="confirmDescription">
        确认
      </Button>
    </div>
  </div>
</template>

<style scoped>
.scene-header {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-height: 46px;
  padding: 10px 12px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.scene-header-left {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
}

.scene-name {
  width: 42px;
  padding: 0;
  font-size: 18px;
  font-weight: 700;
}

.scene-description-editor {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(240px, 1fr) auto auto;
  gap: 8px;
  align-items: center;
}

.scene-description-text {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  max-width: 520px;
  min-height: 24px;
  font-size: 13px;
  color: #262626;
  cursor: pointer;
}

.scene-description-text span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
