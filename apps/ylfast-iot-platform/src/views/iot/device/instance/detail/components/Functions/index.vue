<script setup lang="ts">
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';
import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { DeviceMetadata } from '#/types/metadata';

import { computed, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Input, message, Tag, Tooltip } from 'ant-design-vue';

import { invokeDeviceFunction } from '#/api/iot/device/instance';
import ObjectInput from '#/components/yl-data-type-strategies/value-input/ObjectInput.vue';
import { parseMetadata } from '#/views/iot/device/instance/detail/helper';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
}>();

const PlayIcon = createIconifyIcon('lucide:play');
const ClockIcon = createIconifyIcon('lucide:clock');
const SearchIcon = createIconifyIcon('lucide:search');
const TerminalIcon = createIconifyIcon('lucide:terminal');
const FunctionSquareIcon = createIconifyIcon('lucide:function-square');

watch(
  () => props.device,
  (device) => {
    metadata.value = parseMetadata(device.tsl);
  },
);

const metadata = ref<DeviceMetadata>(parseMetadata(props.device.tsl));

const functions = computed(() => {
  return metadata.value.functions || [];
});

const searchText = ref('');
const activeFunctionId = ref<string>('');

const filteredFunctions = computed(() => {
  if (!searchText.value) return functions.value;
  const lower = searchText.value.toLowerCase();
  return functions.value.filter(
    (f) =>
      f.name.toLowerCase().includes(lower) ||
      f.id.toLowerCase().includes(lower),
  );
});

// Auto-select first function
watch(
  filteredFunctions,
  (list) => {
    if (list.length > 0 && !activeFunctionId.value) {
      activeFunctionId.value = list[0]?.id!;
    }
  },
  { immediate: true },
);

const activeFunction = computed(() =>
  functions.value.find((f) => f.id === activeFunctionId.value),
);

const formModels = ref<Record<string, any>>({});
const results = ref<Record<string, any>>({});
const loading = ref<Record<string, boolean>>({});

// Initialize form models
watch(
  functions,
  (funcs) => {
    funcs.forEach((func) => {
      if (!formModels.value[func.id]) {
        formModels.value[func.id] = {};
      }
    });
  },
  { immediate: true },
);

function getObjectProp(func: any) {
  return {
    property: func.id,
    name: func.name,
    type: {
      type: 'OBJECT',
      properties: func.inputParams || [],
    },
  } as ConfigPropertyMetadata;
}

async function handleInvoke(func: any) {
  if (!props.device?.id) return;
  const funcId = func.id;

  const model = formModels.value[funcId] || {};

  // Validate required parameters
  if (func.inputParams && func.inputParams.length > 0) {
    for (const param of func.inputParams) {
      if (param.expands?.required) {
        const val = model[param.id];
        if (val === undefined || val === null || val === '') {
          message.error(
            `${param.name || param.id} ${$t('device.instance.function.required')}`,
          );
          return;
        }
      }
    }
  }

  loading.value[funcId] = true;

  try {
    const params = (func.inputParams || []).map((p: any) => ({
      name: p.id,
      value: model[p.id],
    }));

    const startTime = Date.now();
    const res = await invokeDeviceFunction({
      deviceId: props.device.id,
      functionId: funcId,
      params,
      messageType: 'INVOKE_FUNCTION',
    });
    const endTime = Date.now();

    results.value[funcId] = {
      success: true,
      data: res,
      time: new Date().toLocaleString(),
      duration: endTime - startTime,
    };
    message.success($t('device.instance.function.invoked'));
  } catch (error) {
    console.error(error);
    results.value[funcId] = {
      success: false,
      data: error,
      time: new Date().toLocaleString(),
    };
  } finally {
    loading.value[funcId] = false;
  }
}
</script>

