<script setup lang="ts">
import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

interface Option {
  label: string;
  value: string;
  icon: string;
  desc: string;
}

const props = defineProps<{
  modelValue?: string[];
  value?: string[];
}>();

const emit = defineEmits(['update:value', 'update:modelValue', 'change']);

const innerValue = computed({
  get: () => props.modelValue ?? props.value ?? [],
  set: (val: string[]) => {
    emit('update:value', val);
    emit('update:modelValue', val);
    emit('change', val);
  },
});

const fileOptionMetadata = computed<Option[]>(() => [
  {
    label: $t('file.upload.publicAccess'),
    value: 'publicAccess',
    icon: 'lucide:globe',
    desc: $t('file.upload.publicAccessDesc'),
  },
  {
    label: $t('file.upload.tempFile'),
    value: 'tempFile',
    icon: 'lucide:clock-9',
    desc: $t('file.upload.tempFileDesc'),
  },
]);

const toggleOption = (val: string) => {
  const current = [...innerValue.value];
  const index = current.indexOf(val);
  if (index === -1) {
    current.push(val);
  } else {
    current.splice(index, 1);
  }
  innerValue.value = current;
};
</script>

<template>
  <div class="grid min-h-[40px] w-full grid-cols-1 gap-3 sm:grid-cols-2">
    <!-- Debug Text -->
    <div v-if="fileOptionMetadata.length === 0" class="col-span-2 text-red-500">
      Metadata is empty!
    </div>
    <div
      v-for="opt in fileOptionMetadata"
      :key="opt.value"
      class="file-option-card"
      :class="{ active: innerValue.includes(opt.value) }"
      @click="toggleOption(opt.value)"
    >
      <div class="flex items-center gap-3">
        <div class="option-icon-wrapper">
          <component :is="createIconifyIcon(opt.icon)" class="size-4" />
        </div>
        <div class="flex min-w-0 flex-col overflow-hidden">
          <span class="mb-1.5 text-[13px] font-bold leading-none">{{
            opt.label
          }}</span>
          <span class="truncate text-[10px] leading-none opacity-40">{{
            opt.desc
          }}</span>
        </div>
        <div class="check-marker ml-auto flex-shrink-0">
          <component
            :is="createIconifyIcon('lucide:check')"
            v-if="innerValue.includes(opt.value)"
            class="size-3"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-option-card {
  position: relative;
  padding: 10px 12px;
  overflow: hidden;
  cursor: pointer;
  background: hsl(var(--card));
  border: 1.5px solid hsl(var(--border) / 50%);
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.file-option-card:hover {
  background: hsl(var(--primary) / 2%);
  border-color: hsl(var(--primary) / 40%);
}

.file-option-card.active {
  background: hsl(var(--primary) / 8%);
  border-color: hsl(var(--primary));
}

.option-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted));
  border-radius: 6px;
  transition: all 0.2s;
}

.file-option-card.active .option-icon-wrapper {
  color: #fff;
  background: hsl(var(--primary));
}

.check-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: #fff;
  border: 1.5px solid hsl(var(--border));
  border-radius: 50%;
  transition: all 0.2s;
}

.file-option-card.active .check-marker {
  background: hsl(var(--primary));
  border-color: hsl(var(--primary));
}
</style>
