<script setup lang="ts">
import type { DeviceMetadata } from '#/types/metadata';

import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

const props = defineProps<{
  activeKey: string;
  metadata: DeviceMetadata;
}>();

const emit = defineEmits(['update:activeKey']);

const LayersIcon = createIconifyIcon('lucide:layers');
const InfoIcon = createIconifyIcon('lucide:info');
const AlertTriangleIcon = createIconifyIcon('lucide:alert-triangle');

const propertyGroups = computed(() => {
  // @ts-ignore
  const groups = props.metadata?.expands?.propertyGroups || [];
  return [{ id: 'all', name: $t('thingModel.property.allGroups') }, ...groups];
});

const events = computed(() => {
  return props.metadata?.events || [];
});

function getEventIcon(evt: any) {
  const type = evt.eventType?.type; // 'ALARM' | 'SIMPLE'
  if (type === 'ALARM') {
    const level = evt.eventType?.alarmLevel;
    if (level && ['4', '5'].includes(String(level))) {
      return AlertTriangleIcon; // High level alarm
    }
    return AlertTriangleIcon;
  }
  return InfoIcon; // Simple event
}

function handleSelect(key: string) {
  emit('update:activeKey', key);
}
</script>

<template>
  <div class="flex w-64 flex-col border-r border-border/50 bg-background">
    <div class="flex-1 overflow-y-auto py-4">
      <!-- Section: Properties -->
      <div class="mb-6">
        <div
          class="mb-2 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground"
        >
          属性监控
        </div>
        <div class="space-y-0.5 px-2">
          <div
            v-for="group in propertyGroups"
            :key="group.id"
            class="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
            :class="{
              'bg-primary/10 font-medium text-primary':
                activeKey === `prop:${group.id}`,
              'text-foreground': activeKey !== `prop:${group.id}`,
            }"
            @click="handleSelect(`prop:${group.id}`)"
          >
            <LayersIcon class="size-4 opacity-70" />
            <span>{{ group.name }}</span>
          </div>
        </div>
      </div>

      <!-- Section: Events -->
      <div v-if="events.length > 0">
        <div
          class="mb-2 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground"
        >
          事件监控
        </div>
        <div class="space-y-0.5 px-2">
          <div
            v-for="evt in events"
            :key="evt.id"
            class="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
            :class="{
              'bg-primary/10 font-medium text-primary':
                activeKey === `event:${evt.id}`,
              'text-foreground': activeKey !== `event:${evt.id}`,
            }"
            @click="handleSelect(`event:${evt.id}`)"
          >
            <component :is="getEventIcon(evt)" class="size-4 opacity-70" />
            <span class="truncate" :title="evt.name">{{ evt.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
