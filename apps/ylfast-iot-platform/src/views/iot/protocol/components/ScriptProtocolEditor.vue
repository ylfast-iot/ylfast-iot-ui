<script setup lang="ts">
import type { SelectProps } from 'ant-design-vue';

import { onMounted, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import { Col, Row, Select, Tooltip } from 'ant-design-vue';

import { getTransports } from '#/api/iot/gateway';
import { getSupportScriptExecutorProviders } from '#/api/iot/script';
import { YlMarkdown } from '#/components/yl-markdown';
import YlMonacoEditor from '#/components/yl-monaco-editor';

import { promptWords } from './promptsData';

const props = defineProps<{
  value?: Record<string, any>;
}>();

const emit = defineEmits(['update:value']);

const model = ref<Record<string, any>>({
  transports: [],
  scriptType: 'javascript',
  script: '',
  scriptEngineType: 'nashorn',
  document: '',
});

const transportsOptions = ref<SelectProps['options']>([]);
const scriptTypeOptions = ref<SelectProps['options']>([]);
const editorRef = ref();

// Default Editor Props
const editorProps = {
  selectOnLineNumbers: true,
  renderLineHighlight: 'all',
  foldingStrategy: 'indentation',
  placeholder: $t('protocol.scriptEditorPlaceholder') || 'Please enter script',
  automaticLayout: true,
  minimap: { enabled: true },
  theme: 'vs',
};

// Default Script Template
const defaultScript = `

/**
 * 设备上行消息（设备 -> 平台）
 * context 当前上下文
 * utils 工具
 */
context
  .upstream(function (context, utils) {
    const logger = context.logger();
    // 当前设备
    const device = context.getDevice();
    // 设备发来的数据
    const encodedData = context.getData();

    if (device == null) {
      // 认证逻辑...
      return;
    }

    // 处理上行消息...
  })
  /**
 * 设备下行消息（平台 -> 设备）
 * context
 * utils
 */
  .downstream(function (context, utils) {
    // 平台发过来的设备消息
    const deviceMessage = context.getMessage();
    // 处理下行消息...
  })

`;

// Sync props to model
watch(
  () => props.value,
  (val) => {
    const newVal = val
      ? {
          ...val,
          transports: val.transports || [],
          scriptType: val.scriptType || 'javascript',
          scriptEngineType: val.scriptEngineType || 'nashorn',
          script: val.script || defaultScript,
          document: val.document || '',
        }
      : {
          transports: [],
          scriptType: 'javascript',
          scriptEngineType: 'nashorn',
          script: defaultScript,
          document: '',
        };

    // Prevent infinite loop by checking deep equality
    if (JSON.stringify(newVal) !== JSON.stringify(model.value)) {
      model.value = newVal;
    }
  },
  { deep: true, immediate: true },
);

// Sync model to props
watch(
  model,
  (val) => {
    emit('update:value', val);
  },
  { deep: true },
);

// Load Options
onMounted(async () => {
  // Transports
  try {
    const res = await getTransports();
    transportsOptions.value = res.map((item) => ({
      label: item.name,
      value: item.id,
    }));
  } catch (error) {
    console.error('Failed to load transports', error);
  }

  // Script Providers
  try {
    const res = await getSupportScriptExecutorProviders();
    scriptTypeOptions.value = res.map((item) => ({
      label: item.name,
      value: item.scriptType,
      scriptEngineType: item.scriptEngineType,
      document: item.document,
    }));

    // Set initial doc if needed based on current scriptType
    // updateDoc(model.value.scriptType);
  } catch (error) {
    console.error('Failed to load script providers', error);
  }
});

function handleScriptTypeChange(_val: any, option: any) {
  model.value.scriptEngineType = option.scriptEngineType;
}

// Quick Prompt Logic
function insertPrompt(word: string) {
  const editor = editorRef.value?.getEditor();
  const monaco = editorRef.value?.monaco;

  if (editor && monaco) {
    const position = editor.getPosition();
    if (position) {
      editor.executeEdits('', [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column,
          ),
          text: word,
        },
      ]);
      editor.focus();
    }
  } else {
    // Fallback if editor instance not ready or accessible: append to end
    model.value.script += word;
  }
}
</script>

<template>
  <div class="w-full">
    <!-- Top Toolbar -->
    <div class="mb-3">
      <Row :gutter="16" align="middle">
        <!-- Docs -->
        <Col :span="8">
          <div class="flex items-center gap-2">
            <YlMarkdown
              v-model="model.document"
              display-mode="modal"
              mode="edit"
              :trigger-text="$t('protocol.writeDoc') || 'Write Doc'"
              trigger-type="button"
              button-size="small"
              :title="$t('protocol.writeDoc')"
            />
          </div>
        </Col>

        <!-- Transports -->
        <Col :span="8">
          <div class="flex items-center justify-end gap-2">
            <span class="text-sm font-semibold">
              {{ $t('protocol.transports') || 'Transports' }}:
            </span>
            <Select
              v-model:value="model.transports"
              mode="multiple"
              class="w-40"
              size="small"
              :options="transportsOptions"
              :placeholder="$t('common.select')"
            />
          </div>
        </Col>

        <!-- Script Type -->
        <Col :span="8">
          <div class="flex items-center justify-end gap-2">
            <span class="text-sm font-semibold">
              {{ $t('protocol.scriptType') || 'Script Type' }}:
            </span>
            <Select
              v-model:value="model.scriptType"
              class="w-40"
              size="small"
              :options="scriptTypeOptions"
              :placeholder="$t('common.select')"
              @change="handleScriptTypeChange"
            />
          </div>
        </Col>
      </Row>
    </div>

    <!-- Quick Prompts -->
    <div
      class="mb-2 flex flex-wrap gap-2 rounded bg-slate-50 p-2 dark:bg-slate-800"
    >
      <Tooltip v-for="item in promptWords" :key="item.word" :title="item.tips">
        <div
          class="cursor-pointer rounded border border-slate-200 bg-white px-2 py-1 text-xs hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-900"
          @click="insertPrompt(item.word)"
        >
          {{ item.label }}
        </div>
      </Tooltip>
    </div>

    <!-- Editor -->
    <div class="h-[500px] w-full border border-slate-200 dark:border-slate-700">
      <YlMonacoEditor
        ref="editorRef"
        scope="script-protocol"
        v-model="model.script"
        :language="model.scriptType"
        :theme="editorProps.theme as 'vs'"
      />
    </div>
  </div>
</template>
