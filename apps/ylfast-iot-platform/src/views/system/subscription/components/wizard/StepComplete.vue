<script setup lang="ts">
import { $t } from '@vben/locales';

import { Input } from 'ant-design-vue';

import { NOTIFY_PROVIDER_ENUMS } from '#/enums/notify';

interface Props {
  channelName: string;
  selectedProvider: string;
  selectedNotifierId: string;
  selectedTemplateId: string;
  selectedRoleCount: number;
}

defineProps<Props>();
const emit = defineEmits(['update:channelName']);

function handleNameChange(val: string) {
  emit('update:channelName', val);
}
</script>

<template>
  <div>
    <p class="mb-4 text-sm text-muted-foreground">
      {{ $t('subscription.wizard.completeTip') }}
    </p>
    <div class="mx-auto flex max-w-md flex-col gap-6">
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-foreground">
          {{ $t('subscription.channelName') }}
          <span class="text-rose-500">*</span>
        </label>
        <Input
          :value="channelName"
          :placeholder="$t('subscription.channelNamePlaceholder')"
          size="large"
          @update:value="handleNameChange"
        />
      </div>

      <!-- 汇总预览 -->
      <div class="rounded-lg bg-muted/50 p-4 text-sm">
        <div class="mb-2 font-bold text-foreground">
          {{ $t('subscription.wizard.configPreview') }}
        </div>
        <div class="flex flex-col gap-1.5 text-muted-foreground">
          <div>
            <span class="font-medium">
              {{ $t('subscription.wizard.method') }}：
            </span>
            {{
              (NOTIFY_PROVIDER_ENUMS as any)[selectedProvider]?.label ||
              selectedProvider
            }}
          </div>
          <div>
            <span class="font-medium">
              {{ $t('subscription.wizard.configId') }}：
            </span>
            <span class="font-mono text-xs">{{ selectedNotifierId }}</span>
          </div>
          <div>
            <span class="font-medium">
              {{ $t('subscription.wizard.templateId') }}：
            </span>
            <span class="font-mono text-xs">{{ selectedTemplateId }}</span>
          </div>
          <div>
            <span class="font-medium">
              {{ $t('subscription.wizard.selectedRoles') }}：
            </span>
            {{ selectedRoleCount }}
            {{ $t('subscription.wizard.unit') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
