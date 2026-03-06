<script setup lang="ts">
import type { ApplicationApi } from '#/api/system/application';

import { onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Spin } from 'ant-design-vue';

import { queryApplicationProviders } from '#/api/system/application';
import IconCardSelect from '#/components/yl-icon-card-select/index.vue';
import { getProviderConfig } from '#/enums/application';

const emit = defineEmits<{
  select: [provider: ApplicationApi.ApplicationProviderInfo];
}>();

const loading = ref(false);
const providers = ref<ApplicationApi.ApplicationProviderInfo[]>([]);

const selectedProvider = ref<ApplicationApi.ApplicationProviderInfo | null>(
  null,
);

const [Modal, modalApi] = useVbenModal({
  class: 'w-[420px]',
  onCancel() {
    selectedProvider.value = null;
    modalApi.close();
  },
  onConfirm: () => {
    if (selectedProvider.value) {
      emit('select', selectedProvider.value);
    }
    // We do NOT call modalApi.close() here as the navigation in parent will unmount it
    // Wait for the parent to handle routing...
  },
});

const providerOptions = ref<any[]>([]);
const selectedProviderValue = ref<string>('');

onMounted(async () => {
  try {
    loading.value = true;
    const res = await queryApplicationProviders();
    providers.value = res || [];
    providerOptions.value = providers.value.map((p) => {
      const config = getProviderConfig(p.provider);
      return {
        label: p.name,
        value: p.provider,
        icon: config?.icon || 'lucide:layout-grid',
        color: config?.color || 'bg-blue-500',
      };
    });
  } catch (error) {
    console.error('Failed to load application providers:', error);
  } finally {
    loading.value = false;
  }
});

function handleSelectChange(val: number | string) {
  const provider = providers.value.find((p) => p.provider === val);
  if (provider) {
    selectedProvider.value = provider;
  }
}
</script>

<template>
  <Modal :title="$t('application.selectProvider', '选择应用提供商')">
    <div class="p-6" style="min-height: 200px">
      <Spin :spinning="loading">
        <div class="flex w-full justify-center">
          <IconCardSelect
            v-if="providerOptions.length > 0"
            :options="providerOptions"
            v-model:value="selectedProviderValue"
            @change="handleSelectChange"
          />
          <div
            v-else-if="!loading"
            class="w-full py-10 text-center text-gray-400"
          >
            {{ $t('common.noData', '暂无数据') }}
          </div>
        </div>
      </Spin>
    </div>
  </Modal>
</template>
