<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue';

import { usePreferences } from '@vben/preferences';

import { useElementSize } from '@vueuse/core';

import { CompletionManager } from './completion';
import { initSyntaxPrompt } from './helper';
import { monaco } from './monaco';
import { ensureDefaultScopes, getEditorScope } from './scope-registry';
import { editorProps } from './types';

defineOptions({ name: 'YlMonacoEditor' });

const props = defineProps(editorProps);
const emit = defineEmits(['update:modelValue', 'change', 'editorMounted']);

const { isDark } = usePreferences();

const containerRef = ref<HTMLDivElement | null>(null);
const editorInstance = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(
  null,
);

// 管理代码提示的 Manager
const completionManager = new CompletionManager();

// 用于监听容器大小变化，手动触发 layout
const { height, width } = useElementSize(containerRef);

const containerStyle = computed(() => {
  return {
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
    height:
      typeof props.height === 'number' ? `${props.height}px` : props.height,
  };
});

const actualTheme = computed(() => {
  if (props.theme === 'auto') {
    return isDark.value ? 'vs-dark' : 'vs';
  }
  return props.theme;
});

async function init() {
  if (!containerRef.value) return;

  // 确保默认作用域已初始化 (延迟加载)
  await ensureDefaultScopes();

  // 初始化语法提示配置 (Compiler Options 等)
  initSyntaxPrompt();

  // 创建编辑器
  editorInstance.value = monaco.editor.create(containerRef.value, {
    value: props.modelValue,
    language: props.language,
    theme: actualTheme.value,
    readOnly: props.readOnly,
    ...props.options,
    automaticLayout: true, // 开启自动布局
  });

  // 设置 Manager 的上下文 (Scope)
  const model = editorInstance.value.getModel();
  if (model) {
    completionManager.setContext(model.id);
  }

  // 注册自定义提示
  updateSuggestions();

  // 监听内容变化
  editorInstance.value.onDidChangeModelContent(() => {
    const value = editorInstance.value?.getValue() || '';
    if (value !== props.modelValue) {
      emit('update:modelValue', value);
      emit('change', value);
    }
  });

  emit('editorMounted', editorInstance.value);
}

function updateSuggestions() {
  // 清理旧的 Providers
  completionManager.dispose();

  // 1. 注册简单的对象/关键字提示
  // 注意：对于 JS/TS，这会注册全局 extraLib
  completionManager.registerObjectSuggestions(
    props.language,
    props.customObjectSuggestion,
  );

  // 收集所有的 Providers
  const allProviders = [...(props.completionProviders || [])];

  // 2. 如果指定了 scope，从注册中心加载
  if (props.scope) {
    const scopedProviders = getEditorScope(props.scope);
    if (scopedProviders.length > 0) {
      allProviders.push(...scopedProviders);
    }
  }

  // 3. 注册所有 Providers
  if (allProviders.length > 0) {
    completionManager.registerProviders(allProviders);
  }

  // 4. 注册自定义 d.ts 库 (JS/TS)
  // 注意：Provider 内部携带的 extraLibs 已在 registerProviders 中自动处理
  // 这里只处理通过 props.extraLibs 显式传入的
  if (props.extraLibs && props.extraLibs.length > 0) {
    completionManager.registerExtraLibs(props.language, props.extraLibs);
  }
}

onMounted(() => {
  init();
});

onBeforeUnmount(() => {
  completionManager.dispose();
  editorInstance.value?.dispose();
});

// Watchers

// 1. 监听值变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (editorInstance.value) {
      const currentValue = editorInstance.value.getValue();
      if (newValue !== currentValue) {
        editorInstance.value.setValue(newValue || '');
      }
    }
  },
);

// 2. 监听语言变化
watch(
  () => props.language,
  (newLang) => {
    if (editorInstance.value) {
      const model = editorInstance.value.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, newLang);
      }
    }
    updateSuggestions();
  },
);

// 3. 监听主题变化
watch(actualTheme, (newTheme) => {
  monaco.editor.setTheme(newTheme);
});

// 4. 监听配置变化
watch(
  () => props.options,
  (newOptions) => {
    editorInstance.value?.updateOptions(newOptions);
  },
  { deep: true },
);

// 5. 监听只读状态
watch(
  () => props.readOnly,
  (newReadOnly) => {
    editorInstance.value?.updateOptions({ readOnly: newReadOnly });
  },
);

// 6. 监听自定义提示变化 (Object)
watch(
  () => props.customObjectSuggestion,
  () => {
    updateSuggestions();
  },
  { deep: true },
);

// 7. 监听自定义提示变化 (Providers)
watch(
  () => props.completionProviders,
  () => {
    updateSuggestions();
  },
  { deep: true },
);

// 8. 监听自定义 d.ts 库变化
watch(
  () => props.extraLibs,
  () => {
    updateSuggestions();
  },
  { deep: true },
);

// 9. 监听 Scope 变化
watch(
  () => props.scope,
  () => {
    updateSuggestions();
  },
);

// 10. 监听尺寸变化 (双重保障 layout)
watch([width, height], () => {
  editorInstance.value?.layout();
});

defineExpose({
  getEditor: () => editorInstance.value,
  monaco,
});
</script>

<template>
  <div
    ref="containerRef"
    class="yl-monaco-editor"
    :style="containerStyle"
  ></div>
</template>

<style scoped>
.yl-monaco-editor {
  overflow: hidden;
}
</style>
