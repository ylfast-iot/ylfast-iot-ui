<script setup lang="ts">
import { computed, ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { Popover, Select } from 'ant-design-vue';

import { ALARM_LEVELS } from '#/enums/alarm-level';

interface EventTypeData {
  alarmLevel?: string;
  type: 'ALARM' | 'SIMPLE';
}

const props = defineProps<{
  disabled?: boolean;
  value: EventTypeData;
}>();

const emit = defineEmits(['update:value', 'change']);

const SettingOutlined = createIconifyIcon('ant-design:setting-outlined');

const localValue = computed({
  get: () => props.value,
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

const popoverOpen = ref(false);
</script>

<template>
  <div class="flex w-full items-center gap-1">
    <Select
      v-model:value="localValue.type"
      class="!h-8 flex-1"
      :options="[
        { value: 'SIMPLE', label: $t('thingModel.event.typeInfo') },
        { value: 'ALARM', label: $t('thingModel.event.typeWarn') },
      ]"
      :disabled="disabled"
      :placeholder="$t('thingModel.event.type')"
    />

    <Popover
      v-model:open="popoverOpen"
      trigger="click"
      placement="bottomRight"
      overlay-class-name="event-type-config-popover"
      :arrow="false"
      v-if="localValue.type === 'ALARM'"
    >
      <template #content>
        <div class="w-64 p-2">
          <div class="mb-2 text-sm font-medium">
            {{ $t('thingModel.event.level') }}
          </div>
          <Select
            v-model:value="localValue.alarmLevel"
            :disabled="disabled"
            class="w-full"
            :placeholder="$t('thingModel.event.level')"
            :options="ALARM_LEVELS"
          />
          <div class="mt-4 flex justify-end">
            <div
              class="cursor-pointer text-primary hover:text-primary/80"
              @click="popoverOpen = false"
            >
              {{ $t('thingModel.common.save') }}
            </div>
          </div>
        </div>
      </template>
      <div
        class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
        @click.stop
      >
        <SettingOutlined />
      </div>
    </Popover>
  </div>
</template>
