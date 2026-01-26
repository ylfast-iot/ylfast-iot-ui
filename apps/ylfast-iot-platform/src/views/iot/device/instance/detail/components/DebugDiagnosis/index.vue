<script setup lang="ts">
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';

import { computed, ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Progress, Tooltip } from 'ant-design-vue';

import Diagnosis from './Diagnosis.vue';
import Messaging from './Messaging.vue';

defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
}>();

const emit = defineEmits(['reload']);

const activeKey = ref<'diagnosis' | 'messaging'>('diagnosis');

// Global Diagnosis State (synced from Diagnosis.vue)
const diagnosing = ref(false);
const current = ref(-1);
const total = ref(5);
const errorCount = ref(0);
const warningCount = ref(0);
const diagnosisFinished = ref(false);

const diagnosisRef = ref<any>(null);

// Icons
const RefreshIcon = createIconifyIcon('lucide:refresh-cw');
const CheckIcon = createIconifyIcon('lucide:check-circle-2');
const XIcon = createIconifyIcon('lucide:x-circle');
const AlertIcon = createIconifyIcon('lucide:alert-triangle');
const PlayIcon = createIconifyIcon('lucide:play');
const LoaderIcon = createIconifyIcon('lucide:loader-2');

const statusType = computed(() => {
  if (diagnosing.value) return 'processing';
  if (errorCount.value > 0) return 'error';
  if (warningCount.value > 0) return 'warning';
  if (diagnosisFinished.value) return 'success';
  return 'wait';
});

const progressPercent = computed(() => {
  if (diagnosisFinished.value) return 100;
  if (current.value === -1) return 0;
  return Math.floor(((current.value + 1) / total.value) * 100);
});

function handleStateUpdate(state: {
  current: number;
  diagnosing: boolean;
  errorCount: number;
  finished: boolean;
  total?: number;
  warningCount: number;
}) {
  diagnosing.value = state.diagnosing;
  current.value = state.current;
  errorCount.value = state.errorCount;
  warningCount.value = state.warningCount;
  diagnosisFinished.value = state.finished;
  if (state.total !== undefined) {
    total.value = state.total;
  }
}

function triggerDiagnose() {
  diagnosisRef.value?.handleDiagnose();
}

function triggerFixAll() {
  diagnosisRef.value?.handleFixAll();
}

const navItems = computed(() => [
  { key: 'diagnosis', label: $t('device.debug.diagnosis') },
  {
    key: 'messaging',
    label: $t('device.debug.messaging.title'),
    disabled:
      errorCount.value > 0 ||
      warningCount.value > 0 ||
      !diagnosisFinished.value,
  },
]);
</script>

