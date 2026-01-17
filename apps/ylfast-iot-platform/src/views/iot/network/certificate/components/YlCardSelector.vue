<script setup lang="ts">
import { ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

const props = defineProps<{
  columns?: number;
  disabled?: boolean;
  options: Array<{
    description?: string;
    icon?: string;
    label: string;
    subTags?: string[];
    value: string;
  }>;
  value?: string;
}>();

const emit = defineEmits(['update:value', 'change']);

const activeValue = ref(props.value);

const CheckIcon = createIconifyIcon('lucide:check-circle-2');

watch(
  () => props.value,
  (newVal) => {
    activeValue.value = newVal;
  },
  { immediate: true },
);

function handleSelect(val: string) {
  if (props.disabled) return;
  activeValue.value = val;
  emit('update:value', val);
  emit('change', val);
}
</script>

<template>
  <div
    class="grid w-full gap-4"
    :style="{ gridTemplateColumns: `repeat(${columns || 3}, minmax(0, 1fr))` }"
  >
    <div
      v-for="opt in options"
      :key="opt.value"
      class="group relative flex cursor-pointer flex-col justify-between rounded-xl border-2 p-4 transition-all"
      :class="[
        activeValue === opt.value
          ? 'border-primary bg-primary/5 shadow-sm ring-4 ring-primary/5'
          : 'border-slate-100 bg-white hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700',
        disabled ? 'cursor-not-allowed opacity-60' : '',
      ]"
      @click="handleSelect(opt.value)"
    >
      <div>
        <div class="mb-2 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <div
              v-if="opt.icon"
              class="flex size-7 shrink-0 items-center justify-center rounded-lg"
              :class="
                activeValue === opt.value
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              "
            >
              <component :is="createIconifyIcon(opt.icon)" class="size-4" />
            </div>
            <div
              class="truncate text-[14px] font-bold text-slate-900 dark:text-slate-100"
            >
              {{ opt.label }}
            </div>
          </div>
          <component
            :is="CheckIcon"
            v-if="activeValue === opt.value"
            class="size-4 shrink-0 text-primary"
          />
        </div>
        <div
          class="mb-3 line-clamp-2 text-[11px] leading-normal text-slate-500 dark:text-slate-400"
        >
          {{ opt.description }}
        </div>
      </div>

      <div
        v-if="opt.subTags && opt.subTags.length > 0"
        class="mt-auto flex flex-wrap gap-1.5 pt-2"
      >
        <span
          v-for="tag in opt.subTags"
          :key="tag"
          class="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-400 dark:bg-slate-800 dark:text-slate-500"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>
