<script setup lang="ts">
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Popover, Select, TabPane, Tabs, Tooltip } from 'ant-design-vue';

import { YlMonacoEditor } from '#/components/yl-monaco-editor';

import AccessTypeSelector from './AccessTypeSelector.vue';

// Define the shape of the source object based on DevicePropertyMetadata['source']
interface SourceData {
  accessType: string[];
  type: 'DEVICE' | 'RULE';
  rule?: {
    configuration: {
      convertScripts?: {
        decode: string;
        encode: string;
      };
      scriptEngineType?: 'javascript';
      scriptType?: 'javascript';
    };
    mode: 'advanced' | 'simple';
  };
}

const props = defineProps<{
  disabled?: boolean;
  value: SourceData;
}>();

const emit = defineEmits(['update:value', 'change']);

const SettingOutlined = createIconifyIcon('ant-design:setting-outlined');
const QuestionCircleOutlined = createIconifyIcon(
  'ant-design:question-circle-outlined',
);

// Local state for the value to allow immediate updates
const localValue = computed({
  get: () => props.value,
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

// Popover control
const popoverOpen = ref(false);

// Modal control
const [RuleModal, modalApi] = useVbenModal({
  title: $t('thingModel.property.ruleConfig'),
  draggable: true,
  closeOnClickModal: false,
  destroyOnClose: false,
  class: 'w-4/5',
  onConfirm: () => {
    modalApi.close();
  },
});

function handleSettingClick() {
  if (localValue.value.type === 'DEVICE') {
    popoverOpen.value = true;
  } else {
    // Initialize rule structure if missing
    if (!localValue.value.rule) {
      localValue.value.rule = {
        mode: 'advanced',
        configuration: {
          scriptEngineType: 'javascript',
          scriptType: 'javascript',
          convertScripts: {
            decode: `handler
  /** @description: 解码
   * （设备上报的属性值进行转换）
   * @param context 上下文
   * @param val 属性值
   * @returns 格式化后的值
   */
.onDecode(
  function(context,val) {
  return val;
})`,
            encode: `handler
/**
 * @description: 编码
 * （平台下发属性值到设备时进行转换）
 * @param context 上下文
 * @param val 属性值
 * @returns 格式化后的值
 */
.onEncode(function(context,val) {
  return val;
})`,
          },
        },
      };
    }
    modalApi.open();
  }
}
</script>

<template>
  <div class="flex w-full items-center gap-1">
    <RuleModal>
      <div class="flex flex-col">
        <!-- Access Mode Section -->
        <div class="border-b border-slate-200 p-4 dark:border-slate-700">
          <div
            class="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {{ $t('thingModel.property.accessMode') }}
          </div>
          <AccessTypeSelector
            v-model:value="localValue.accessType"
            :disabled="disabled"
          />
        </div>

        <!-- Tabs for Simple/Advanced Mode -->
        <div class="flex-1 px-4 pb-4 pt-2">
          <Tabs
            v-if="localValue.rule"
            v-model:active-key="localValue.rule.mode"
            class="[&_.ant-tabs-nav]:mb-4 [&_.ant-tabs-tab]:px-4 [&_.ant-tabs-tab]:py-2"
          >
            <!-- Simple Mode Tab - Placeholder -->
            <TabPane key="simple" :tab="$t('thingModel.property.ruleSimple')">
              <div class="flex flex-col items-center justify-center py-16">
                <div class="mb-4 text-6xl opacity-20">🚧</div>
                <div
                  class="text-lg font-medium text-slate-600 dark:text-slate-400"
                >
                  {{ $t('common.developing') }}
                </div>
                <div class="mt-2 text-sm text-slate-500">
                  普通规则模式暂未开放，请使用高级规则
                </div>
              </div>
            </TabPane>

            <!-- Advanced Mode Tab -->
            <TabPane
              key="advanced"
              :tab="$t('thingModel.property.ruleAdvanced')"
            >
              <div class="grid grid-cols-2 gap-4">
                <!-- Left: Decode Editor -->
                <div class="flex flex-col">
                  <div class="mb-2 flex items-center gap-2">
                    <span
                      class="inline-block size-2 rounded-full bg-blue-500"
                    ></span>
                    <span
                      class="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      属性接收转换
                    </span>
                    <Tooltip placement="top">
                      <template #title>
                        <div class="text-xs">设备上报的属性值进行转换</div>
                      </template>
                      <QuestionCircleOutlined
                        class="cursor-help text-slate-400"
                      />
                    </Tooltip>
                  </div>
                  <div
                    class="flex-1 overflow-hidden rounded border border-slate-200 dark:border-slate-700"
                  >
                    <YlMonacoEditor
                      v-if="localValue.rule.configuration.convertScripts"
                      v-model="
                        localValue.rule.configuration.convertScripts.decode
                      "
                      language="javascript"
                      theme="auto"
                      scope="metadata-rule-property"
                      :read-only="disabled"
                      height="400px"
                    />
                  </div>
                </div>

                <!-- Right: Encode Editor -->
                <div class="flex flex-col">
                  <div class="mb-2 flex items-center gap-2">
                    <span
                      class="inline-block size-2 rounded-full bg-green-500"
                    ></span>
                    <span
                      class="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      属性发送转换
                    </span>
                    <Tooltip placement="top">
                      <template #title>
                        <div class="text-xs">
                          平台下发属性值到设备时进行转换
                        </div>
                      </template>
                      <QuestionCircleOutlined
                        class="cursor-help text-slate-400"
                      />
                    </Tooltip>
                  </div>
                  <div
                    class="flex-1 overflow-hidden rounded border border-slate-200 dark:border-slate-700"
                  >
                    <YlMonacoEditor
                      v-if="localValue.rule.configuration.convertScripts"
                      v-model="
                        localValue.rule.configuration.convertScripts.encode
                      "
                      language="javascript"
                      theme="auto"
                      :read-only="disabled"
                      height="400px"
                    />
                  </div>
                </div>
              </div>
            </TabPane>
          </Tabs>
        </div>
      </div>
    </RuleModal>

    <Select
      v-model:value="localValue.type"
      class="!h-8 flex-1"
      :options="[
        { value: 'DEVICE', label: $t('thingModel.property.sourceDevice') },
        { value: 'RULE', label: $t('thingModel.property.sourceRule') },
      ]"
      :disabled="disabled"
    />

    <Popover
      v-model:open="popoverOpen"
      trigger="click"
      placement="bottomRight"
      overlay-class-name="source-config-popover"
      :arrow="false"
      v-if="localValue.type === 'DEVICE'"
    >
      <template #content>
        <div class="w-80 p-2">
          <div class="mb-2 text-sm font-medium">
            {{ $t('thingModel.property.accessMode') }}
          </div>
          <AccessTypeSelector
            v-model:value="localValue.accessType"
            :disabled="disabled"
          />
          <div class="mt-4 flex justify-end">
            <div
              class="cursor-pointer text-primary hover:text-primary/80"
              @click="popoverOpen = false"
            >
              {{ $t('thingModel.common.save') }}
            </div>
          </div>
        </div>
      </template>
      <div
        class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
        @click.stop
      >
        <SettingOutlined />
      </div>
    </Popover>

    <!-- For RULE, we don't use Popover, just direct click to open Modal -->
    <div
      v-else
      class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
      @click.stop="handleSettingClick"
    >
      <SettingOutlined />
    </div>
  </div>
</template>
