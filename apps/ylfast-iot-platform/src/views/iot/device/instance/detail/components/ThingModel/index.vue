<script setup lang="ts">
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';
import type { AfterChangeContext } from '#/components/yl-thing-model-editor/src/types';
import type { DeviceMetadata } from '#/types/metadata';

import { ref, watch } from 'vue';

import { ThingModelEditor } from '#/components/yl-thing-model-editor';
import {
  parseMetadata,
  updateMetadata,
  updateMetadataApi,
} from '#/views/iot/device/instance/detail/helper';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
}>();

const emit = defineEmits(['update:device']);

watch(
  () => props.device,
  (device) => {
    metadata.value = parseMetadata(device.tsl);
  },
);

const metadata = ref<DeviceMetadata>(parseMetadata(props.device.tsl));

async function onAfterChange(context: AfterChangeContext) {
  const { action, type, newMetadata } = context;
  if (type === 'expands') return true;
  if (['add', 'copy'].includes(action)) return true;
  return await updateMetadata(props.device, newMetadata, emit);
}
</script>

<template>
  <div class="h-full bg-white p-5 dark:bg-transparent">
    <ThingModelEditor
      v-model:value="metadata"
      :after-change="onAfterChange"
      @save="(_metadata) => updateMetadataApi(device, _metadata, emit)"
    />
  </div>
</template>
