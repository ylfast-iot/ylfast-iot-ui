<script setup lang="ts">
import type { SystemMenuApi } from '#/api/system/menu';

import { computed, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button,
  Empty,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Tag,
  Tree,
} from 'ant-design-vue';

import { getGlobalComponent } from '#/adapter/component/components';
import { queryRemoteMenuTree } from '#/api/system/application';

const props = withDefaults(
  defineProps<{
    appId?: string;
    /** 是否为编辑模式，新增时不显示远程菜单相关功能 */
    isEdit?: boolean;
    modelValue?: SystemMenuApi.Menu[];
    /** 页面集成配置中的菜单查询接口路径，为空则禁用远程同步 */
    remoteApiPath?: string;
  }>(),
  {
    modelValue: () => [],
    appId: '',
    isEdit: false,
    remoteApiPath: '',
  },
);

const emit = defineEmits<{
  'update:modelValue': [SystemMenuApi.Menu[]];
}>();

const RefreshIcon = createIconifyIcon('lucide:refresh-cw');

const PlusIcon = createIconifyIcon('lucide:plus');
const DeleteIcon = createIconifyIcon('lucide:trash-2');

// 页面集成菜单编辑器只维护“编辑态字段”。
// 运行时需要的 IFrameView、iframeSrc、owner、application 等字段由后端统一归一化，避免前端手工拼装。
// interface DisplayMenuItem {
//   level: number;
//   menu: SystemMenuApi.Menu;
// }

const GlobalIconPicker = getGlobalComponent('IconPicker');

const PAGE_PATH_OPTION = 'pagePath';

const menus = computed(() => props.modelValue || []);

// 远程菜单逻辑
const remoteMenus = ref<any[]>([]);
const isLoadingRemote = ref(false);
const hasRemoteValue = computed(() => remoteMenus.value.length > 0);

// 是否可以拉取远程菜单：必须是编辑模式，且菜单查询接口路径不为空
const canFetchRemote = computed(
  () => props.isEdit && !!props.remoteApiPath?.trim(),
);

async function loadRemoteMenus() {
  if (!props.appId || !canFetchRemote.value) return;
  try {
    isLoadingRemote.value = true;
    const res = await queryRemoteMenuTree(props.appId, props.remoteApiPath);
    remoteMenus.value = res || [];
  } catch (error) {
    console.error('Failed to load remote menus:', error);
  } finally {
    isLoadingRemote.value = false;
  }
}

// 进入时自动加载：如果已经在编辑模式，且有 appId 和远程路径，则自动查询
watch(
  [() => props.appId, () => props.isEdit, () => props.remoteApiPath],
  ([appId, isEdit, path]) => {
    if (appId && isEdit && path?.trim() && remoteMenus.value.length === 0) {
      loadRemoteMenus();
    }
  },
  { immediate: true },
);

// 计算选中的远程菜单 ID
const checkedKeysSet = computed(() => {
  return new Set(
    menus.value
      .filter((m) => m.id && !m.id.startsWith('page-menu-')) // 排除手动创建的
      .map((m) => m.id),
  );
});

const checkedKeys = computed(() => [...checkedKeysSet.value]);

function convertToLocalMenu(
  remote: SystemMenuApi.MenuView,
): SystemMenuApi.Menu {
  return {
    id: remote.id,
    name: remote.name,
    code: remote.code || remote.id,
    icon: remote.icon || '',
    url: remote.url || '',
    describe: remote.describe || '',
    status: 1,
    sortIndex: remote.sortIndex || 0,
    parentId: remote.parentId || '',
    options: { [PAGE_PATH_OPTION]: remote.options?.[PAGE_PATH_OPTION] || '' },
  } as unknown as SystemMenuApi.Menu;
}

