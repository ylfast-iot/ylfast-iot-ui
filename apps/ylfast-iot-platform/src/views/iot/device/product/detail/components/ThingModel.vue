<script setup lang="ts">
import type { IotDeviceProductApi } from '#/api/iot/device/product';
import type { AfterChangeContext } from '#/components/yl-thing-model-editor/src/types';
import type { DeviceMetadata } from '#/types/metadata';

import { ref, watch } from 'vue';

import { IotDeviceProductApi as ProductApi } from '#/api/iot/device/product';
import { ThingModelEditor } from '#/components/yl-thing-model-editor';
import { parseMetadata } from '#/views/iot/device/instance/detail/helper';

const props = defineProps<{
  product: IotDeviceProductApi.ProductDetail;
}>();

const emit = defineEmits(['update:product']);

const metadata = ref<DeviceMetadata>(parseMetadata(props.product.tsl));

watch(
  () => props.product,
  (val) => {
    metadata.value = parseMetadata(val.tsl);
  },
);

async function handleUpdate(newMetadata: DeviceMetadata) {
  try {
    const tsl = JSON.stringify(newMetadata);
    // 更新 TSL
    await ProductApi.basicCrudApis.patchSave({
      ...(props.product as unknown as IotDeviceProductApi.DeviceProduct),
      tsl,
    });

    // 更新父组件数据
    emit('update:product', {
      ...props.product,
      tsl,
    });
  } catch (error) {
    console.error(error);
  }
}

async function onAfterChange(context: AfterChangeContext) {
  const { action, type, newMetadata } = context;
  if (type === 'expands') return true;
  if (['add', 'copy'].includes(action)) return true;
  await handleUpdate(newMetadata);
  return true;
}
</script>

<template>
  <div class="h-full bg-white p-5 dark:bg-transparent">
    <ThingModelEditor
      v-model:value="metadata"
      :after-change="onAfterChange"
      @save="handleUpdate"
    />
  </div>
</template>
