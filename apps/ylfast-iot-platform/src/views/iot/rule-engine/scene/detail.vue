<script setup lang="ts">
import type { RuleEngineSceneUtilsApi } from '#/api/iot/rule-engine/scene-utils';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import { Button, message, Modal, Spin } from 'ant-design-vue';

import {
  deleteAlarmRuleBindingsBatch,
  getSceneActionSupports,
  getSceneById,
  getSceneTriggerSupports,
  parseSceneTermColumns,
  queryAlarmConfigDetailPage,
  RuleEngineAlarmRuleBindApi,
  updateScene,
} from '#/api/iot/rule-engine';

import ActionSection from './detail/ActionSection.vue';
import SceneDetailHeader from './detail/SceneDetailHeader.vue';
import TriggerSection from './detail/TriggerSection.vue';
import {
  buildSavePayload,
  collectAlarmBinds,
  createEmptyRule,
  normalizeRule,
  serializeRuleForCompare,
  validateRule,
  walkActions,
} from './detail/utils';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const saving = ref(false);
const scene = ref(createEmptyRule(String(route.query.triggerType || 'manual')));
const termColumns = ref<RuleEngineSceneUtilsApi.TermColumn[]>([]);
const triggerSupports = ref<RuleEngineSceneUtilsApi.SceneTriggerInfo[]>([]);
const actionSupports = ref<RuleEngineSceneUtilsApi.SceneActionInfo[]>([]);
const SaveIcon = createIconifyIcon('lucide:save');
const originalSerialized = ref('');

const sceneId = computed(() => String(route.query.id || scene.value.id || ''));

async function loadScene() {
  loading.value = true;
  try {
    const [triggers, actions] = await Promise.all([
      getSceneTriggerSupports(),
      getSceneActionSupports(),
    ]);
    triggerSupports.value = triggers;
    actionSupports.value = actions;

    if (sceneId.value) {
      const detail = await getSceneById(sceneId.value);
      scene.value = normalizeRule(detail);
      await hydrateAlarmBindings(sceneId.value);
    }
    await refreshTermColumns();
    originalSerialized.value = serializeRuleForCompare(scene.value);
  } finally {
    loading.value = false;
  }
}

async function hydrateAlarmBindings(ruleId: string) {
  const bindings =
    await RuleEngineAlarmRuleBindApi.basicCrudApis.postQueryNoPaging({
      paging: false,
      terms: [{ column: 'ruleId', termType: 'eq', value: ruleId }] as any,
    });

  const alarmIds = [
    ...new Set(
      bindings.map((item) => String(item.alarmId || '')).filter(Boolean),
    ),
  ];
  const alarmMap = new Map<string, any>();

  if (alarmIds.length > 0) {
    const alarmPage = await queryAlarmConfigDetailPage({
      paging: false,
      terms: [{ column: 'id', termType: 'in', value: alarmIds }] as any,
    });
    (alarmPage.data || []).forEach((item) => {
      alarmMap.set(String(item.id), item);
    });
  }

  const bindingMap = new Map<number, any[]>();
  bindings.forEach((item) => {
    const actionId = Number(item.branchIndex);
    if (!actionId) return;
    const alarmId = String(item.alarmId || '');
    if (!alarmId) return;
    const alarm = alarmMap.get(alarmId);
    const current = bindingMap.get(actionId) || [];
    current.push({
      alarmId,
      alarmName: alarm?.name || alarm?.alarmName || alarmId,
      description: alarm?.description,
      level: alarm?.level,
      state: alarm?.state,
      targetType: alarm?.targetType,
    });
    bindingMap.set(actionId, current);
  });

  walkActions(scene.value, (action) => {
    if (action.executor !== 'alarm' || !action.actionId) return;
    const alarms = bindingMap.get(action.actionId) || [];
    action.options = {
      ...action.options,
      alarmId: alarms[0]?.alarmId,
      alarmName: alarms[0]?.alarmName,
      alarms,
      summary:
        alarms.length > 0 ? `已绑定 ${alarms.length} 条告警` : '未绑定告警',
    };
  });
}

async function refreshTermColumns() {
  try {
    termColumns.value = await parseSceneTermColumns(
      buildSavePayload(scene.value),
    );
  } catch {
    termColumns.value = [];
  }
}

