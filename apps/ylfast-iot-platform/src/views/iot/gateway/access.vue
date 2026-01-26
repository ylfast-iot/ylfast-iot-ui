<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Empty, Spin } from 'ant-design-vue';

import { getGatewayProvidersGrouped, IotGatewayApi } from '#/api/iot/gateway';

const router = useRouter();

// Icons
const ArrowRightIcon = createIconifyIcon('lucide:arrow-right');
const ChevronLeftIcon = createIconifyIcon('lucide:chevron-left');
const NetworkIcon = createIconifyIcon('lucide:network');
const CpuIcon = createIconifyIcon('lucide:cpu');
const BoxIcon = createIconifyIcon('lucide:box');
const PluginIcon = createIconifyIcon('lucide:plugin');
const LayersIcon = createIconifyIcon('lucide:layers');

// State
const loading = ref(false);
const groupedProviders = ref<IotGatewayApi.GatewayProviderDetailGroup[]>([]);

// Fetch Data
async function fetchData() {
  loading.value = true;
  try {
    const res = await getGatewayProvidersGrouped();
    groupedProviders.value = res;
  } catch (error) {
    console.error('Failed to fetch gateway providers:', error);
  } finally {
    loading.value = false;
  }
}

// Handlers
function handleBack() {
  router.back();
}

function handleSelect(provider: IotGatewayApi.GatewayProviderDetail) {
  router.push({
    path: '/iot/gateway/accessDetail',
    query: { providerId: provider.id },
  });
}

