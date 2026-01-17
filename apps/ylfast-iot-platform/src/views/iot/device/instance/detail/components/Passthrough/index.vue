<script setup lang="ts">
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';

import { onMounted, onUnmounted, ref } from 'vue';

import { Button, Empty } from 'ant-design-vue';
// import dayjs from 'dayjs';

defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
}>();

const logs = ref<{ content: string; time: string; type: string }[]>([]);
const isRunning = ref(false);

// function handleMessage(msg: string) {
//   if (!isRunning.value) return;
//
//   try {
//     const data = JSON.parse(msg);
//     logs.value.unshift({
//       content: typeof data === 'object' ? JSON.stringify(data, null, 2) : data,
//       time: dayjs().format('HH:mm:ss.SSS'),
//       type: data.messageType || 'DEBUG',
//     });
//   } catch {
//     logs.value.unshift({
//       content: msg,
//       time: dayjs().format('HH:mm:ss.SSS'),
//       type: 'RAW',
//     });
//   }
//
//   if (logs.value.length > 200) {
//     logs.value.pop();
//   }
// }

function start() {
  isRunning.value = true;
}

function stop() {
  isRunning.value = false;
}

function clear() {
  logs.value = [];
}

onMounted(() => {
  start();
});

onUnmounted(() => {
  stop();
});
</script>

<template>
  <div
    class="flex h-full flex-col bg-[#1e1e1e] p-4 font-mono text-sm text-gray-300"
  >
    <!-- Header/Toolbar -->
    <div
      class="mb-4 flex items-center justify-between border-b border-gray-800 pb-3"
    >
      <div class="flex items-center gap-3">
        <div
          class="h-2 w-2 rounded-full"
          :class="isRunning ? 'animate-pulse bg-green-500' : 'bg-red-500'"
        ></div>
        <span class="text-xs font-bold uppercase tracking-widest text-gray-400">
          Device Logs
        </span>
      </div>
      <div class="flex gap-2">
        <Button size="small" type="link" @click="clear">清除日志</Button>
        <Button
          v-if="isRunning"
          danger
          ghost
          size="small"
          type="primary"
          @click="stop"
        >
          停止
        </Button>
        <Button v-else size="small" type="primary" @click="start">
          启动
        </Button>
      </div>
    </div>

    <!-- Log Display -->
    <div class="flex-1 overflow-y-auto pr-2">
      <div v-if="logs.length > 0" class="space-y-3">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="group border-l-2 border-primary/40 bg-white/5 py-2 pl-4 transition-colors hover:bg-white/10"
        >
          <div class="mb-2 flex items-center gap-3">
            <span class="text-[10px] font-medium text-gray-500">
              {{ log.time }}
            </span>
            <span
              class="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary"
            >
              {{ log.type }}
            </span>
          </div>
          <pre
            class="m-0 whitespace-pre-wrap break-all text-[11px] leading-relaxed"
          >
            {{ log.content }}
          </pre>
        </div>
      </div>
      <div v-else class="flex h-full flex-col items-center justify-center">
        <Empty
          description="等待接收设备实时日志..."
          :image="Empty.PRESENTED_IMAGE_SIMPLE"
        />
        <div class="mt-4 text-xs text-gray-600">
          确保设备已上线且正在发送数据
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
pre {
  font-family: 'Fira Code', 'Ubuntu Mono', Menlo, Monaco, Consolas, monospace;
}

/* Custom Scrollbar for dark theme */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #444;
}
</style>
