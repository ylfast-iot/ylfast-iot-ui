<script setup lang="ts">
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

defineProps<{
  value?: boolean;
}>();

const emit = defineEmits(['update:value', 'change']);

const SharedIcon = createIconifyIcon('lucide:layers');
const IndependentIcon = createIconifyIcon('lucide:box');
const CheckIcon = createIconifyIcon('lucide:check');

const options = [
  {
    value: true,
    label: $t('network.config.cluster'),
    desc: $t('network.config.sharedDesc'),
    icon: SharedIcon,
  },
  {
    value: false,
    label: $t('network.config.independent'),
    desc: $t('network.config.independentDesc'),
    icon: IndependentIcon,
  },
];

function handleSelect(val: boolean) {
  emit('update:value', val);
  emit('change', val);
}
</script>

<template>
  <div class="flex w-full gap-4 pr-2 pt-2">
    <div
      v-for="item in options"
      :key="String(item.value)"
      class="relative flex flex-1 cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all duration-300"
      :class="[
        value === item.value
          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
          : 'border-slate-200 bg-white hover:border-primary/50 dark:border-slate-800 dark:bg-slate-900/50',
      ]"
      @click="handleSelect(item.value)"
    >
      <!-- Icon Container -->
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        :class="[
          value === item.value
            ? 'bg-primary text-white'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-gray-400',
        ]"
      >
        <component :is="item.icon" class="size-5" />
      </div>

      <!-- Text Content -->
      <div class="flex min-w-0 flex-col gap-1">
        <span
          class="text-sm font-bold"
          :class="[
            value === item.value
              ? 'text-primary'
              : 'text-slate-700 dark:text-gray-200',
          ]"
        >
          {{ item.label }}
        </span>
        <span class="text-[11px] leading-relaxed text-slate-400">
          {{ item.desc }}
        </span>
      </div>

      <!-- Check Badge -->
      <div
        v-if="value === item.value"
        class="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm ring-2 ring-white dark:ring-slate-900"
      >
        <CheckIcon class="size-3" stroke-width="3" />
      </div>
    </div>
  </div>
</template>
