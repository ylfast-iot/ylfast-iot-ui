<script setup lang="ts">
import type { ConfigMetadata } from '#/types/config-metadata';

import { ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { Card, Spin } from 'ant-design-vue';

import { getNetworkConfigMetadata } from '#/api/iot/network-config';
import { YlConfigMetadataForm } from '#/components/yl-config-metadata-form';

const props = defineProps<{
  embedded?: boolean;
  register?: (action: any) => void;
  type?: string;
  value?: any;
}>();

const emit = defineEmits(['update:value']);

const TypeIcon = createIconifyIcon('lucide:layers');

const model = ref<Record<string, any>>({});
const metadata = ref<ConfigMetadata[]>([]);
const loading = ref(false);

// Sync prop value to model
watch(
  () => props.value,
  (val) => {
    if (val && JSON.stringify(val) !== JSON.stringify(model.value)) {
      model.value = { ...val };
    }
  },
  { deep: true, immediate: true },
);

// Sync model to prop value
watch(
  model,
  (val) => {
    emit('update:value', val);
  },
  { deep: true },
);

// Load metadata when type changes
watch(
  () => props.type,
  async (newType) => {
    if (newType) {
      loading.value = true;
      try {
        const res = await getNetworkConfigMetadata(newType);
        // Backend returns a single ConfigMetadata object, wrap it in array if needed or use as is depending on YlConfigMetadataForm expectation
        // Usually YlConfigMetadataForm metadata prop is ConfigMetadata[]
        metadata.value = Array.isArray(res) ? res : [res];
      } catch (error) {
        console.error('Failed to load network config metadata:', error);
        metadata.value = [];
      } finally {
        loading.value = false;
      }
    } else {
      metadata.value = [];
    }
  },
  { immediate: true },
);

// Internal Config Form Hook for proxying validation
const metadataFormAction = ref<any>(null);

function handleRegister(action: any) {
  metadataFormAction.value = action;
  if (props.register) {
    props.register(action);
  }
}

async function handleValidate() {
  if (metadataFormAction.value) {
    return await metadataFormAction.value.validate();
  }
  return model.value;
}

defineExpose({
  validate: handleValidate,
});
</script>

<template>
  <div class="w-full">
    <div v-if="loading" class="py-10 text-center">
      <Spin />
    </div>
    <div
      v-else-if="type"
      :class="[
        !embedded
          ? 'rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30'
          : 'pt-2',
      ]"
    >
      <component
        :is="embedded ? 'div' : Card"
        v-bind="!embedded ? { size: 'small', class: 'shadow-sm' } : {}"
      >
        <YlConfigMetadataForm
          v-model:model="model"
          :metadata="metadata"
          @register="handleRegister"
          hide-root-header
          layout="vertical"
        />
      </component>
    </div>
    <div
      v-else
      class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/30 py-12 transition-colors dark:border-slate-800 dark:bg-slate-900/10"
    >
      <div
        class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
      >
        <component :is="TypeIcon" class="size-6 text-slate-400" />
      </div>
      <div class="text-sm font-medium text-slate-500 dark:text-gray-400">
        {{ $t('common.placeholder.select') }}{{ $t('network.type') }}
      </div>
      <div class="mt-1 text-[11px] text-slate-400 dark:text-gray-500">
        {{ $t('network.tips.selectTypeFirst') }}
      </div>
    </div>
  </div>
</template>
