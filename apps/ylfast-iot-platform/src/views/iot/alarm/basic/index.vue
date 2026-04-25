<script setup lang="ts">
import type { Component } from 'vue';

import type { RuleEngineAlarmConfigApi } from '#/api/iot';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button,
  Empty,
  Input,
  message,
  Spin,
  TabPane,
  Tabs,
} from 'ant-design-vue';

import { getDefaultAlarmLevel, saveDefaultAlarmLevel } from '#/api/iot';

type AlarmTabKey = 'flow' | 'level';

interface AlarmLevelFormItem extends RuleEngineAlarmConfigApi.AlarmLevelInfo {
  /** 前端展示时使用的级别标签 */
  label: string;
  /** 当前级别的图标组件 */
  icon: Component;
  /** 当前级别的图标容器样式 */
  toneClass: string;
}

interface AlarmLevelMeta {
  /** 级别值 */
  level: number;
  /** 级别标签 */
  label: string;
  /** 级别默认名称 */
  defaultTitle: string;
  /** 当前级别的图标组件 */
  icon: Component;
  /** 当前级别的图标容器样式 */
  toneClass: string;
}

const activeKey = ref<AlarmTabKey>('level');
const loading = ref(false);
const saving = ref(false);

const LevelOneIcon = createIconifyIcon('lucide:siren');
const LevelTwoIcon = createIconifyIcon('lucide:shield-alert');
const LevelThreeIcon = createIconifyIcon('lucide:triangle-alert');
const LevelFourIcon = createIconifyIcon('lucide:shield');
const LevelFiveIcon = createIconifyIcon('lucide:bell-ring');

const alarmLevelMetas = computed<AlarmLevelMeta[]>(() => [
  {
    level: 1,
    label: `${$t('alarm.basic.levelPrefix')}1`,
    defaultTitle: $t('alarm.basic.defaults.level1'),
    icon: LevelOneIcon,
    toneClass: 'text-red-500 dark:text-red-300',
  },
  {
    level: 2,
    label: `${$t('alarm.basic.levelPrefix')}2`,
    defaultTitle: $t('alarm.basic.defaults.level2'),
    icon: LevelTwoIcon,
    toneClass: 'text-orange-400 dark:text-orange-300',
  },
  {
    level: 3,
    label: `${$t('alarm.basic.levelPrefix')}3`,
    defaultTitle: $t('alarm.basic.defaults.level3'),
    icon: LevelThreeIcon,
    toneClass: 'text-amber-400 dark:text-amber-300',
  },
  {
    level: 4,
    label: `${$t('alarm.basic.levelPrefix')}4`,
    defaultTitle: $t('alarm.basic.defaults.level4'),
    icon: LevelFourIcon,
    toneClass: 'text-slate-400 dark:text-slate-300',
  },
  {
    level: 5,
    label: `${$t('alarm.basic.levelPrefix')}5`,
    defaultTitle: $t('alarm.basic.defaults.level5'),
    icon: LevelFiveIcon,
    toneClass: 'text-slate-300 dark:text-slate-400',
  },
]);

const levelItems = ref<AlarmLevelFormItem[]>(buildLevelFormItems());

const saveDisabled = computed(
  () =>
    saving.value ||
    loading.value ||
    levelItems.value.some((item) => item.title.trim().length === 0),
);

/**
 * 按固定 5 个等级重建表单数据，避免后端返回缺项或顺序变化时影响界面展示。
 */
function buildLevelFormItems(
  entity?: RuleEngineAlarmConfigApi.AlarmLevelEntity,
): AlarmLevelFormItem[] {
  const levelMap = new Map(
    (entity?.levels || []).map((item) => [item.level, item]),
  );

  return alarmLevelMetas.value.map((meta) => {
    const currentLevel = levelMap.get(meta.level);

    return {
      icon: meta.icon,
      i18nMessages: currentLevel?.i18nMessages,
      label: meta.label,
      level: meta.level,
      title: currentLevel?.title || meta.defaultTitle,
      toneClass: meta.toneClass,
    };
  });
}

/**
 * 加载默认告警级别配置。
 */
