<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Empty, message, Spin, Tooltip } from 'ant-design-vue';

import {
  getSessions,
  getSessionsByServer,
  IotGatewayApi,
  removeSession,
} from '#/api/iot/gateway';
import {
  getClusterNodes,
  SystemClusterMonitorApi,
} from '#/api/system/monitor/cluster';

import SessionCard from './components/SessionCard.vue';
import SessionSidebar from './components/SessionSidebar.vue';

const RefreshIcon = createIconifyIcon('lucide:refresh-cw');

// --- State ---
const loadingNodes = ref(false);
const loadingSessions = ref(false);
const clusterNodes = ref<SystemClusterMonitorApi.ClusterNodeInfo[]>([]);
const sessions = ref<IotGatewayApi.DeviceSessionInfo[]>([]);

const selectedNodeId = ref<string | undefined>();

// --- Fetch Data ---
async function fetchNodes() {
  loadingNodes.value = true;
  try {
    const res = await getClusterNodes();
    // Combine local and other nodes for a full list
    const nodes: SystemClusterMonitorApi.ClusterNodeInfo[] = [];
    if (res.local) nodes.push(res.local);
    if (res.nodes?.length) nodes.push(...res.nodes);

    // Map serverId to ensure we have a valid ID (serverId or fallback to id)
    clusterNodes.value = nodes.map((node) => ({
      ...node,
      serverId: node.serverId || node.id, // Ensure serverId is populated
    }));

    // Ensure uniqueness based on serverId
    const uniqueNodesMap = new Map();
    clusterNodes.value.forEach((node) =>
      uniqueNodesMap.set(node.serverId, node),
    );
    clusterNodes.value = [...uniqueNodesMap.values()];
  } catch (error) {
    console.error('Failed to fetch cluster nodes:', error);
  } finally {
    loadingNodes.value = false;
  }
}

async function fetchSessions() {
  loadingSessions.value = true;
  try {
    let data: IotGatewayApi.DeviceSessionInfo[] = [];
    data = await (selectedNodeId.value
      ? getSessionsByServer(selectedNodeId.value)
      : getSessions());
    sessions.value = data;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
  } finally {
    loadingSessions.value = false;
  }
}

// --- Handlers ---
function handleNodeSelect(nodeId: string | undefined) {
  selectedNodeId.value = nodeId;
}

async function handleRemove(item: IotGatewayApi.DeviceSessionInfo) {
  try {
    await removeSession(item.deviceId);
    message.success($t('gateway.session.removeSuccess'));
    fetchSessions();
  } catch (error) {
    console.error('Failed to remove session:', error);
  }
}

watch(selectedNodeId, () => {
  fetchSessions();
});

onMounted(() => {
  fetchNodes();
  fetchSessions();
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full w-full gap-5">
      <!-- Sidebar: Cluster Nodes (Narrower) -->
      <div class="h-full w-[240px] shrink-0">
        <SessionSidebar
          :cluster-nodes="clusterNodes"
          :loading-nodes="loadingNodes"
          :selected-node-id="selectedNodeId"
          @select-node="handleNodeSelect"
        />
      </div>

      <!-- Main: Session Cards -->
      <div
        class="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#151515]"
      >
        <div class="mb-5 flex items-center justify-between gap-4">
          <div class="flex flex-1 items-center gap-4">
            <h3
              class="m-0 shrink-0 text-xl font-bold tracking-tight text-slate-800 dark:text-gray-100"
            >
              {{ $t('gateway.session.title') }}
            </h3>
          </div>

          <div class="flex items-center gap-4">
            <div
              class="flex items-center gap-2 border-r border-slate-200 pr-5 dark:border-gray-800"
            >
              <span
                class="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 opacity-80"
              >
                {{ $t('gateway.session.total', { count: sessions.length }) }}
              </span>
            </div>
            <Tooltip :title="$t('common.action.refresh')">
              <Button
                type="text"
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary/20 active:scale-95"
                :loading="loadingSessions"
                @click="fetchSessions"
              >
                <template #icon>
                  <RefreshIcon class="size-4" />
                </template>
              </Button>
            </Tooltip>
          </div>
        </div>

        <!-- Scrollable Grid -->
        <div class="flex-1 overflow-y-auto pr-1">
          <Spin :spinning="loadingSessions">
            <div
              v-if="sessions.length === 0 && !loadingSessions"
              class="flex h-[400px] items-center justify-center"
            >
              <Empty :description="$t('gateway.session.noSession')" />
            </div>

            <div
              v-else
              class="xxl:grid-cols-6 mb-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            >
              <SessionCard
                v-for="item in sessions"
                :key="item.deviceId"
                :item="item"
                @remove="handleRemove"
              />
            </div>
          </Spin>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
:deep(.ant-page-header) {
  padding: 0;
}

/* Custom Scrollbar for better UX */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  @apply rounded-full bg-slate-200 dark:bg-slate-800;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  @apply bg-slate-300 dark:bg-slate-700;
}
</style>
