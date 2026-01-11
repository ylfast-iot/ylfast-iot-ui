import type { BasicModel } from '#/api/basic';

import { requestClient } from '#/api/request';

/**
 * @description 集群监控 API
 */
export namespace SystemClusterMonitorApi {
  const BASE_URL = '/cluster/monitor';

  export interface ClusterNodeInfo extends BasicModel {
    alias?: string;
    serverId?: string;
    host: string;
    port: number;
    address?: string; // e.g. 192.168.1.100:8080
    self: boolean;
  }

  export interface ClusterInfo {
    clusterName: string;
    serverId: string;
    local: ClusterNodeInfo;
    nodes: ClusterNodeInfo[];
  }

  export interface ClusterNodeEvent {
    type: 'added' | 'leaving' | 'removed' | 'unknown' | 'updated';
    node: ClusterNodeInfo;
    timestamp: number;
  }

  export const Apis = {
    nodes: `${BASE_URL}/nodes`,
    listenNodes: `${BASE_URL}/nodes/stream`,
  };
}

/**
 * @description 获取集群节点列表
 */
export function getClusterNodes() {
  return requestClient.get<SystemClusterMonitorApi.ClusterInfo>(
    SystemClusterMonitorApi.Apis.nodes,
  );
}

/**
 * @description 监听集群节点列表
 * @param onMessage
 * @param onEnd
 * @param signal
 */
export const listenClusterNodes = (
  onMessage: (message: SystemClusterMonitorApi.ClusterNodeEvent) => void,
  onEnd?: () => void,
  signal?: AbortSignal,
) =>
  requestClient.requestSSE(
    SystemClusterMonitorApi.Apis.listenNodes,
    undefined,
    {
      method: 'GET',
      onMessage: (msg: string) => onMessage(JSON.parse(msg)),
      onEnd,
      signal,
    },
  );
