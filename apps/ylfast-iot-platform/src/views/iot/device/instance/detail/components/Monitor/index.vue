<script setup lang="ts">
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';
import type { DeviceMetadata } from '#/types/metadata';

import { computed, ref, watch } from 'vue';

import { parseMetadata } from '#/views/iot/device/instance/detail/helper';

import EventMonitor from './components/EventMonitor.vue';
import MonitorMenu from './components/MonitorMenu.vue';
import PropertyMonitor from './components/PropertyMonitor.vue';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
}>();

// --- Metadata Parsing ---
const metadata = ref<DeviceMetadata>(parseMetadata(props.device.tsl));

watch(
  () => props.device,
  (val) => {
    if (val?.tsl) {
      metadata.value = parseMetadata(val.tsl);
    }
  },
  { immediate: true },
);

// --- Navigation ---
const activeKey = ref('prop:all'); // 'prop:{groupId}' or 'event:{eventId}'

const activeEvent = computed(() => {
  if (activeKey.value.startsWith('event:')) {
    const eventId = activeKey.value.split(':')[1];
    return metadata.value?.events?.find((e) => e.id === eventId);
  }
  return null;
});
</script>

<template>
  <div class="flex h-full bg-background">
    <!-- Menu -->
    <MonitorMenu v-model:active-key="activeKey" :metadata="metadata" />

    <!-- Content -->
    <div class="flex-1 overflow-hidden bg-muted/5">
      <PropertyMonitor
        v-if="activeKey.startsWith('prop:')"
        :device="device"
        :group-id="activeKey.split(':')[1]!"
        :metadata="metadata"
      />

      <EventMonitor
        v-if="activeKey.startsWith('event:') && activeEvent"
        :device="device"
        :event="activeEvent"
      />
    </div>
  </div>
</template>