function handleCheckRemote(_checked: any, info: any) {
  const node = info.node.dataRef as SystemMenuApi.MenuView;
  // Node info toggle
  const isChecked = info.checked;

  if (isChecked) {
    const toAdd: SystemMenuApi.Menu[] = [];
    const recursiveAdd = (n: any) => {
      if (!checkedKeysSet.value.has(n.id)) {
        toAdd.push(convertToLocalMenu(n));
      }
      if (n.children?.length) {
        n.children.forEach((element: any) => {
          recursiveAdd(element);
        });
      }
    };
    recursiveAdd(node);

    if (toAdd.length > 0) {
      setMenus([...menus.value, ...toAdd]);
    }
  } else {
    // 移除选中节点及其子节点
    const toRemoveIds = new Set<string>();
    const collectIds = (n: any) => {
      toRemoveIds.add(n.id);
      if (n.children?.length) {
        n.children.forEach((element: any) => {
          collectIds(element);
        });
      }
    };
    collectIds(node);
    setMenus(menus.value.filter((m) => !toRemoveIds.has(m.id)));
  }
}

const selectedMenuId = ref<string>('');

const currentMenu = computed(() => {
  return menus.value.find((m) => m.id === selectedMenuId.value);
});

// 计算已选菜单树
const selectedMenuTree = computed(() => {
  const map = new Map<string, any>();
  const roots: any[] = [];

  const source = menus.value.map((m) => ({
    ...m,
    title: m.name || m.code || m.id,
    key: m.id,
    children: [] as any[],
  }));

  source.forEach((node) => map.set(node.id, node));

  source.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  // 排序
  const sortNodes = (nodes: any[]) => {
    nodes.sort((a, b) => (a.sortIndex || 0) - (b.sortIndex || 0));
    nodes.forEach((n) => {
      if (n.children?.length) sortNodes(n.children);
    });
  };
  sortNodes(roots);

  return roots;
});

function handleSelectMenu(selectedKeys: any[]) {
  if (selectedKeys.length > 0) {
    selectedMenuId.value = selectedKeys[0];
  }
}

// 每次回写时都把 children 清空，保持 v-model 数据结构为“平铺菜单数组”。

function setMenus(next: SystemMenuApi.Menu[]) {
  emit(
    'update:modelValue',
    next.map((menu) => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const { children, ...rest } = menu;
      return {
        ...rest,
        // @ts-ignore
        children: undefined as unknown as SystemMenuApi.Menu[],
        options: normalizeOptions(menu.options),
      } as SystemMenuApi.Menu;
    }),
  );
}

