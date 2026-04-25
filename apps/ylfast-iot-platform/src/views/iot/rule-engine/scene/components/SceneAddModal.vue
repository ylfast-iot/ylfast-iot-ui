<script setup lang="ts">
import type { ComponentType } from '#/adapter/component/components';
import type { RuleEngineSceneUtilsApi } from '#/api/iot/rule-engine/scene-utils';

import { onMounted, ref } from 'vue';

import { useVbenForm, useVbenModal, z } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';

import { createScene } from '#/api/iot/rule-engine/scene';
import { getSceneTriggerSupports } from '#/api/iot/rule-engine/scene-utils';

const emit = defineEmits<{
  success: [payload: { id: string; triggerType: string }];
}>();

const triggerOptions = ref<RuleEngineSceneUtilsApi.SceneTriggerInfo[]>([]);
const selectedTrigger = ref('manual');

const [Form, formApi] = useVbenForm<ComponentType>({
  layout: 'vertical',
  schema: [
    {
      component: 'Input',
      componentProps: {
        maxlength: 64,
        placeholder: '请输入场景名称',
      },
      fieldName: 'name',
      label: '场景名称',
      rules: z.string().min(1, '请输入场景名称'),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[760px]',
  title: '新增场景联动',
  onConfirm: async () => {
    const { valid } = await formApi.validate();
    if (!valid) return;

    if (!selectedTrigger.value) {
      message.warning('请选择触发方式');
      return;
    }

    modalApi.setState({ confirmLoading: true });
    try {
      const values = await formApi.getValues();
      const created = await createScene({
        name: values.name,
        trigger: {
          type: selectedTrigger.value,
        },
      });

      emit('success', {
        id: created.id!,
        triggerType: selectedTrigger.value,
      });
      modalApi.close();
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
});

function getTriggerIcon(provider: string) {
  switch (provider) {
    case 'collector': {
      return 'lucide:database-zap';
    }
    case 'device': {
      return 'lucide:cpu';
    }
    case 'timer': {
      return 'lucide:clock-3';
    }
    default: {
      return 'lucide:hand';
    }
  }
}

onMounted(async () => {
  triggerOptions.value = await getSceneTriggerSupports();
  if (triggerOptions.value.length > 0) {
    selectedTrigger.value = triggerOptions.value[0]?.provider || 'manual';
  }
});
</script>

<template>
  <Modal>
    <div class="p-6">
      <Form />

      <div class="mt-4">
        <div
          class="mb-2 text-sm font-medium after:ml-1 after:text-red-500 after:content-['*']"
        >
          触发方式
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            v-for="item in triggerOptions"
            :key="item.provider"
            class="relative cursor-pointer rounded-md border bg-background p-4 pr-16 transition-colors"
            :class="[
              selectedTrigger === item.provider
                ? 'border-primary ring-1 ring-primary/30'
                : 'border-border hover:border-primary/50',
            ]"
            @click="selectedTrigger = item.provider"
          >
            <div class="text-base font-medium text-foreground">
              {{ item.name }}
            </div>
            <div class="mt-2 text-xs leading-5 text-muted-foreground">
              {{ item.description || '请选择该场景的触发入口。' }}
            </div>

            <div
              class="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-md border"
              :class="[
                selectedTrigger === item.provider
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted/30 text-muted-foreground',
              ]"
            >
              <component
                :is="createIconifyIcon(getTriggerIcon(item.provider))"
                class="size-5"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>
