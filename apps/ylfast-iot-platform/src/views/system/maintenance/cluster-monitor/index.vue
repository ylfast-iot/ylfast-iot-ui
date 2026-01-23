<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import { Card } from 'ant-design-vue';

import {
  getClusterNodes,
  listenClusterNodes,
  SystemClusterMonitorApi,
} from '#/api/system/monitor/cluster';

const ServerIcon = createIconifyIcon('lucide:server');
const CpuIcon = createIconifyIcon('lucide:cpu');

const clusterInfo = ref<SystemClusterMonitorApi.ClusterInfo>();
const nodes = ref<SystemClusterMonitorApi.ClusterNodeInfo[]>([]);

let abortController: AbortController | null = null;

async function initData() {
  try {
    const data = await getClusterNodes();
    clusterInfo.value = data;
    nodes.value = data.nodes;
  } catch (error) {
    console.error('Failed to fetch cluster nodes', error);
  }
}

function startSse() {
  abortController = new AbortController();
  listenClusterNodes(
    (nodeEvent) => {
      handleNodeEvent(nodeEvent);
    },
    () => {
      console.warn('SSE closed');
    },
    abortController.signal,
  ).catch((error) => {
    if (error.name === 'AbortError') {
      console.warn('SSE aborted');
    } else {
      console.error('SSE Error', error);
    }
  });
}

function handleNodeEvent(event: SystemClusterMonitorApi.ClusterNodeEvent) {
  const list = [...nodes.value];
  const index = list.findIndex((n) => n.id === event.node.id);

  if (event.type === 'added' || event.type === 'updated') {
    if (index === -1) {
      list.push(event.node);
    } else {
      list[index] = event.node;
    }
  } else if (
    (event.type === 'removed' || event.type === 'leaving') &&
    index > -1
  ) {
    list.splice(index, 1);
  }
  nodes.value = list;
}

onMounted(() => {
  initData();
  startSse();
});

onUnmounted(() => {
  abortController?.abort();
});
</script>

<template>
  <Page title="集群监控">
    <template #extra>
      <div
        class="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 shadow-sm shadow-primary/5 transition-all duration-300"
      >
        <ServerIcon class="size-4 text-primary" />
        <div class="h-4 w-px bg-primary/20"></div>
        <div class="flex items-center gap-2">
          <span
            class="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            在线节点
          </span>
          <span class="text-lg font-bold tabular-nums text-primary">{{
            nodes.length
          }}</span>
        </div>
      </div>
    </template>

    <div class="p-4 pt-2">
      <!-- 节点卡片列表 -->
      <div
        class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="node in nodes"
          :key="node.id"
          class="group transition-all duration-300 hover:-translate-y-1"
        >
          <Card
            :bordered="false"
            :body-style="{ padding: '0px' }"
            class="relative h-full overflow-hidden !rounded-xl border border-gray-100 bg-white bg-gradient-to-br from-white to-gray-50/50 transition-all duration-300 hover:border-primary/20 hover:shadow-md"
          >
            <!-- 极简水印背景 -->
            <div
              class="pointer-events-none absolute -bottom-8 -right-8 rotate-12 opacity-[0.03] transition-transform duration-500 group-hover:scale-110 group-hover:opacity-[0.05]"
            >
              <ServerIcon class="size-48" />
            </div>

            <div class="relative p-5">
              <!-- 头部：图标 + 信息 + 状态徽章 -->
              <div class="mb-5 flex items-start justify-between">
                <div class="flex gap-3 overflow-hidden">
                  <div
                    class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-400 transition-colors group-hover:border-primary/20 group-hover:text-primary"
                  >
                    <CpuIcon class="size-5" />
                  </div>

                  <!-- 名称和ID -->
                  <div class="flex min-w-0 flex-col justify-center">
                    <div
                      class="truncate text-base font-bold text-gray-800"
                      :title="node.alias || node.serverId"
                    >
                      {{ node.alias || node.serverId }}
                    </div>
                    <div
                      class="flex items-center gap-1 truncate font-mono text-xs text-gray-400"
                    >
                      <span>ID:</span>
                      <span :title="node.id">{{ node.id }}</span>
                    </div>
                  </div>
                </div>

                <div
                  class="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors"
                >
                  <span class="relative flex h-2 w-2">
                    <span
                      class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
                    ></span>
                    <span
                      class="relative inline-flex h-2 w-2 rounded-full bg-primary"
                    ></span>
                  </span>
                  在线
                </div>
              </div>

              <!-- 分割线 -->
              <div class="mb-4 h-px bg-gray-50"></div>

              <!-- 信息列表 -->
              <div class="space-y-2.5 text-sm">
                <div class="group/item flex items-center justify-between">
                  <span
                    class="text-gray-400 transition-colors group-hover:text-gray-500"
                  >
                    主机 IP
                  </span>
                  <span
                    class="select-all font-mono font-medium text-gray-600 transition-colors group-hover:text-gray-900"
                  >
                    {{ node.host }}
                  </span>
                </div>

                <div class="group/item flex items-center justify-between">
                  <span
                    class="text-gray-400 transition-colors group-hover:text-gray-500"
                  >
                    端口
                  </span>
                  <span
                    class="select-all font-mono font-medium text-gray-600 transition-colors group-hover:text-gray-900"
                  >
                    {{ node.port }}
                  </span>
                </div>

                <div
                  v-if="node.address"
                  class="group/item flex items-center justify-between"
                >
                  <span
                    class="text-gray-400 transition-colors group-hover:text-gray-500"
                  >
                    服务地址
                  </span>
                  <span
                    class="max-w-[140px] select-all truncate font-mono font-medium text-gray-600 transition-colors group-hover:text-gray-900"
                    :title="node.address"
                  >
                    {{ node.address }}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
/* 针对卡片内部的微调，如果有必要 */
</style>