// 新建菜单时只填充编辑阶段必须的基础字段，其他运行时字段交给后端统一补齐。
function createMenu(parentId?: string): SystemMenuApi.Menu {
  return {
    id: `page-menu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    code: '',
    icon: '',
    // url 现在表示“当前系统中的路由地址”。
    url: '',
    component: '',
    describe: '',
    status: 1,
    permissions: [],
    buttons: [],
    owner: '',
    application: '',
    creatorId: '',
    createTime: Date.now(),
    sortIndex: 0,
    options: { [PAGE_PATH_OPTION]: '' },
    parentId: parentId || '',
  } as unknown as SystemMenuApi.Menu;
}

function addRootMenu() {
  const newMenu = createMenu();
  setMenus([...menus.value, newMenu]);
  selectedMenuId.value = newMenu.id;
}

function addChildMenu(parentId: string) {
  const newMenu = createMenu(parentId);
  setMenus([...menus.value, newMenu]);
  selectedMenuId.value = newMenu.id;
}

function updateMenu(id: string, patch: Partial<SystemMenuApi.Menu>) {
  setMenus(
    menus.value.map((menu) =>
      menu.id === id
        ? {
            ...menu,
            ...patch,
            options: normalizeOptions(patch.options ?? menu.options),
          }
        : menu,
    ),
  );
}

function updateMenuPagePath(id: string, value: string) {
  setMenus(
    menus.value.map((menu) => {
      if (menu.id !== id) {
        return menu;
      }
      return {
        ...menu,
        options: {
          ...normalizeOptions(menu.options),
          [PAGE_PATH_OPTION]: value,
        },
      };
    }),
  );
}

function normalizeOptions(options?: Record<string, any>) {
  return {
    ...options,
    [PAGE_PATH_OPTION]: options?.[PAGE_PATH_OPTION] || '',
  };
}

function getMenuPagePath(menu: SystemMenuApi.Menu) {
  return `${menu.options?.[PAGE_PATH_OPTION] || ''}`;
}

// function hasChildren(menuId: string) {
//   return menus.value.some((menu) => menu.parentId === menuId);
// }

// 删除父菜单时级联删除所有后代，避免留下孤儿菜单。
function removeMenu(id: string) {
  const removeIds = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    menus.value.forEach((menu) => {
      if (
        menu.parentId &&
        removeIds.has(menu.parentId) &&
        !removeIds.has(menu.id)
      ) {
        removeIds.add(menu.id);
        changed = true;
      }
    });
  }
  setMenus(menus.value.filter((menu) => !removeIds.has(menu.id)));
  if (removeIds.has(selectedMenuId.value)) {
    selectedMenuId.value = '';
  }
}

// 选择父菜单时要排除自己和所有后代，避免形成循环引用。
function resolveParentOptions(currentId: string) {
  const forbiddenIds = new Set<string>([currentId]);
  let changed = true;
  while (changed) {
    changed = false;
    menus.value.forEach((menu) => {
      if (
        menu.parentId &&
        forbiddenIds.has(menu.parentId) &&
        !forbiddenIds.has(menu.id)
      ) {
        forbiddenIds.add(menu.id);
        changed = true;
      }
    });
  }

  const options: { label: string; value: string }[] = [
    {
      label: $t('application.pageMenus.root', '作为顶级菜单'),
      value: '',
    },
  ];

  const traverse = (nodes: any[], level = 0) => {
    nodes.forEach((node) => {
      if (!forbiddenIds.has(node.id)) {
        options.push({
          label: `${'　'.repeat(level)}${node.name || node.code || node.id}`,
          value: node.id,
        });
        if (node.children?.length) {
          traverse(node.children, level + 1);
        }
      }
    });
  };

  traverse(selectedMenuTree.value);
  return options;
}
</script>

<template>
  <div class="space-y-6">
    <!-- 头部信息 -->
    <div
      class="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-gray-800"
    >
      <div>
        <div class="text-sm font-medium">
          {{ $t('application.pageMenus.title', '页面菜单配置') }}
        </div>
        <div class="mt-1 text-xs text-slate-500">
          {{
            $t(
              'application.pageMenus.desc',
              '维护名称、编码、系统内路由地址与远端嵌入路径；保存时后端会自动转换为 IFrame 页面菜单。',
            )
          }}
        </div>
      </div>
      <Space>
        <Button
          v-if="isEdit"
          size="small"
          :disabled="!canFetchRemote"
          :loading="isLoadingRemote"
          @click="loadRemoteMenus"
        >
          <template #icon><RefreshIcon /></template>
          {{ $t('application.pageMenus.loadRemote', '加载远程菜单') }}
        </Button>
        <Button
          v-if="!hasRemoteValue"
          type="primary"
          size="small"
          @click="addRootMenu"
        >
          <template #icon><PlusIcon /></template>
          {{ $t('application.pageMenus.addRoot', '新增顶级菜单') }}
        </Button>
      </Space>
    </div>

    <!-- 远程菜单选择区 (仅在有远程菜单时显示) -->
    <div
      v-if="isEdit && hasRemoteValue"
      class="rounded-lg border border-primary/20 bg-primary/5 p-4 dark:bg-primary/10"
    >
      <div class="mb-3 flex items-center gap-2">
        <Tag color="blue">
          {{ $t('application.pageMenus.remoteCandidate', '远端候选菜单') }}
        </Tag>
        <span class="text-xs text-slate-500">{{
          $t(
            'application.pageMenus.remoteHint',
            '勾选下方菜单以将其同步到平台菜单列表中',
          )
        }}</span>
      </div>
      <Spin :spinning="isLoadingRemote">
        <Tree
          checkable
          block-node
          default-expand-all
          :tree-data="remoteMenus"
          :checked-keys="checkedKeys"
          :field-names="{ title: 'name', key: 'id', children: 'children' }"
          @check="handleCheckRemote"
          class="bg-transparent"
        >
          <template #title="node">
            <div class="block w-full truncate" :title="node.name">
              {{ node.name }}
            </div>
          </template>
        </Tree>
      </Spin>
    </div>

    <!-- 已选/手动编辑区: 树形 + 表单 -->
    <div class="flex flex-col space-y-4">
      <div
        v-if="hasRemoteValue"
        class="flex items-center gap-2 border-l-4 border-primary pl-3"
      >
        <span class="text-sm font-semibold text-slate-700 dark:text-gray-300">
          {{ $t('application.pageMenus.selectedList', '当前配置列表') }}
        </span>
        <span class="text-[10px] text-slate-400">({{ menus.length }})</span>
      </div>

      <div
        v-if="menus.length > 0"
        class="flex min-h-[500px] gap-4 rounded-xl border border-slate-100 bg-slate-50/30 p-4 dark:border-gray-800 dark:bg-gray-900/30"
      >
        <!-- 左侧树 -->
        <div
          class="w-1/3 min-w-[260px] max-w-[400px] overflow-hidden border-r border-slate-100 pr-4 transition-all dark:border-gray-800"
        >
          <Tree
            block-node
            default-expand-all
            :tree-data="selectedMenuTree"
            :selected-keys="selectedMenuId ? [selectedMenuId] : []"
            @select="handleSelectMenu"
            class="bg-transparent"
          >
            <template #title="node">
              <div
                class="group flex w-full min-w-0 items-center justify-between py-1"
              >
                <div
                  class="flex min-w-0 flex-1 items-center gap-2 overflow-hidden"
                >
                  <span
                    class="block truncate"
                    :class="
                      selectedMenuId === node.id ? 'font-bold text-primary' : ''
                    "
                    :title="node.name || node.code || node.id"
                  >
                    {{ node.name || node.code || node.id }}
                  </span>
                </div>
                <!-- 操作按钮，仅限手动模式 -->
                <Space
                  v-if="!hasRemoteValue"
                  class="invisible ml-2 group-hover:visible"
                >
                  <Button
                    type="link"
                    size="small"
                    padding="0"
                    title="添加子菜单"
                    @click.stop="addChildMenu(node.id)"
                  >
                    <PlusIcon class="size-3" />
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    padding="0"
                    danger
                    title="删除"
                    @click.stop="removeMenu(node.id)"
                  >
                    <DeleteIcon class="size-3" />
                  </Button>
                </Space>
              </div>
            </template>
          </Tree>
        </div>

        <!-- 右侧表单 -->
        <div class="flex-1 pl-4">
          <div v-if="currentMenu" class="space-y-6">
            <div
              class="mb-4 flex items-center justify-between border-b border-dashed border-slate-100 pb-4 dark:border-gray-800"
            >
              <div class="flex items-center gap-2">
                <span
                  class="text-sm font-bold text-slate-600 dark:text-gray-300"
                >
                  {{ $t('application.pageMenus.editing', '正在编辑:') }}
                </span>
                <Tag color="blue">{{ currentMenu.name || currentMenu.id }}</Tag>
              </div>
              <Button
                v-if="!hasRemoteValue"
                danger
                ghost
                size="small"
                @click="removeMenu(currentMenu.id)"
              >
                <template #icon><DeleteIcon /></template>
                {{ $t('common.action.delete', '删除当前菜单') }}
              </Button>
            </div>

            <div class="grid grid-cols-2 gap-x-6 gap-y-4">
              <div class="col-span-1">
                <div class="mb-1 text-[11px] font-medium text-slate-400">
                  {{ $t('application.pageMenus.fields.name', '菜单名称') }}
                </div>
                <Input
                  v-model:value="currentMenu.name"
                  :placeholder="
                    $t(
                      'application.pageMenus.placeholders.name',
                      '请输入菜单名称',
                    )
                  "
                  @change="setMenus([...menus])"
                />
              </div>
              <div class="col-span-1">
                <div class="mb-1 text-[11px] font-medium text-slate-400">
                  {{ $t('application.pageMenus.fields.code', '菜单编码') }}
                </div>
                <Input
                  v-model:value="currentMenu.code"
                  :placeholder="
                    $t(
                      'application.pageMenus.placeholders.code',
                      '请输入菜单编码',
                    )
                  "
                  @change="setMenus([...menus])"
                />
              </div>
              <div class="col-span-1">
                <div class="mb-1 text-[11px] font-medium text-slate-400">
                  {{
                    $t(
                      'application.pageMenus.fields.routeUrl',
                      '系统内路由地址',
                    )
                  }}
                </div>
                <Input
                  v-model:value="currentMenu.url"
                  :placeholder="
                    $t(
                      'application.pageMenus.placeholders.routeUrl',
                      '例如 /visual/dashboard（选填）',
                    )
                  "
                  @change="setMenus([...menus])"
                />
              </div>
              <div class="col-span-1">
                <div class="mb-1 text-[11px] font-medium text-slate-400">
                  {{
                    $t('application.pageMenus.fields.pagePath', '远端嵌入路径')
                  }}
                </div>
                <Input
                  :value="getMenuPagePath(currentMenu)"
                  :placeholder="
                    $t(
                      'application.pageMenus.placeholders.pagePath',
                      '例如 /visual/dashboard',
                    )
                  "
                  @update:value="
                    (value) => updateMenuPagePath(currentMenu!.id, value)
                  "
                />
              </div>
              <div class="col-span-1" v-if="!hasRemoteValue">
                <div class="mb-1 text-[11px] font-medium text-slate-400">
                  {{ $t('application.pageMenus.fields.parentId', '上级菜单') }}
                </div>
                <Select
                  class="w-full"
                  :value="currentMenu.parentId || ''"
                  :options="resolveParentOptions(currentMenu.id)"
                  @update:value="
                    (value) =>
                      updateMenu(currentMenu!.id, {
                        parentId: value ? String(value) : undefined,
                      })
                  "
                />
              </div>
              <div class="col-span-1">
                <div class="mb-1 text-[11px] font-medium text-slate-400">
                  {{ $t('application.pageMenus.fields.icon', '图标') }}
                </div>
                <component
                  :is="GlobalIconPicker"
                  class="w-full"
                  :value="currentMenu.icon || ''"
                  :model-value="currentMenu.icon || ''"
                  @change="
                    (value: string) =>
                      updateMenu(currentMenu!.id, { icon: value })
                  "
                  @update:value="
                    (value: string) =>
                      updateMenu(currentMenu!.id, { icon: value })
                  "
                />
              </div>
              <div class="col-span-1">
                <div class="mb-1 text-[11px] font-medium text-slate-400">
                  {{ $t('application.pageMenus.fields.sortIndex', '排序值') }}
                </div>
                <InputNumber
                  class="w-full"
                  :min="0"
                  v-model:value="currentMenu.sortIndex"
                  @change="setMenus([...menus])"
                />
              </div>
              <div class="col-span-2">
                <div class="mb-1 text-[11px] font-medium text-slate-400">
                  {{ $t('application.pageMenus.fields.describe', '菜单说明') }}
                </div>
                <Input
                  v-model:value="currentMenu.describe"
                  :placeholder="
                    $t(
                      'application.pageMenus.placeholders.describe',
                      '可选，填写菜单说明',
                    )
                  "
                  @change="setMenus([...menus])"
                />
              </div>
            </div>
          </div>
          <div
            v-else
            class="flex h-full flex-col items-center justify-center text-slate-300 dark:text-gray-700"
          >
            <Empty
              :description="
                $t(
                  'application.pageMenus.selectHint',
                  '请在左侧树中选择一个菜单进行编辑',
                )
              "
            />
          </div>
        </div>
      </div>

      <div
        v-else
        class="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-12 dark:border-gray-700 dark:bg-gray-900/50"
      >
        <Empty
          :description="
            hasRemoteValue
              ? $t(
                  'application.pageMenus.emptyRemote',
                  '请在上方勾选需要同步的菜单',
                )
              : $t(
                  'application.pageMenus.empty',
                  '暂无页面菜单，请先新增顶级菜单',
                )
          "
        />
        <Button
          v-if="!hasRemoteValue"
          type="primary"
          ghost
          class="mt-4"
          @click="addRootMenu"
        >
          <template #icon><PlusIcon /></template>
          {{ $t('application.pageMenus.addRoot', '立即新增') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 深度强制树节点标题截断 */
:deep(.ant-tree-node-content-wrapper) {
  display: flex !important;
  min-width: 0 !important;
  overflow: hidden !important;
}

:deep(.ant-tree-title) {
  flex: 1 !important;
  min-width: 0 !important;
  overflow: hidden !important;
}

/* 兼容可能存在的内部 container */
:deep(.ant-tree-node-content-wrapper > span) {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
