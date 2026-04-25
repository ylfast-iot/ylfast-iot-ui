<script setup lang="ts">
import type { ApplicationApi } from '#/api/system/application';
import type { OperationItem } from '#/components/business/open-api-selector/index.vue';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, message } from 'ant-design-vue';

import {
  grantApplication,
  queryApplicationGranted,
  queryApplicationOperations,
} from '#/api/system/application';
import { querySwaggerConfig, querySwaggerDocs } from '#/api/system/swagger';
import OpenApiSelector from '#/components/business/open-api-selector/index.vue';

const BackIcon = createIconifyIcon('lucide:arrow-left');

const route = useRoute();
const router = useRouter();
const appId = route.query.id as string;
const appName = route.query.name as string;

const loading = ref(false);
const saving = ref(false);

const originalOperationIds = ref<Set<string>>(new Set());
const selectedOperationIds = ref<Set<string>>(new Set());

const apiList = ref<OperationItem[]>([]);
const treeData = ref<any[]>([]);
const expandedKeys = ref<string[]>([]);

const fetchApiData = async () => {
  if (!appId) {
    message.error($t('common.invalidParams', '无效的应用ID参数'));
    return;
  }

  try {
    loading.value = true;

    // 1. 并发获取：全局可见配置(白名单)、Swagger文档入口、当前应用已赋权的数据
    const [operationsRes, configRes, grantedRes] = await Promise.all([
      // 查询全局启用的API
      queryApplicationOperations(),
      querySwaggerConfig(),
      // 获取当前应用已经拥有的授权
      queryApplicationGranted(appId),
    ]);

    // 提取全局生效的 operationId 作为白名单字典
    const activeWhitelistIds = new Set(operationsRes.map((i) => i.operationId));

    // 根据应用的授权回显配置勾选状态
    const grantedScopes = new Set<string>(
      grantedRes.map((item) => item.operationId),
    );
    originalOperationIds.value = new Set(grantedScopes);
    selectedOperationIds.value = new Set(grantedScopes);

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
        message.warning(
          `${$t('application.docLoadFailed', '接口文档加载失败')}: [${u.name}]`,
        );
        return null;
      }
    });

    const docsResults = await Promise.all(docsPromises);

    // 4. 解析文档，扁平化和构建树，仅保留全局白名单中已包含的 api
    const allApis: OperationItem[] = [];
    const tree: any[] = [];
    const expanded: string[] = [];
    const uniqueCheck = new Set<string>();

    for (const result of docsResults) {
      if (!result || !result.doc || !result.doc.paths) continue;

      const docName = result.name;
      const docKey = `doc::${docName}`;

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

            // 仅仅展示全局已启用的 API 白名单范围内的接口
            if (!activeWhitelistIds.has(opId)) return;

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
              docNode._tags.add($t('common.ungrouped', '未分组'));
            } else {
              tags.forEach((t: any) => docNode._tags.add(t));
            }

            // 获取安全权限声明
            const permissions: Record<string, string[]>[] =
              operationObj.security || [];

            allApis.push({
              id: opId,
              path: pathName,
              method: methodName.toUpperCase(),
              summary: operationObj.summary || '-',
              tags,
              docName,
              deprecated: !!operationObj.deprecated,
              permissions,
            });
          },
        );
      });

      // 只有该文档中存在效 API 节点时，才将其添加到分组树中
      if (docNode._tags.size > 0) {
        expanded.push(docKey);

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
    }

    apiList.value = allApis;
    treeData.value = tree;
    expandedKeys.value = expanded;
  } catch (error) {
    console.error(error);
    message.error($t('application.loadApiDataFailed', '加载 API 数据失败'));
  } finally {
    loading.value = false;
  }
};

const handleGoBack = () => {
  router.back();
};

const handleReset = () => {
  selectedOperationIds.value = new Set(originalOperationIds.value);
  message.success($t('application.resetSuccess', '已重置为当前保存状态'));
};

const handleSave = async () => {
  if (!appId) return;

  try {
    saving.value = true;
    const finalIds = [...selectedOperationIds.value];

    // 映射组装 request operations payload并包含所选API提取的 permissions
    const operations: ApplicationApi.ApiGrantRequestOperation[] = finalIds.map(
      (id) => {
        const opItem = apiList.value.find((api) => api.id === id);
        return {
          id,
          permissions: opItem?.permissions || [],
        };
      },
    );

    await grantApplication(appId, {
      clientId: appId, // 常规上 clientId 同 appId，如有单独字段可调整
      operations,
    });

    // 更新 original 为当前状态，避免再次重置回老数据
    originalOperationIds.value = new Set(finalIds);
    message.success($t('application.apiGrantSaveSuccess', 'API 赋权保存成功'));
  } catch (error) {
    console.error(error);
    message.error($t('application.apiGrantSaveFailed', 'API 赋权保存失败'));
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
    :description="
      $t('application.apiGrantDesc', [
        appName || appId || $t('common.loading', '正在加载'),
      ])
    "
  >
    <template #title>
      <div class="flex items-center">
        <Button class="-ml-3 mr-2" type="link" @click="handleGoBack">
          <template #icon><BackIcon /></template>
        </Button>
        <span class="text-lg font-medium">{{
          $t('application.apiGrantTitle', '应用 API 赋权')
        }}</span>
      </div>
    </template>

    <OpenApiSelector
      v-model="selectedOperationIds"
      v-model:expanded-keys="expandedKeys"
      :api-list="apiList"
      :tree-data="treeData"
      :loading="loading"
      :saving="saving"
      :page-title="$t('application.apiGrantTitle', '应用 API 赋权')"
      :empty-text="$t('common.noData', '当前数据为空')"
      @reset="handleReset"
      @save="handleSave"
    />
  </Page>
</template>
