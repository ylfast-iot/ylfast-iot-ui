<script setup lang="ts">
import type { OperationItem } from '#/components/business/open-api-selector/index.vue';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import {
  batchSaveApplicationOperations,
  queryApplicationOperations,
} from '#/api/system/application';
import { querySwaggerConfig, querySwaggerDocs } from '#/api/system/swagger';
import OpenApiSelector from '#/components/business/open-api-selector/index.vue';

const loading = ref(false);
const saving = ref(false);

const originalOperationIds = ref<Set<string>>(new Set());
const selectedOperationIds = ref<Set<string>>(new Set());

const apiList = ref<OperationItem[]>([]);
const treeData = ref<any[]>([]);
const expandedKeys = ref<string[]>([]);

const fetchApiData = async () => {
  try {
    loading.value = true;

    // 1. 并发获取：当前后端已保存的白名单、Swagger总配置
    const [operationsRes, configRes] = await Promise.all([
      queryApplicationOperations(),
      querySwaggerConfig(),
    ]);

    // 初始化白名单
    const whitelists = new Set<string>(
      operationsRes.map((item) => item.operationId),
    );
    originalOperationIds.value = new Set(whitelists);
    selectedOperationIds.value = new Set(whitelists);

    // 2. 如果没有urls配置，直接退出
    const urls = configRes.urls || [];
    if (urls.length === 0) {
      return;
    }

    // 3. 并发拉取每个 swagger group 的具体文档
    const docsPromises = urls.map(async (u) => {
      try {
        const docRes = await querySwaggerDocs(u.url);
        return { name: u.name, doc: docRes };
      } catch (error) {
        console.error(`Failed to load swagger doc: ${u.name}`, error);
        message.warning(`接口文档 [${u.name}] 加载失败`);
        return null;
      }
    });

    const docsResults = await Promise.all(docsPromises);

    // 4. 解析文档，扁平化和构建树
    const allApis: OperationItem[] = [];
    const tree: any[] = [];
    const expanded: string[] = [];

    const uniqueCheck = new Set<string>();

    for (const result of docsResults) {
      if (!result || !result.doc || !result.doc.paths) continue;

      const docName = result.name;
      const docKey = `doc::${docName}`;
      expanded.push(docKey);

      const docNode = {
        title: docName,
        key: docKey,
        children: [] as any[],
        // 挂载一个 tag 集合用于去重生成子节点
        _tags: new Set<string>(),
      };

      // 遍历 paths
      Object.entries(result.doc.paths).forEach(([pathName, pathObj]) => {
        if (!pathObj) return;

        // 遍历 methods (get, post, etc.)
        Object.entries(pathObj).forEach(
          ([methodName, operationObj]: [string, any]) => {
            if (!operationObj || !operationObj.operationId) return; // 必须有 operationId

            const opId = operationObj.operationId;

            // 解决 operationId 冲突（如不同 path 有同名 operationId）
            if (uniqueCheck.has(opId)) {
              // 冲突保留第一个
              return;
            }
            uniqueCheck.add(opId);

            const tags =
              Array.isArray(operationObj.tags) && operationObj.tags.length > 0
                ? operationObj.tags
                : [];

            if (tags.length === 0) {
              docNode._tags.add('未分组');
            } else {
              tags.forEach((t: any) => docNode._tags.add(t));
            }

            allApis.push({
              id: opId,
              path: pathName,
              method: methodName.toUpperCase(),
              summary: operationObj.summary || '-',
              tags,
              docName,
              deprecated: !!operationObj.deprecated,
            });
          },
        );
      });

      // 构建二级树节点
      [...docNode._tags].sort().forEach((tag) => {
        docNode.children.push({
          title: tag,
          key: `tag::${docName}::${tag}`,
        });
      });
      delete (docNode as any)._tags;

      tree.push(docNode);
    }

    apiList.value = allApis;
    treeData.value = tree;
    expandedKeys.value = expanded;
  } catch (error) {
    console.error(error);
    message.error('加载 API 数据失败');
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  selectedOperationIds.value = new Set(originalOperationIds.value);
  message.success('已重置为当前保存状态');
};

const handleSave = async () => {
  try {
    saving.value = true;
    const finalIds = [...selectedOperationIds.value];
    await batchSaveApplicationOperations(finalIds);
    // 更新 original 为当前状态，避免再次重置回老数据
    originalOperationIds.value = new Set(finalIds);
    message.success('保存成功');
  } catch (error) {
    console.error(error);
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchApiData();
});
</script>

<template>
  <Page
    auto-content-height
    description="配置系统支持API赋权的范围"
    title="系统 API 授权范围配置"
  >
    <OpenApiSelector
      v-model="selectedOperationIds"
      v-model:expanded-keys="expandedKeys"
      :api-list="apiList"
      :tree-data="treeData"
      :loading="loading"
      :saving="saving"
      page-title="系统 API 授权范围配置"
      empty-text="当前分组暂无接口"
      @reset="handleReset"
      @save="handleSave"
    />
  </Page>
</template>
