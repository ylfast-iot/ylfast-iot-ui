<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { useElementSize } from '@vueuse/core';
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

const props = withDefaults(
  defineProps<{
    language?: string;
    modelValue?: string;
    readOnly?: boolean;
    theme?: 'vs' | 'vs-dark';
  }>(),
  {
    language: 'json',
    modelValue: '',
    readOnly: false,
    theme: 'vs',
  },
);

const emit = defineEmits(['update:modelValue', 'change']);

// @ts-ignore
this.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new JsonWorker();
    }
    return new EditorWorker();
  },
};

const containerRef = ref<HTMLDivElement | null>(null);
const { height, width } = useElementSize(containerRef);
let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null;

onMounted(() => {
  if (containerRef.value) {
    editorInstance = monaco.editor.create(containerRef.value, {
      value: props.modelValue,
      language: props.language,
      readOnly: props.readOnly,
      theme: props.theme,
      automaticLayout: true, // Auto resize
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
    });

    editorInstance.onDidChangeModelContent(() => {
      const value = editorInstance?.getValue() || '';
      if (value !== props.modelValue) {
        emit('update:modelValue', value);
        emit('change', value);
      }
    });
  }
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (editorInstance && newValue !== editorInstance.getValue()) {
      editorInstance.setValue(newValue);
    }
  },
);

watch(
  () => props.language,
  (newLang) => {
    if (editorInstance) {
      monaco.editor.setModelLanguage(
        editorInstance.getModel()!,
        newLang || 'json',
      );
    }
  },
);

watch(
  () => props.theme,
  (newTheme) => {
    if (editorInstance) {
      monaco.editor.setTheme(newTheme);
    }
  },
);

watch(
  () => props.readOnly,
  (newReadOnly) => {
    editorInstance?.updateOptions({ readOnly: newReadOnly });
  },
);

watch([width, height], () => {
  editorInstance?.layout();
});

onBeforeUnmount(() => {
  editorInstance?.dispose();
});
</script>

<template>
  <div ref="containerRef" class="h-full w-full overflow-hidden"></div>
</template>
