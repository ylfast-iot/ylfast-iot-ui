<script setup lang="ts">
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';
import type { ConfigMetadata } from '#/types/config-metadata';

import { computed, ref } from 'vue';

import { Button, Card, Empty, message } from 'ant-design-vue';

import { invokeDeviceFunction } from '#/api/iot/device/instance';
import { YlConfigMetadataForm } from '#/components/yl-config-metadata-form';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
}>();

const functions = computed(() => {
  if (!props.device?.tsl) return [];
  try {
    const tsl =
      typeof props.device.tsl === 'string'
        ? JSON.parse(props.device.tsl)
        : props.device.tsl;
    return tsl.functions || [];
  } catch {
    return [];
  }
});

const formModels = ref<Record<string, any>>({});
const results = ref<Record<string, any>>({});
const loading = ref<Record<string, boolean>>({});

function mapParamsToMetadata(func: any): ConfigMetadata {
  return {
    name: func.name,
    properties: (func.inputParams || []).map((p: any) => ({
      property: p.id,
      name: p.name,
      description: p.description,
      type: p.valueType,
    })),
  };
}

async function handleInvoke(func: any) {
  if (!props.device?.id) return;
  const funcId = func.id;
  loading.value[funcId] = true;

  try {
    const model = formModels.value[funcId] || {};
    // 构建调用参数
    const params = (func.inputParams || []).map((p: any) => ({
      name: p.id,
      value: model[p.id],
      propertyValueType: p.valueType,
    }));

    const res = await invokeDeviceFunction({
      deviceId: props.device.id,
      functionId: funcId,
      // @ts-ignore
      params,
      messageType: 'INVOKE_FUNCTION',
    });

    results.value[funcId] = res;
    message.success('指令已下发');
  } catch (error) {
    console.error(error);
  } finally {
    loading.value[funcId] = false;
  }
}
</script>

<template>
  <div class="space-y-4 bg-gray-50/50 p-4 dark:bg-transparent">
    <Card
      v-for="func in functions"
      :key="func.id"
      :title="func.name"
      class="hover:shadow-sm"
      size="small"
    >
      <template #extra>
        <span class="font-mono text-[10px] text-gray-400">{{ func.id }}</span>
      </template>

      <div class="space-y-4">
        <div v-if="func.description" class="text-xs text-gray-500">
          {{ func.description }}
        </div>

        <div
          v-if="func.inputParams && func.inputParams.length > 0"
          class="rounded-md border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/40"
        >
          <div class="mb-3 text-xs font-bold text-gray-400">输入参数:</div>
          <YlConfigMetadataForm
            v-model:model="formModels[func.id]"
            :hide-root-header="true"
            :metadata="mapParamsToMetadata(func)"
            :show-save-button="false"
          />
        </div>

        <div class="flex items-center justify-between border-t pt-4">
          <div class="text-xs text-gray-400">
            <template v-if="func.async"> 异步调用 </template>
            <template v-else> 同步调用 </template>
          </div>
          <Button
            :loading="loading[func.id]"
            size="small"
            type="primary"
            @click="handleInvoke(func)"
          >
            执行指令
          </Button>
        </div>

        <!-- Result Display -->
        <div
          v-if="results[func.id]"
          class="mt-4 duration-300 animate-in fade-in slide-in-from-top-2"
        >
          <div class="mb-2 text-xs font-bold text-gray-400">最近执行结果:</div>
          <div
            class="overflow-auto rounded border bg-gray-50 p-3 font-mono text-[11px] dark:border-gray-800 dark:bg-gray-900"
          >
            <pre class="m-0">{{
              JSON.stringify(results[func.id], null, 2)
            }}</pre>
          </div>
        </div>
      </div>
    </Card>

    <div v-if="functions.length === 0" class="py-20">
      <Empty description="设备未定义任何功能指令" />
    </div>
  </div>
</template>

<style scoped>
:deep(.ant-card-head) {
  min-height: 38px;
  background: #fafafa;
}

.dark :deep(.ant-card-head) {
  background: #262626;
}
</style>
