<script setup lang="ts">
import { computed, ref } from 'vue';

import { usePreferences } from '@vben/preferences';

import { MdCatalog, MdEditor, MdPreview } from 'md-editor-v3';

import 'md-editor-v3/lib/style.css';
import 'md-editor-v3/lib/preview.css';

const props = withDefaults(
  defineProps<{
    height?: string;
    mode?: 'edit' | 'preview';
    modelValue?: string;
  }>(),
  {
    modelValue: '',
    mode: 'preview',
    height: '100%',
  },
);

const emit = defineEmits(['update:modelValue', 'save']);

const editorId = `yl-md-${Date.now()}`;
const scrollElement = ref<HTMLElement | null>(null);

// Theme support
const { isDark } = usePreferences();
const editorTheme = computed(() => (isDark.value ? 'dark' : 'light'));

// Handling Editor Value
const content = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});
</script>

<template>
  <div
    class="yl-markdown-content h-full w-full"
    :style="{ height: props.height }"
  >
    <!-- Editor Mode -->
    <MdEditor
      v-if="props.mode === 'edit'"
      v-model="content"
      :editor-id="editorId"
      :theme="editorTheme"
      class="h-full"
      @on-save="emit('save', content)"
    />

    <!-- Preview Mode (with Catalog) -->
    <div
      v-else
      class="flex h-full w-full overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1e1e1e]"
    >
      <!-- Preview Area -->
      <div
        ref="scrollElement"
        class="scroll-container h-full flex-1 overflow-y-auto p-6"
      >
        <MdPreview
          :editor-id="editorId"
          :theme="editorTheme"
          :model-value="content"
        />
      </div>

      <!-- Catalog Sidebar -->
      <div
        class="catalog-container h-full w-64 overflow-y-auto border-l border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/20"
      >
        <MdCatalog
          v-if="scrollElement"
          :editor-id="editorId"
          :theme="editorTheme"
          :scroll-element="scrollElement"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.scroll-container {
  scroll-behavior: smooth;
}

/* Custom scrollbar for preview */
.scroll-container::-webkit-scrollbar {
  width: 6px;
}

.scroll-container::-webkit-scrollbar-thumb {
  background-color: rgb(0 0 0 / 20%);
  border-radius: 3px;
}

.dark .scroll-container::-webkit-scrollbar-thumb {
  background-color: rgb(255 255 255 / 20%);
}

.scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

/* Force MdPreview background to be transparent to match container */
:deep(.md-editor-preview),
:deep(.md-editor) {
  background-color: transparent !important;
}

/* 1. Active Item Text Color */
:deep(.md-editor-catalog-active > span) {
  font-weight: 600;
  color: hsl(var(--primary)) !important;
}

/* 2. Hover Item Text Color (Targeting span:hover to avoid parent trigger) */
:deep(.md-editor-catalog-link > span:hover) {
  color: hsl(var(--primary)) !important;
  cursor: pointer;
}

/* 3. Active Indicator (Slider) Color */
:deep(.md-editor-catalog-active::before) {
  background-color: hsl(var(--primary)) !important;
}

/* 4. Scroll-spy Indicator (the moving line) Color */
:deep(.md-editor-catalog-indicator) {
  background-color: hsl(var(--primary)) !important;
}

/* Ensure text readability in dark mode */
:deep(.md-editor-catalog) {
  color: inherit;
}
</style>
