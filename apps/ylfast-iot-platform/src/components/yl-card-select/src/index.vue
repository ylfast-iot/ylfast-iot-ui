<script setup lang="ts">
import { ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Modal } from 'ant-design-vue';

import { YlMarkdown } from '#/components/yl-markdown';

interface Option {
  label: string;
  value: number | string;
  icon?: string; // Iconify icon name
  color?: string; // Color theme (e.g., 'blue', 'purple')
  description?: string;
  helpDoc?: string; // Markdown content for help documentation
}

const props = defineProps<{
  columns?: number;
  disabled?: boolean;
  options: Option[];
  value?: number | string;
}>();

const emit = defineEmits(['update:value', 'change']);

// Icons
const CheckCircleIcon = createIconifyIcon('lucide:check-circle-2');
const DefaultIcon = createIconifyIcon('lucide:box');
const HelpIcon = createIconifyIcon('lucide:help-circle');

// Help Doc State
const helpDocContent = ref('');
const helpDocTitle = ref('');
const showHelp = ref(false);

function handleSelect(opt: Option) {
  if (props.disabled) return;
  if (props.value !== opt.value) {
    emit('update:value', opt.value);
    emit('change', opt.value);
  }
}

function openHelp(opt: Option, event: Event) {
  event.stopPropagation();
  helpDocContent.value = opt.helpDoc || '';
  helpDocTitle.value = opt.label; // Use option label as title
  // Trigger the markdown modal directly via a ref or by rendering it
  // Since YlMarkdown handles its own visibility via v-model or internal state when in modal mode,
  // we can just use a shared YlMarkdown instance for the modal.
  showHelp.value = true;
}

// Color Styles Map
const colorMap: Record<string, any> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/30',
    activeBorder: 'border-blue-500 dark:border-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-500',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    border: 'border-purple-200 dark:border-purple-500/30',
    activeBorder: 'border-purple-500 dark:border-purple-400',
    text: 'text-purple-600 dark:text-purple-400',
    icon: 'text-purple-500',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-500/10',
    border: 'border-cyan-200 dark:border-cyan-500/30',
    activeBorder: 'border-cyan-500 dark:border-cyan-400',
    text: 'text-cyan-600 dark:text-cyan-400',
    icon: 'text-cyan-500',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-500/10',
    border: 'border-green-200 dark:border-green-500/30',
    activeBorder: 'border-green-500 dark:border-green-400',
    text: 'text-green-600 dark:text-green-400',
    icon: 'text-green-500',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    border: 'border-orange-200 dark:border-orange-500/30',
    activeBorder: 'border-orange-500 dark:border-orange-400',
    text: 'text-orange-600 dark:text-orange-400',
    icon: 'text-orange-500',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    border: 'border-red-200 dark:border-red-500/30',
    activeBorder: 'border-red-500 dark:border-red-400',
    text: 'text-red-600 dark:text-red-400',
    icon: 'text-red-500',
  },
  default: {
    bg: 'bg-gray-50 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    activeBorder: 'border-primary',
    text: 'text-gray-700 dark:text-gray-300',
    icon: 'text-gray-500',
  },
};

function getStyle(opt: Option, isActive: boolean) {
  const color = opt.color || 'default';
  const theme = colorMap[color] || colorMap.default;

  if (isActive) {
    return [theme.bg, theme.activeBorder, 'ring-1 ring-primary/20'];
  }
  return [
    'bg-white dark:bg-[#151515]',
    theme.border,
    'hover:border-primary/50',
  ];
}

function getIconStyle(opt: Option) {
  const color = opt.color || 'default';
  const theme = colorMap[color] || colorMap.default;
  return theme.icon;
}
</script>

<template>
  <div class="grid w-full gap-3" :class="`grid-cols-${columns || 3}`">
    <div
      v-for="opt in options"
      :key="opt.value"
      class="group relative flex items-center gap-3 rounded-lg border p-3 transition-all duration-200"
      :class="[
        getStyle(opt, value === opt.value),
        disabled
          ? 'cursor-not-allowed opacity-60 grayscale-[0.5]'
          : 'cursor-pointer select-none',
      ]"
      @click="handleSelect(opt)"
    >
      <!-- Icon Box -->
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-white/5"
      >
        <component
          :is="opt.icon ? createIconifyIcon(opt.icon) : DefaultIcon"
          class="size-6"
          :class="getIconStyle(opt)"
        />
      </div>
      <!-- Text Info -->
      <div class="flex flex-col overflow-hidden">
        <span
          class="truncate text-sm font-medium"
          :class="
            value === opt.value
              ? 'text-primary'
              : 'text-gray-700 dark:text-gray-200'
          "
        >
          {{ opt.label }}
        </span>
        <span v-if="opt.description" class="truncate text-xs text-gray-400">
          {{ opt.description }}
        </span>
      </div>

      <!-- Refined Selection Icon (Floating Circle Check) -->
      <div v-if="value === opt.value" class="absolute right-2 top-2">
        <CheckCircleIcon class="size-4 text-primary" />
      </div>

      <!-- Help Icon (Bottom Right or elsewhere non-intrusive) -->
      <div
        v-if="opt.helpDoc"
        class="absolute bottom-2 right-2 opacity-60 transition-opacity hover:text-primary hover:opacity-100"
        @click="(e) => openHelp(opt, e)"
        :title="$t('common.help') || 'Help'"
      >
        <HelpIcon class="size-4" />
      </div>
    </div>

    <!-- Shared Markdown Modal -->
    <!-- Note: YlMarkdown usually renders a trigger button, but here we want to control the modal directly.
         Looking at YlMarkdown code, it uses internal `visible` state for modal.
         However, it doesn't expose a way to open it programmatically without clicking its own trigger
         UNLESS we use the flat mode in a wrapper modal OR if YlMarkdown supports v-model:open (it does for 'visible' ref but it's internal).

         Actually, YlMarkdown src shows:
         <Modal v-model:open="visible" ...>
         And `visible` is a local ref. It doesn't seem to accept an external prop to control visibility directly in the current code I read.
         Wait, YlMarkdown wraps MarkdownContent.

         If I want to reuse YlMarkdown's modal capability, I'd need to let it be the trigger.
         BUT I want the trigger to be on EACH card, and open a shared modal (to save resources) OR each card has a YlMarkdown (too heavy).

         Better approach: Use YlMarkdown in 'flat' mode inside a simple Vben Modal or Ant Design Modal here.
         But YlMarkdown's modal logic includes title, width etc.

         Let's look at YlMarkdown again. It has `displayMode='modal'`.

         If I instantiate YlMarkdown for each option, that's heavy.
         Let's just use `YlMarkdown` in flat mode inside a local Modal here.
    -->
    <YlMarkdown
      v-model="helpDocContent"
      display-mode="modal"
      :title="helpDocTitle"
      trigger-type="icon"
      class="hidden"
    />
    <!--
      Wait, the `hidden` class will hide the trigger. But how do I open the modal?
      YlMarkdown doesn't expose `open`.

      Alternative: I'll modify YlMarkdown usage.
      I will use YlMarkdown in flat mode, and wrap it in a standard Modal here.
    -->
    <Modal
      v-model:open="showHelp"
      :title="helpDocTitle"
      width="1200px"
      :footer="null"
      destroy-on-close
      centered
      :body-style="{ padding: '0px', height: '70vh' }"
    >
      <YlMarkdown
        v-model="helpDocContent"
        display-mode="flat"
        mode="preview"
        height="100%"
      />
    </Modal>
  </div>
</template>
