<script setup lang="ts">
import type { SystemClusterMonitorApi } from '#/api/system/monitor/cluster';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Card, Spin } from 'ant-design-vue';

defineProps<{
  clusterNodes: SystemClusterMonitorApi.ClusterNodeInfo[];
  loadingNodes: boolean;
  selectedNodeId: string | undefined;
}>();

const emit = defineEmits<{
  selectNode: [nodeId: string | undefined];
}>();

const ServerIcon = createIconifyIcon('lucide:server');
const ClusterIcon = createIconifyIcon('lucide:network');
const NodeIcon = createIconifyIcon('lucide:hard-drive');
</script>

<template>
  <Card
    class="flex h-full flex-col border-slate-200 shadow-sm dark:border-gray-800"
    :body-style="{ padding: '10px', flex: 1, overflow: 'auto' }"
  >
    <template #title>
      <div class="flex items-center gap-2.5">
        <div
          class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <ClusterIcon class="block size-5" />
        </div>
        <span
          class="text-[14px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-300"
        >
          {{ $t('gateway.session.sidebar.clusterNodes') }}
        </span>
      </div>
    </template>

    <nav class="flex flex-col gap-1.5">
      <!-- All Nodes -->
      <div
        class="nav-item transition-all"
        :class="
          selectedNodeId === undefined
            ? 'bg-primary/10'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
        "
        @click="emit('selectNode', undefined)"
      >
        <ServerIcon
          class="size-4.5 text-slate-400 transition-all"
          :class="{ 'text-primary opacity-100': selectedNodeId === undefined }"
        />
        <span
          class="text-[13px] font-bold"
          :class="
            selectedNodeId === undefined
              ? 'text-primary'
              : 'text-slate-600 dark:text-slate-400'
          "
        >
          {{ $t('gateway.session.sidebar.allNodes') }}
        </span>
      </div>

      <div class="my-1 px-2">
        <div class="h-px bg-slate-200/50 dark:bg-slate-800/50"></div>
      </div>

      <!-- Individual Nodes -->
      <Spin :spinning="loadingNodes" size="small">
        <div class="flex flex-col gap-1.5">
          <div
            v-for="node in clusterNodes"
            :key="node.serverId"
            class="nav-item group transition-all"
            :class="
              selectedNodeId === node.serverId
                ? 'bg-primary/10'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
            "
            @click="emit('selectNode', node.serverId)"
          >
            <div
              class="flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors"
              :class="
                selectedNodeId === node.serverId
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-slate-100/60 group-hover:bg-white dark:bg-slate-900 dark:group-hover:bg-slate-800'
              "
            >
              <NodeIcon
                class="size-4 transition-all"
                :class="
                  selectedNodeId === node.serverId
                    ? 'text-white'
                    : 'text-slate-400 opacity-60 group-hover:opacity-100'
                "
              />
            </div>
            <div class="flex min-w-0 flex-1 flex-col">
              <span
                class="truncate text-[13px] font-bold leading-tight transition-all"
                :class="
                  selectedNodeId === node.serverId
                    ? 'text-primary'
                    : 'text-slate-700 dark:text-slate-300'
                "
              >
                {{ node.alias || node.serverId }}
              </span>
              <span
                class="font-mono text-[10px] transition-all"
                :class="
                  selectedNodeId === node.serverId
                    ? 'text-primary/60'
                    : 'text-slate-400 opacity-60'
                "
              >
                {{ node.host }}:{{ node.port }}
              </span>
            </div>
          </div>
        </div>
      </Spin>
    </nav>
  </Card>
</template>

<style scoped>
.nav-item {
  @apply flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-300;
}
</style>