async function loadDefaultAlarmLevelConfig() {
  loading.value = true;

  try {
    const result = await getDefaultAlarmLevel();
    levelItems.value = buildLevelFormItems(result);
  } catch (error) {
    console.error(error);
    levelItems.value = buildLevelFormItems();
  } finally {
    loading.value = false;
  }
}

/**
 * 保存默认告警级别配置。
 */
async function handleSave() {
  const payload = levelItems.value.map((item) => ({
    i18nMessages: item.i18nMessages,
    level: item.level,
    title: item.title.trim(),
  }));

  if (payload.some((item) => item.title.length === 0)) {
    message.warning($t('alarm.basic.message.levelRequired'));
    return;
  }

  saving.value = true;

  try {
    await saveDefaultAlarmLevel(payload);
    levelItems.value = buildLevelFormItems({
      levels: payload,
    } as RuleEngineAlarmConfigApi.AlarmLevelEntity);
    message.success($t('alarm.basic.message.saveSuccess'));
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadDefaultAlarmLevelConfig();
});
</script>

<template>
  <Page auto-content-height class="h-full">
    <div class="flex h-full min-h-0 flex-col bg-[hsl(var(--background))] p-4">
      <div class="flex min-h-0 flex-1 flex-col">
        <Tabs
          v-model:active-key="activeKey"
          :animated="false"
          class="flex min-h-0 flex-1 flex-col [&_.ant-tabs-content-holder]:min-h-0 [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-content-holder_.ant-tabs-content]:h-full [&_.ant-tabs-content-holder_.ant-tabs-content]:min-h-0 [&_.ant-tabs-content-holder_.ant-tabs-tabpane]:h-full"
        >
          <TabPane key="level" :tab="$t('alarm.basic.tabs.level')">
            <div class="flex h-full min-h-0 gap-5">
              <section
                class="flex min-h-0 min-w-0 flex-1 flex-col bg-background px-6 py-8"
              >
                <div class="flex items-center gap-2 pb-8">
                  <span class="h-4 w-1 rounded-sm bg-primary"></span>
                  <h3 class="text-base font-medium text-foreground">
                    {{ $t('alarm.basic.levelConfigTitle') }}
                  </h3>
                </div>

                <Spin :spinning="loading" class="flex min-h-0 flex-1 flex-col">
                  <div class="flex min-h-0 flex-1 flex-col">
                    <div class="space-y-6">
                      <div
                        v-for="item in levelItems"
                        :key="item.level"
                        class="space-y-2"
                      >
                        <div
                          class="flex items-center gap-2 text-sm font-medium text-foreground"
                        >
                          <component
                            :is="item.icon"
                            class="size-4 shrink-0"
                            :class="item.toneClass"
                          />
                          <span>{{ item.label }}</span>
                        </div>

                        <Input
                          v-model:value="item.title"
                          :maxlength="20"
                          :placeholder="$t('alarm.basic.levelPlaceholder')"
                        />
                      </div>
                    </div>

                    <div class="mt-8">
                      <Button
                        type="primary"
                        :disabled="saveDisabled"
                        :loading="saving"
                        @click="handleSave"
                      >
                        {{ $t('alarm.basic.actions.save') }}
                      </Button>
                    </div>
                  </div>
                </Spin>
              </section>

              <aside
                class="flex min-h-0 w-[40%] min-w-[320px] shrink-0 flex-col bg-background px-6 py-8"
              >
                <h3 class="text-base font-medium text-foreground">
                  {{ $t('alarm.basic.helpTitle') }}
                </h3>

                <ol
                  class="mt-3 space-y-2 pl-5 text-sm leading-6 text-muted-foreground"
                >
                  <li>{{ $t('alarm.basic.helpItems.1') }}</li>
                  <li>{{ $t('alarm.basic.helpItems.2') }}</li>
                  <li>{{ $t('alarm.basic.helpItems.3') }}</li>
                </ol>
              </aside>
            </div>
          </TabPane>

          <TabPane key="flow" :tab="$t('alarm.basic.tabs.flow')">
            <div
              class="flex h-full min-h-0 items-center justify-center bg-background px-6 py-16"
            >
              <Empty :description="$t('alarm.basic.flowPending')" />
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  </Page>
</template>