// Icon Mapping
function getChannelIcon(channel: string) {
  const map: Record<string, any> = {
    network: NetworkIcon,
    device: CpuIcon,
    plugin: PluginIcon,
  };
  return map[channel] || BoxIcon;
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page
    content-class="p-0"
    auto-content-height
    class="bg-slate-50/50 dark:bg-transparent"
  >
    <!-- Hierarchical Header: Sticky with Shadow & Separation -->
    <header
      class="sticky top-0 z-20 border-b border-slate-100 bg-white backdrop-blur-md transition-all dark:border-gray-800 dark:bg-[#101010]/80"
    >
      <div class="px-8 py-6">
        <div class="flex items-center justify-between">
          <div class="flex flex-col gap-3">
            <!-- Back Action Button -->
            <div
              class="group flex w-fit cursor-pointer items-center gap-2 rounded-sm border border-slate-200 bg-white px-4 py-1.5 text-slate-500 shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-gray-700 dark:bg-white/5 dark:hover:bg-primary/10"
              @click="handleBack"
            >
              <ChevronLeftIcon
                class="size-4.5 transition-transform group-hover:-translate-x-1"
              />
              <span class="text-xs font-black uppercase tracking-widest">{{
                $t('common.back' as any) || '返回'
              }}</span>
            </div>

            <!-- Page Meta -->
            <div class="flex items-center gap-4">
              <h1
                class="m-0 text-2xl font-black tracking-tight text-slate-800 dark:text-orange-50/90"
              >
                {{ $t('gateway.access.selectionTitle') }}
              </h1>
              <div class="h-4 w-px bg-slate-200 dark:bg-gray-700"></div>
              <p class="m-0 text-xs font-medium text-slate-400">
                {{ $t('gateway.access.selectionSub') }}
              </p>
            </div>
          </div>

          <!-- Feature Badge -->
          <div
            class="hidden items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-slate-100 md:flex dark:bg-white/5 dark:ring-white/10"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20"
            >
              <LayersIcon class="size-5" />
            </div>
            <div class="flex flex-col">
              <span
                class="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70"
              >
                Access Gateway
              </span>
              <span
                class="text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                {{ $t('gateway.access.wizard') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Content Area: Positioned for focus -->
    <main class="bg-white px-8 py-12">
      <Spin :spinning="loading">
        <div
          v-if="groupedProviders.length === 0 && !loading"
          class="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-100 bg-white p-20 dark:border-gray-800/50 dark:bg-[#151515]"
        >
          <Empty />
        </div>

        <div v-else class="flex flex-col gap-24">
          <div
            v-for="group in groupedProviders"
            :key="group.channel"
            class="flex flex-col"
          >
            <!-- Enhanced Section Header -->
            <div class="mb-10 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div
                  class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/25"
                >
                  <component
                    :is="getChannelIcon(group.channel)"
                    class="size-5"
                  />
                </div>
                <div class="flex flex-col">
                  <h2
                    class="m-0 text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100"
                  >
                    {{ group.name || group.channel }}
                  </h2>
                </div>
              </div>
              <div
                class="flex h-6 items-center gap-2 rounded-lg bg-white px-3 shadow-sm ring-1 ring-slate-100 transition-all hover:ring-primary/20 dark:bg-white/5 dark:ring-white/10"
              >
                <span
                  class="text-[10px] font-black uppercase tracking-widest text-primary"
                >
                  {{ group.providers.length }}
                  {{ $t('common.methods' as any) || 'METHODS' }}
                </span>
                <div
                  class="h-2 w-2 animate-pulse rounded-full bg-primary"
                ></div>
              </div>
            </div>

            <!-- Provider Cards Grid -->
            <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div
                v-for="provider in group.providers"
                :key="provider.id"
                class="access-card group relative flex h-[140px] -translate-y-1.5 cursor-pointer items-center overflow-hidden rounded-[24px] border border-primary/20 bg-white p-7 shadow-2xl transition-all duration-500 dark:border-primary/40 dark:bg-[#151515]"
                @click="handleSelect(provider)"
              >
                <!-- Reference Image Grid Overlay -->
                <div
                  class="absolute inset-0 z-0 opacity-[0.06] transition-opacity"
                >
                  <svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern
                        id="card-inner-grid"
                        width="24"
                        height="24"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 24 0 L 0 0 0 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="0.8"
                        />
                      </pattern>
                    </defs>
                    <rect
                      width="100%"
                      height="100%"
                      fill="url(#card-inner-grid)"
                    />
                  </svg>
                </div>

                <!-- Icon Module -->
                <div
                  class="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/5 transition-all duration-500"
                >
                  <div
                    class="flex items-center justify-center text-primary transition-all duration-700"
                  >
                    <component
                      :is="getChannelIcon(group.channel)"
                      class="size-11"
                    />
                  </div>
                </div>

                <!-- Descriptive Content -->
                <div
                  class="relative z-10 flex min-w-0 flex-1 flex-col justify-center px-8"
                >
                  <div class="mb-1.5 flex flex-wrap items-center gap-2">
                    <h3
                      class="m-0 truncate text-lg font-black tracking-tight text-slate-800 transition-colors group-hover:text-primary dark:text-gray-100"
                    >
                      {{ provider.name }}
                    </h3>
                    <span
                      class="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase text-primary"
                    >
                      {{ provider.transport?.name || provider.transport }}
                    </span>
                  </div>
                  <p
                    class="mb-0 line-clamp-2 text-[13px] leading-relaxed text-slate-400 transition-colors group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  >
                    {{ provider.description || $t('common.noDescription') }}
                  </p>

                  <!-- Metadata & Feature Highlights -->
                  <div class="mt-4 flex flex-wrap items-center gap-3">
                    <div
                      class="flex items-center gap-1 text-[10px] font-bold text-slate-400"
                    >
                      <component
                        :is="getChannelIcon(group.channel)"
                        class="size-3"
                      />
                      <span class="uppercase tracking-widest">{{
                        group.name || group.channel
                      }}</span>
                    </div>
                    <div
                      class="h-1 w-1 rounded-full bg-slate-200 dark:bg-gray-700"
                    ></div>
                    <div
                      class="flex items-center gap-1 rounded bg-slate-100/50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-400 dark:bg-slate-800/50 dark:text-slate-500"
                    >
                      ID: {{ provider.id }}
                    </div>
                    <div class="flex-1"></div>
                  </div>
                </div>

                <!-- Action Module -->
                <div class="relative z-10 shrink-0">
                  <Button
                    type="text"
                    class="access-btn group/btn flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 text-primary transition-all duration-300 hover:shadow-md hover:shadow-primary/10 dark:border-primary/20 dark:bg-primary/10 dark:text-primary-400"
                  >
                    <span class="text-xs font-bold">{{
                      $t('gateway.access.btn')
                    }}</span>
                    <ArrowRightIcon
                      class="size-4 transition-transform duration-300 group-hover/btn:translate-x-0.5"
                    />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Spin>
    </main>
  </Page>
</template>

<style scoped>
.access-card {
  box-shadow:
    0 4px 20px -5px rgb(0 0 0 / 4%),
    0 1px 4px 0 rgb(0 0 0 / 2%);
}

.access-btn {
  @apply h-11 px-6;
}

/* Page focus styling */
:deep(.vben-page-content) {
  padding: 0 !important;
}
</style>