async function syncAlarmBindings() {
  if (!sceneId.value) return;
  const binds = collectAlarmBinds(scene.value);
  const current =
    await RuleEngineAlarmRuleBindApi.basicCrudApis.postQueryNoPaging({
      paging: false,
      terms: [
        { column: 'ruleId', termType: 'eq', value: sceneId.value },
      ] as any,
    });

  if (current.length > 0) {
    await deleteAlarmRuleBindingsBatch(current);
  }

  await Promise.all(
    binds.map((bind) =>
      RuleEngineAlarmRuleBindApi.basicCrudApis.patchSave({
        alarmId: bind.alarmId,
        branchIndex: bind.actionId,
        ruleId: sceneId.value,
      }),
    ),
  );
}

async function cleanupRemovedAlarmBindingsOnDiscard() {
  if (!sceneId.value || !originalSerialized.value) return;
  const persisted = normalizeRule(JSON.parse(originalSerialized.value));
  const persistedActionIds = new Set<number>();
  const currentActionIds = new Set<number>();

  walkActions(persisted, (action) => {
    if (action.executor === 'alarm' && action.actionId) {
      persistedActionIds.add(action.actionId);
    }
  });

  walkActions(scene.value, (action) => {
    if (action.executor === 'alarm' && action.actionId) {
      currentActionIds.add(action.actionId);
    }
  });

  const removedActionIds = [...persistedActionIds].filter(
    (id) => !currentActionIds.has(id),
  );
  if (removedActionIds.length === 0) return;

  const current =
    await RuleEngineAlarmRuleBindApi.basicCrudApis.postQueryNoPaging({
      paging: false,
      terms: [
        { column: 'ruleId', termType: 'eq', value: sceneId.value },
      ] as any,
    });
  const removed = current.filter((item) =>
    removedActionIds.includes(Number(item.branchIndex || 0)),
  );
  if (removed.length > 0) {
    await deleteAlarmRuleBindingsBatch(removed);
  }
}

async function handleSave() {
  const error = validateRule(scene.value);
  if (error) {
    message.warning(error);
    return;
  }

  saving.value = true;
  try {
    const payload = buildSavePayload(scene.value);
    await updateScene(sceneId.value, payload);
    await syncAlarmBindings();
    message.success('保存成功');
    originalSerialized.value = serializeRuleForCompare(scene.value);
    await refreshTermColumns();
  } finally {
    saving.value = false;
  }
}

function handleBack() {
  router.back();
}

function hasUnsavedChanges() {
  return (
    !!originalSerialized.value &&
    originalSerialized.value !== serializeRuleForCompare(scene.value)
  );
}

function bindBeforeUnload(event: BeforeUnloadEvent) {
  if (!hasUnsavedChanges()) return;
  event.preventDefault();
  event.returnValue = '';
}

onMounted(loadScene);
onMounted(() => window.addEventListener('beforeunload', bindBeforeUnload));
onBeforeUnmount(() =>
  window.removeEventListener('beforeunload', bindBeforeUnload),
);

onBeforeRouteLeave(async () => {
  if (!hasUnsavedChanges()) return true;

  return await new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '存在未保存的场景配置',
      content: '离开当前页面会丢失未保存的修改，是否保存后再离开？',
      okText: '保存并离开',
      cancelText: '直接离开',
      async onOk() {
        try {
          await handleSave();
          resolve(true);
        } catch {
          resolve(false);
        }
      },
      async onCancel() {
        await cleanupRemovedAlarmBindingsOnDiscard();
        resolve(true);
      },
    });
  });
});
</script>

<template>
  <Page auto-content-height class="h-full">
    <Spin :spinning="loading">
      <div class="scene-detail-page">
        <SceneDetailHeader
          v-model:description="scene.description"
          v-model:name="scene.name"
          :trigger-supports="triggerSupports"
          :trigger-type="scene.trigger.type"
          @back="handleBack"
        />

        <TriggerSection
          class="scene-section"
          v-model:scene="scene"
          :term-columns="termColumns"
          :trigger-supports="triggerSupports"
          @changed="refreshTermColumns"
        />

        <ActionSection
          class="scene-section"
          v-model:scene="scene"
          :action-supports="actionSupports"
          :term-columns="termColumns"
          @changed="refreshTermColumns"
        />

        <div class="scene-footer">
          <Button :loading="saving" type="primary" @click="handleSave">
            <template #icon>
              <SaveIcon class="size-4" />
            </template>
            保存
          </Button>
        </div>
      </div>
    </Spin>
  </Page>
</template>

<style scoped>
.scene-detail-page {
  min-height: calc(100vh - 120px);
  padding: 0 12px 64px;
  background: #fff;
}

.scene-section {
  margin-top: 14px;
}

.scene-footer {
  display: flex;
  align-items: center;
  padding: 18px 0 0;
}
</style>
