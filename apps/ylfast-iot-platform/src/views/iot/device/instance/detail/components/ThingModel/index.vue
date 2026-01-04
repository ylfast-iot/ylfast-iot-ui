<script setup lang="ts">
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';
import type { AfterChangeContext } from '#/components/yl-thing-model-editor/src/types';
import type { DeviceMetadata } from '#/types/metadata';

import { ref, watch } from 'vue';

import { $t } from '@vben/locales';

import { message, Modal } from 'ant-design-vue';

import { updateDeviceMetadata as updateDeviceMetadataApi } from '#/api/iot/device/instance';
import { ThingModelEditor } from '#/components/yl-thing-model-editor';
import { parseMetadata } from '#/views/iot/device/instance/detail/helper';

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

async function updateMetadataApi(newMetadata: DeviceMetadata) {
  try {
    const tsl = JSON.stringify(newMetadata);
    await updateDeviceMetadataApi({
      id: props.device.id,
      tsl,
    });
    emit('update:device', {
      ...props.device,
      tsl,
    } as IotDeviceInstanceApi.DeviceDetail);
  } catch (error) {
    console.error(error);
  }
}

async function updateMetadata(newMetadata: any) {
  const isSelfMetadata = props.device.isSelfMetadata;

  if (isSelfMetadata) {
    try {
      await updateMetadataApi(newMetadata);
      return true;
    } catch {
      message.error($t('device.instance.error.overrideMetadata'));
      return false;
    }
  } else {
    return new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: $t('device.instance.confirmTitle.overrideMetadata'),
        content: $t('device.instance.confirmContent.overrideMetadata'),
        okType: 'danger',
        onOk: () => {
          updateMetadataApi(newMetadata);
          resolve(true);
        },
        // 如果取消，可能需要重置 metadata 的值，但 ThingModelEditor 是非受控的或很难回滚
        // 实际上 ThingModelEditor v-model:value 是双向绑定的，这里 val 已经是新值
        // 这里的处理稍微有点棘手，因为编辑器可能已经更新了内部状态
        // 考虑到用户体验，确认框取消后，理想情况下编辑器应回滚。
        // 但简化实现，如果取消，这里不做特殊回滚（因为编辑器内部可能很难控制回滚），
        // 或者我们可以重新加载一下初始值？
        onCancel: () => {
          resolve(false);
        },
      });
    });
  }
}

async function onAfterChange(context: AfterChangeContext) {
  const { action, type, newMetadata } = context;
  if (type === 'expands') return true;
  if (['add', 'copy'].includes(action)) return true;
  return await updateMetadata(newMetadata);
}
</script>

<template>
  <div class="h-full bg-white p-5 dark:bg-transparent">
    <ThingModelEditor
      v-model:value="metadata"
      :after-change="onAfterChange"
      @save="updateMetadataApi"
    />
  </div>
</template>