<template>
  <div
    class="flex h-full flex-col overflow-hidden bg-gray-50/30 dark:bg-transparent"
  >
    <!-- Senior Integrated Header (Banner) - White Theme -->
    <div
      class="group relative m-4 mb-2 overflow-hidden rounded-md border border-gray-100 bg-white p-6 shadow-sm transition-all duration-500 dark:border-gray-800 dark:bg-gray-900/20"
      :class="[
        statusType === 'error'
          ? 'border-red-100 bg-red-50/30 dark:border-red-900/40 dark:bg-red-500/5'
          : statusType === 'warning'
            ? 'border-orange-100 bg-orange-50/30 dark:border-orange-900/40 dark:bg-orange-500/5'
            : statusType === 'success'
              ? 'border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-500/5'
              : diagnosing
                ? 'border-primary/20 bg-primary/5 dark:border-primary/40 dark:bg-primary/5'
                : '',
      ]"
    >
      <!-- Background Ornament -->
      <div
        class="absolute -right-8 -top-8 size-56 rounded-full opacity-[0.08] blur-3xl transition-all duration-1000"
        :class="[
          statusType === 'error'
            ? 'bg-red-500'
            : statusType === 'warning'
              ? 'bg-orange-500'
              : statusType === 'success'
                ? 'bg-emerald-500'
                : 'bg-primary',
        ]"
      ></div>

      <div class="relative z-10 flex items-start gap-6">
        <!-- Status Icon with Pulse Ring -->
        <div class="relative mt-1 shrink-0">
          <div
            v-if="diagnosing"
            class="absolute inset-0 animate-ping rounded-full bg-primary/20"
          ></div>
          <div
            class="flex size-14 items-center justify-center rounded-full shadow-lg transition-transform duration-500 group-hover:scale-110"
            :class="[
              statusType === 'error'
                ? 'border-2 border-red-100 bg-red-50 text-red-500'
                : statusType === 'warning'
                  ? 'border-2 border-orange-100 bg-orange-50 text-orange-500'
                  : statusType === 'success'
                    ? 'border-2 border-emerald-100 bg-emerald-50 text-emerald-500'
                    : 'border-2 border-primary/20 bg-primary/10 text-primary',
            ]"
          >
            <LoaderIcon
              v-if="diagnosing"
              class="size-7 animate-spin text-primary"
            />
            <XIcon v-else-if="statusType === 'error'" class="size-7" />
            <AlertIcon v-else-if="statusType === 'warning'" class="size-7" />
            <CheckIcon v-else-if="statusType === 'success'" class="size-7" />
            <PlayIcon v-else class="size-7" />
          </div>
        </div>

        <!-- Text Labels -->
        <div class="flex-1">
          <div class="mb-2 flex items-center justify-between">
            <h1
              class="m-0 text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100"
            >
              {{
                diagnosing
                  ? $t('device.debug.status_header.wait')
                  : statusType === 'error'
                    ? $t('device.debug.status_header.error')
                    : statusType === 'warning'
                      ? $t('device.debug.status_header.warning')
                      : statusType === 'success'
                        ? $t('device.debug.status_header.success')
                        : $t('device.debug.startDiagnosis')
              }}
            </h1>
            <div class="flex items-center gap-3">
              <Button
                v-if="statusType === 'error'"
                type="primary"
                danger
                size="middle"
                class="rounded-md px-6 shadow-sm"
                @click="triggerFixAll"
              >
                {{ $t('device.debug.oneClickFix') }}
              </Button>
              <Button
                :loading="diagnosing"
                size="middle"
                class="rounded-md border-primary/20 bg-primary/10 px-6 font-bold text-primary shadow-none transition-all hover:bg-primary/20"
                @click="triggerDiagnose"
              >
                <template #icon><RefreshIcon class="size-4" /></template>
                {{
                  diagnosisFinished || errorCount > 0
                    ? $t('device.debug.reDiagnose')
                    : $t('device.debug.startDiagnosis')
                }}
              </Button>
            </div>
          </div>

          <p class="mb-4 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            {{
              diagnosing
                ? $t('device.debug.status_header.wait_desc')
                : statusType === 'error'
                  ? $t('device.debug.status_header.error_desc')
                  : statusType === 'warning'
                    ? $t('device.debug.status_header.warning_desc')
                    : statusType === 'success'
                      ? $t('device.debug.status_header.success_desc')
                      : $t('device.debug.status_header.wait_desc')
            }}
          </p>

          <!-- Integrated Progress Engine -->
          <div class="flex items-center gap-4">
            <Progress
              :percent="progressPercent"
              :stroke-color="
                statusType === 'error'
                  ? '#ef4444'
                  : statusType === 'warning'
                    ? '#f97316'
                    : statusType === 'success'
                      ? '#10b981'
                      : 'hsl(var(--primary))'
              "
              :show-info="false"
              stroke-linecap="round"
              size="small"
              class="flex-1"
            />
            <span class="font-mono text-xs text-gray-400">
              {{
                diagnosing
                  ? `${current + 1} / ${total}`
                  : diagnosisFinished
                    ? 'COMPLETED'
                    : 'READY'
              }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Navigation Divs -->
    <div
      class="flex items-center gap-1 border-b bg-white/50 px-6 py-2 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/10"
    >
      <template v-for="nav in navItems" :key="nav.key">
        <Tooltip
          v-if="nav.disabled"
          :title="
            nav.key === 'messaging'
              ? $t('device.debug.messaging_disabled_tip')
              : ''
          "
        >
          <div
            class="relative cursor-not-allowed select-none rounded-md px-5 py-2.5 text-sm font-medium opacity-20 grayscale transition-all duration-300"
          >
            {{ nav.label }}
          </div>
        </Tooltip>
        <div
          v-else
          class="relative cursor-pointer select-none rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-300"
          :class="[
            activeKey === nav.key
              ? 'bg-primary/5 text-primary shadow-[0_2px_10px_-4px_rgba(var(--primary-rgb),0.1)] dark:bg-primary/10 dark:text-primary'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200',
          ]"
          @click="activeKey = nav.key as any"
        >
          {{ nav.label }}
          <!-- Active Indicator Line -->
          <div
            v-if="activeKey === nav.key"
            layout-id="active-nav"
            class="absolute bottom-0 left-1/2 h-0.5 w-1/3 -translate-x-1/2 rounded-full bg-primary"
          ></div>
        </div>
      </template>
    </div>

    <!-- Content Viewport -->
    <div class="relative flex-1 overflow-hidden">
      <Transition name="fade-slide" mode="out-in">
        <div
          v-if="activeKey === 'diagnosis'"
          key="diagnosis"
          class="custom-scrollbar h-full overflow-y-auto p-6"
        >
          <Diagnosis
            ref="diagnosisRef"
            view-mode="compact"
            :device="device"
            @update:state="handleStateUpdate"
            @reload="emit('reload')"
          />
        </div>
        <div
          v-else-if="activeKey === 'messaging'"
          key="messaging"
          class="flex h-full flex-col overflow-hidden p-6"
        >
          <Messaging :device="device" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(0 0 0 / 10%);
  border-radius: 10px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(255 255 255 / 10%);
}
</style>
