<script setup lang="ts">
import type { CommonSelectorProps } from '../types';

import { ref, watch } from 'vue';

import CommonCard from './CommonCard.vue';
import CommonList from './CommonList.vue';

const props = withDefaults(defineProps<CommonSelectorProps>(), {
  multiple: true,
  showPager: true,
  showSearchForm: true,
  displayMode: 'table',
  defaultSelectedRows: () => [],
});

const emit = defineEmits(['change']);

const activeComponentRef = ref();
const currentMode = ref<'card' | 'table'>(props.displayMode);
const innerSelectedRows = ref<any[]>([]);

watch(
  () => props.displayMode,
  (val) => {
    if (val) currentMode.value = val;
  },
);

watch(
  () => props.defaultSelectedRows,
  (val) => {
    innerSelectedRows.value = val || [];
  },
  { immediate: true },
);

function setMode(mode: 'card' | 'table') {
  const currentSelection = activeComponentRef.value?.getSelection() || [];
  if (currentSelection.length > 0) {
    innerSelectedRows.value = currentSelection;
  }
  currentMode.value = mode;
}

function handleSelectionChange(rows: any[]) {
  innerSelectedRows.value = rows;
  emit('change', rows);
}

function getSelection() {
  return activeComponentRef.value?.getSelection() || [];
}

function clearSelection() {
  activeComponentRef.value?.clearSelection();
}

function setSelection(rows: any[]) {
  activeComponentRef.value?.setSelection(rows);
}

defineExpose({ getSelection, setMode, clearSelection, setSelection });
</script>

<template>
  <div class="relative flex h-full flex-col overflow-hidden">
    <component
      :is="currentMode === 'table' ? CommonList : CommonCard"
      ref="activeComponentRef"
      v-bind="props"
      :default-selected-rows="innerSelectedRows"
      class="flex-1 overflow-hidden"
      @selection-change="handleSelectionChange"
    >
      <!-- Pass through slots (card-item, table slots) -->
      <template v-for="(_, slotName) in $slots" #[slotName]="slotData">
        <slot :name="slotName" v-bind="slotData"></slot>
      </template>
    </component>
  </div>
</template>