<template>
  <div class="h-full p-4">
    <div
      class="flex h-full overflow-hidden rounded-md border border-border bg-card shadow-sm"
    >
      <!-- Left Sidebar: Function List -->
      <div class="flex w-72 flex-col border-r border-border/50 bg-background">
        <div class="border-b border-border/50 p-3">
          <Input
            v-model:value="searchText"
            :placeholder="$t('device.instance.function.searchPlaceholder')"
            allow-clear
            class="rounded-sm"
          >
            <template #prefix>
              <SearchIcon class="size-4 text-muted-foreground" />
            </template>
          </Input>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div
            v-for="func in filteredFunctions"
            :key="func.id"
            class="group relative flex cursor-pointer flex-col gap-1 border-b border-border/30 px-5 py-4 transition-all hover:bg-muted/50"
            :class="{
              'bg-primary/5': activeFunctionId === func.id,
              'text-muted-foreground': activeFunctionId !== func.id,
            }"
            @click="activeFunctionId = func.id"
          >
            <!-- Active Indicator Bar -->
            <div
              v-if="activeFunctionId === func.id"
              class="absolute left-0 top-0 h-full w-1 bg-primary"
            ></div>

            <div class="flex items-center justify-between">
              <span
                class="truncate text-sm font-semibold"
                :class="{
                  'text-primary': activeFunctionId === func.id,
                  'text-foreground': activeFunctionId !== func.id,
                }"
              >
                {{ func.name }}
              </span>
              <Tag
                :color="func.async ? 'blue' : 'green'"
                class="m-0 origin-right scale-90 rounded-sm border-none px-1 text-[10px]"
              >
                {{
                  func.async
                    ? $t('thingModel.common.async')
                    : $t('thingModel.common.sync')
                }}
              </Tag>
            </div>
            <div class="flex items-center gap-2 text-[11px] opacity-50">
              <span class="truncate font-mono">{{ func.id }}</span>
            </div>
          </div>
          <div
            v-if="filteredFunctions.length === 0"
            class="py-12 text-center text-xs text-muted-foreground"
          >
            {{ $t('device.instance.function.noMatch') }}
          </div>
        </div>
      </div>

      <!-- Right Content: Execution Area -->
      <div class="flex flex-1 flex-col overflow-hidden bg-background">
        <template v-if="activeFunction">
          <!-- Header -->
          <div
            class="flex items-center justify-between border-b border-border/50 bg-muted/5 px-8 py-6"
          >
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-4">
                <div
                  class="flex size-10 items-center justify-center rounded-sm bg-primary text-white"
                >
                  <FunctionSquareIcon class="size-5" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="m-0 text-lg font-bold text-foreground">
                      {{ activeFunction.name }}
                    </h2>
                    <span
                      class="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                    >
                      {{ activeFunction.id }}
                    </span>
                  </div>
                  <div class="mt-0.5 text-xs text-muted-foreground">
                    {{
                      activeFunction.description ||
                      $t('device.instance.function.noDescription')
                    }}
                  </div>
                </div>
              </div>
            </div>
            <Tooltip :title="$t('device.instance.function.execute')">
              <div
                class="flex size-9 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-white hover:shadow-md hover:shadow-primary/20"
                :class="{
                  'pointer-events-none opacity-50': loading[activeFunction.id],
                }"
                @click="
                  !loading[activeFunction.id] && handleInvoke(activeFunction)
                "
              >
                <div
                  v-if="loading[activeFunction.id]"
                  class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                ></div>
                <PlayIcon v-else class="ml-0.5 size-4" />
              </div>
            </Tooltip>
          </div>

          <!-- Main Scroll Area -->
          <div class="flex-1 overflow-y-auto bg-muted/5 p-8">
            <div class="mx-auto max-w-5xl space-y-10">
              <!-- Inputs Section -->
              <div class="space-y-4">
                <div
                  class="flex items-center gap-3 text-base font-bold uppercase tracking-wider text-foreground"
                >
                  <div class="h-5 w-1 bg-primary"></div>
                  {{ $t('device.instance.function.params') }}
                </div>
                <div
                  v-if="
                    activeFunction.inputParams &&
                    activeFunction.inputParams.length > 0
                  "
                  class="bg-background"
                >
                  <ObjectInput
                    v-model:value="formModels[activeFunction.id]"
                    :prop="getObjectProp(activeFunction)"
                    :disabled="loading[activeFunction.id]"
                  />
                </div>
                <div
                  v-else
                  class="flex h-32 items-center justify-center border border-dashed border-border bg-background/50 text-sm italic text-muted-foreground"
                >
                  {{ $t('device.instance.function.noParams') }}
                </div>
              </div>

              <!-- Results Section -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div
                    class="flex items-center gap-3 text-base font-bold uppercase tracking-wider text-foreground"
                  >
                    <div class="h-5 w-1 bg-primary"></div>
                    {{ $t('device.instance.function.result') }}
                  </div>
                  <div
                    v-if="results[activeFunction.id]"
                    class="flex items-center gap-2 font-mono text-xs text-muted-foreground"
                  >
                    <ClockIcon class="size-3.5" />
                    <span>
                      {{ $t('device.instance.function.executeTime') }}:
                      {{ results[activeFunction.id].time }}
                    </span>
                  </div>
                </div>

                <div
                  v-if="results[activeFunction.id]"
                  class="border shadow-md"
                  :class="
                    results[activeFunction.id].success
                      ? 'border-green-500/30 bg-green-50/10'
                      : 'border-red-500/30 bg-red-50/10'
                  "
                >
                  <!-- Console Header -->
                  <div
                    class="flex items-center justify-between border-b px-5 py-3"
                    :class="
                      results[activeFunction.id].success
                        ? 'border-green-500/20 bg-green-500/10 text-green-700'
                        : 'border-red-500/20 bg-red-500/10 text-red-700'
                    "
                  >
                    <div
                      class="flex items-center gap-2 font-bold uppercase tracking-widest"
                    >
                      <TerminalIcon class="size-4" />
                      <span>{{
                        $t('device.instance.function.responseData')
                      }}</span>
                    </div>
                    <div
                      v-if="results[activeFunction.id].duration"
                      class="font-mono text-[10px] opacity-70"
                    >
                      {{ $t('device.instance.function.responseTime') }}:
                      {{ results[activeFunction.id].duration }}ms
                    </div>
                  </div>

                  <!-- Console Body -->
                  <div
                    class="max-h-[500px] overflow-y-auto p-6 font-mono text-xs leading-relaxed"
                    :class="
                      results[activeFunction.id].success
                        ? 'text-green-900 dark:text-green-300'
                        : 'text-red-900'
                    "
                  >
                    <template v-if="results[activeFunction.id].data">
                      <pre class="m-0 whitespace-pre-wrap break-all">{{
                        typeof results[activeFunction.id].data === 'object'
                          ? JSON.stringify(
                              results[activeFunction.id].data,
                              null,
                              2,
                            )
                          : results[activeFunction.id].data
                      }}</pre>
                    </template>
                    <template v-else>
                      <span class="italic opacity-40">
                        // {{ $t('common.success') }}
                      </span>
                    </template>
                  </div>
                </div>

                <div
                  v-else
                  class="flex h-64 flex-col items-center justify-center gap-4 border border-dashed border-border bg-background/50 text-muted-foreground"
                >
                  <TerminalIcon class="size-12 opacity-5" />
                  <span
                    class="text-[10px] font-bold uppercase tracking-[0.3em] opacity-20"
                    >
                    {{ $t('device.instance.function.waiting') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div
          v-else
          class="flex h-full flex-col items-center justify-center bg-muted/5 text-muted-foreground"
        >
          <div
            class="flex h-24 w-24 items-center justify-center rounded-md border border-border bg-background shadow-sm"
          >
            <SearchIcon class="size-12 opacity-10" />
          </div>
          <div
            class="mt-8 text-xs font-bold uppercase tracking-widest opacity-30"
          >
            {{ $t('device.instance.function.selectTip') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
