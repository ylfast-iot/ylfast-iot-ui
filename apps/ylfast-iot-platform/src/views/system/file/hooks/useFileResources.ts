import type { FileBucketEntity } from '#/api/system/file';
import type { SystemClusterMonitorApi } from '#/api/system/monitor/cluster';

import { computed, ref } from 'vue';

import { $t } from '@vben/locales';

import { message, Modal } from 'ant-design-vue';

import { deleteFileBucket, queryFileBuckets } from '#/api/system/file';
import { getClusterNodes } from '#/api/system/monitor/cluster';

export function useFileResources(options?: { onBucketDeleted?: () => void }) {
  const loadingBuckets = ref(false);
  const loadingNodes = ref(false);
  const bucketList = ref<FileBucketEntity[]>([]);
  const clusterNodes = ref<SystemClusterMonitorApi.ClusterNodeInfo[]>([]);

  // Selection state
  const selectedNodeId = ref<string | undefined>(undefined);
  const selectedBucket = ref<'all' | 'default' | string>('all');

  const currentNode = computed(() =>
    clusterNodes.value.find((n) => n.serverId === selectedNodeId.value),
  );

  const initResources = async () => {
    loadingBuckets.value = true;
    loadingNodes.value = true;
    try {
      const [bucketRes, nodeRes] = await Promise.all([
        queryFileBuckets({ pageIndex: 0, pageSize: 999, paging: false }),
        getClusterNodes(),
      ]);
      bucketList.value = bucketRes.data || [];
      clusterNodes.value = nodeRes.nodes || [];
    } catch (error) {
      console.error('初始化失败', error);
      message.error($t('common.error')); // Using common.error if available, or just generic
    } finally {
      loadingBuckets.value = false;
      loadingNodes.value = false;
    }
  };

  const handleNodeSelect = (id: string | undefined) => {
    selectedNodeId.value = id;
  };

  const handleBucketSelect = (id: 'all' | 'default' | string) => {
    selectedBucket.value = id;
  };

  const handleDeleteBucket = (item: FileBucketEntity) => {
    Modal.confirm({
      title: $t('common.confirm'),
      content: $t('file.tips.deleteConfirmBucket', { name: item.name }),
      onOk: async () => {
        try {
          await deleteFileBucket(item.id);
          message.success($t('file.tips.deleteSuccess'));
          if (selectedBucket.value === item.id) selectedBucket.value = 'all';
          await initResources();
          options?.onBucketDeleted?.();
        } catch {
          message.error($t('file.tips.deleteFail'));
        }
      },
    });
  };

  const bucketMap = computed(() => {
    const map = new Map<string, string>();
    bucketList.value.forEach((b) => map.set(b.id, b.name));
    return map;
  });

  const nodeMap = computed(() => {
    const map = new Map<string, string>();
    clusterNodes.value.forEach((n) => {
      if (n.serverId) map.set(n.serverId, n.alias || n.host || n.serverId);
    });
    return map;
  });

  const getBucketLabel = (id?: string) => {
    if (!id || id === 'default') return $t('file.sidebar.defaultStorage');
    return bucketMap.value.get(id) || id || $t('file.bucket');
  };

  const getNodeLabel = (id?: string) => {
    if (!id || id === 'auto') return $t('file.upload.autoNode');
    return nodeMap.value.get(id) || id || $t('file.node');
  };

  return {
    loadingBuckets,
    loadingNodes,
    bucketList,
    clusterNodes,
    selectedNodeId,
    selectedBucket,
    currentNode,
    initResources,
    handleNodeSelect,
    handleBucketSelect,
    handleDeleteBucket,
    getBucketLabel,
    getNodeLabel,
  };
}
