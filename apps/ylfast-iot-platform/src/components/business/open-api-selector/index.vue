<script setup lang="ts">
import type { VxeGridProps } from '#/adapter/vxe-table';

import { computed, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { useWindowSize } from '@vueuse/core';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Dropdown,
  Input,
  Menu,
  MenuItem,
  Space,
  Tag,
  Tree,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

const props = defineProps<{
  apiList: OperationItem[];
  emptyText?: string;
  expandedKeys: string[];
  loading?: boolean;
  modelValue: Set<string>; // Selected operation IDs
  pageDescription?: string;
  pageTitle?: string;
  saving?: boolean;
  treeData: any[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Set<string>): void;
  (e: 'save'): void;
  (e: 'reset'): void;
  (e: 'update:expandedKeys', value: string[]): void;
}>();

const MoreIcon = createIconifyIcon('lucide:more-vertical');

export interface OperationItem {
  id: string;
  path: string;
  method: string;
  summary: string;
  tags: string[];
  docName: string;
  deprecated: boolean;
  [key: string]: any;
}

const { height } = useWindowSize();

const searchText = ref('');
const treeSearchText = ref('');
const selectedKeys = ref<string[]>([]);

const selectedOperationIds = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const internalExpandedKeys = computed({
  get: () => props.expandedKeys,
  set: (val) => emit('update:expandedKeys', val),
});

// 计算每个树节点被选中的接口数量
const getCheckedCountForNode = (nodeKey: string) => {
  let count = 0;

  if (nodeKey.startsWith('doc::')) {
    const docName = nodeKey.replace('doc::', '');
    const nodeApis = props.apiList.filter((item) => item.docName === docName);
    count = nodeApis.filter((api) =>
      selectedOperationIds.value.has(api.id),
    ).length;
  } else if (nodeKey.startsWith('tag::')) {
    const parts = nodeKey.replace('tag::', '').split('::');
    const docName = parts[0];
    const tagName = parts[1];
    const nodeApis = props.apiList.filter(
      (item) =>
        item.docName === docName &&
        (tagName === '未分组'
          ? item.tags.length === 0
          : item.tags.includes(tagName!)),
    );
    count = nodeApis.filter((api) =>
      selectedOperationIds.value.has(api.id),
    ).length;
  }
  return count;
};

// 过滤左侧树节点
const filteredTreeData = computed(() => {
  if (!treeSearchText.value) {
    return props.treeData;
  }
  const lowerSearch = treeSearchText.value.toLowerCase();
  return props.treeData
    .map((doc) => {
      if (doc.title.toLowerCase().includes(lowerSearch)) return doc;
      const filteredChildren = doc.children.filter((child: any) =>
        child.title.toLowerCase().includes(lowerSearch),
      );
      if (filteredChildren.length > 0) {
        return { ...doc, children: filteredChildren };
      }
      return null;
    })
    .filter(Boolean);
});

// 根据左侧树和顶部搜索词过滤右侧列表
const filteredApiList = computed(() => {
  let list = props.apiList;

  if (selectedKeys.value.length > 0) {
    const key = selectedKeys.value[0]!;
    if (key.startsWith('doc::')) {
      const docName = key.replace('doc::', '');
      list = list.filter((item) => item.docName === docName);
    } else if (key.startsWith('tag::')) {
      const parts = key.replace('tag::', '').split('::');
      const docName = parts[0];
      const tagName = parts[1];
      list = list.filter(
        (item) =>
          item.docName === docName &&
          (tagName === '未分组'
            ? item.tags.length === 0
            : item.tags.includes(tagName!)),
      );
    }
  }

  if (searchText.value) {
    const lowerSearch = searchText.value.toLowerCase();
    list = list.filter(
      (item) =>
        item.path.toLowerCase().includes(lowerSearch) ||
        item.summary.toLowerCase().includes(lowerSearch) ||
        item.id.toLowerCase().includes(lowerSearch),
    );
  }

  return list;
});

// 计算当前列表的勾选状态
const currentListCheckState = computed(() => {
  if (filteredApiList.value.length === 0) {
    return { checked: false, indeterminate: false };
  }
  const currentIds = filteredApiList.value.map((item) => item.id);
  const checkedCount = currentIds.filter((id) =>
    selectedOperationIds.value.has(id),
  ).length;

  return {
    checked: checkedCount === currentIds.length && checkedCount > 0,
    indeterminate: checkedCount > 0 && checkedCount < currentIds.length,
  };
});

// === Methods ===
const gridOptions: VxeGridProps<OperationItem> = {
  columns: [
    {
      field: 'checkbox',
      title: '目前操作',
      width: 80,
      align: 'center',
      fixed: 'left',
      slots: { default: 'checkbox' },
    },
    {
      field: 'method',
      title: '请求方法',
      width: 100,
      align: 'center',
      slots: { default: 'method' },
    },
    {
      field: 'path',
      title: 'API 路径',
      minWidth: 300,
      slots: { default: 'path' },
    },
    {
      field: 'summary',
      title: '说明',
      minWidth: 300,
    },
    {
      field: 'id',
      title: 'Operation ID',
      minWidth: 200,
      slots: { default: 'id' },
    },
  ],
  data: [],
  height: 'auto',
  pagerConfig: { enabled: false },
  scrollY: { enabled: true, gt: 0 },
  showOverflow: true,
  rowConfig: { keyField: 'id' },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

watch(
  filteredApiList,
  (newList) => {
    gridApi.setGridOptions({ data: newList });
  },
  { immediate: true },
);

watch(
  () => props.loading,
  (loading) => {
    gridApi.setLoading(!!loading);
  },
);

const handleTreeSelect = (keys: any[]) => {
  selectedKeys.value = keys;
};

const handleSelectAllCurrent = (e: any) => {
  const checked = e.target.checked;
  const currentIds = filteredApiList.value.map((item) => item.id);

  const newSet = new Set(selectedOperationIds.value);
  if (checked) {
    currentIds.forEach((id) => newSet.add(id));
  } else {
    currentIds.forEach((id) => newSet.delete(id));
  }
  selectedOperationIds.value = newSet;
};

const handleRowCheckboxChange = (row: OperationItem, checked: boolean) => {
  const newSet = new Set(selectedOperationIds.value);
  if (checked) {
    newSet.add(row.id);
  } else {
    newSet.delete(row.id);
  }
  selectedOperationIds.value = newSet;
};

const handleExpandAll = () => {
  const keys: string[] = [];
  props.treeData.forEach((doc) => {
    keys.push(doc.key);
    doc.children?.forEach((child: any) => {
      keys.push(child.key);
    });
  });
  internalExpandedKeys.value = keys;
};

const handleCollapseAll = () => {
  internalExpandedKeys.value = [];
};

const handleReset = () => emit('reset');
const handleSave = () => emit('save');

const getMethodColor = (method: string) => {
  const map: Record<string, string> = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'cyan',
  };
  return map[method] || 'default';
};
</script>

<template>
  <div class="flex gap-4" :style="{ height: `${height - 215}px` }">
    <!-- 左侧：分组树 -->
    <Card
      class="flex w-[280px] shrink-0 flex-col overflow-hidden"
      size="small"
      :body-style="{
        padding: '8px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }"
    >
      <template #title>
        <div class="flex items-center justify-between">
          <span>API 分组</span>
          <Dropdown :trigger="['click']">
            <template #overlay>
              <Menu>
                <MenuItem key="expand" @click="handleExpandAll">
                  展开全部
                </MenuItem>
                <MenuItem key="collapse" @click="handleCollapseAll">
                  关闭展开
                </MenuItem>
              </Menu>
            </template>
            <Button
              type="text"
              size="small"
              class="px-1 text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              <MoreIcon class="size-4" />
            </Button>
          </Dropdown>
        </div>
      </template>
      <div class="mb-2 shrink-0">
        <Input.Search
          v-model:value="treeSearchText"
          allow-clear
          placeholder="搜索树节点"
        />
      </div>
      <div class="flex-1 overflow-y-auto">
        <Tree
          v-if="filteredTreeData.length > 0"
          v-model:expanded-keys="internalExpandedKeys"
          :selected-keys="selectedKeys"
          :tree-data="filteredTreeData"
          show-line
          @select="handleTreeSelect"
        >
          <template #title="{ title, key }">
            <div class="group relative flex items-center pr-2">
              <span
                :title="title"
                class="inline-block max-w-[190px] truncate align-bottom"
              >
                {{ title }}
              </span>
              <Badge
                class="ml-2 scale-75"
                v-if="getCheckedCountForNode(key) > 0"
                :count="getCheckedCountForNode(key)"
                :number-style="{
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  boxShadow: 'none',
                }"
              />
            </div>
          </template>
        </Tree>
        <div v-else-if="!loading" class="p-4 text-center text-muted-foreground">
          暂无接口文档
        </div>
      </div>
    </Card>

    <!-- 右侧：接口列表 -->
    <Card
      class="flex-1 overflow-hidden"
      size="small"
      :body-style="{
        padding: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }"
    >
      <!-- 顶部操作栏 -->
      <div
        class="flex shrink-0 items-center justify-between border-b border-border p-3"
      >
        <Space>
          <Checkbox
            :checked="currentListCheckState.checked"
            :indeterminate="currentListCheckState.indeterminate"
            @change="handleSelectAllCurrent"
          >
            全选当前列表
          </Checkbox>
          <span class="text-sm text-muted-foreground">
            (当前列表: {{ filteredApiList.length }} 项 / 已选总数:
            {{ selectedOperationIds.size }} 项)
          </span>
        </Space>
        <Input.Search
          v-model:value="searchText"
          allow-clear
          class="w-64"
          placeholder="搜索路径 / 说明 / ID"
        />
      </div>

      <!-- 警告提示 (如果在没选任何分类时) -->
      <div
        v-if="
          selectedKeys.length === 0 && !searchText && props.apiList.length > 0
        "
        class="shrink-0 p-3 pb-0"
      >
        <Alert
          type="info"
          message="当前显示所有接口，请在左侧选择分组或使用搜索功能缩小范围"
          show-icon
        />
      </div>

      <!-- 表格滚动区域 -->
      <div class="flex-1 overflow-hidden bg-[hsl(var(--background))] p-3">
        <Grid>
          <template #checkbox="{ row }">
            <Checkbox
              :checked="selectedOperationIds.has(row.id)"
              @change="
                (e: any) =>
                  handleRowCheckboxChange(
                    row as OperationItem,
                    e.target.checked,
                  )
              "
            />
          </template>
          <template #method="{ row }">
            <Tag :color="getMethodColor(row.method)">{{ row.method }}</Tag>
          </template>
          <template #path="{ row }">
            <span
              :class="
                row.deprecated
                  ? 'text-muted-foreground line-through'
                  : 'font-mono'
              "
            >
              {{ row.path }}
            </span>
            <Tag v-if="row.deprecated" color="red" class="ml-2">已废弃</Tag>
          </template>
          <template #id="{ row }">
            <span class="font-mono text-xs text-muted-foreground">{{
              row.id
            }}</span>
          </template>
          <template #empty>
            <div class="py-10 text-center">
              <span class="text-muted-foreground">{{
                loading ? '加载中...' : emptyText || '当前数据为空'
              }}</span>
            </div>
          </template>
        </Grid>
      </div>

      <!-- 底部保存条 -->
      <div
        class="flex shrink-0 items-center justify-between border-t border-border bg-[hsl(var(--card))] p-3"
      >
        <div class="text-sm text-muted-foreground">
          修改配置后请务必点击保存以生效
        </div>
        <Space>
          <Button @click="handleReset" :disabled="loading || saving">
            重置
          </Button>
          <Button
            type="primary"
            :loading="saving"
            :disabled="loading"
            @click="handleSave"
          >
            {{ props.pageTitle?.includes('配置') ? '保存配置' : '保存授权' }}
          </Button>
        </Space>
      </div>
    </Card>
  </div>
</template>
