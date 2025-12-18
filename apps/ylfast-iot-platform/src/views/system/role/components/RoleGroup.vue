<script setup lang="ts">
import type { Key } from 'ant-design-vue/es/table/interface';

import type { SystemRoleGroupApi } from '#/api/system/role-group';

import { onMounted, reactive, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button,
  Card,
  Dropdown,
  Input,
  InputSearch,
  Menu,
  message,
  Modal,
  Tree,
} from 'ant-design-vue';

import {
  deleteRoleGroup,
  queryRoleGroupNoPaging,
  saveRoleGroup,
} from '#/api/system/role-group';
import { listToTree } from '#/utils/tree';

const emit = defineEmits(['select']);

interface TreeItem extends SystemRoleGroupApi.RoleGroupEntity {
  isRoot?: boolean;
  isNew?: boolean;
  children?: TreeItem[];
}

const treeData = ref<TreeItem[]>([]);
const rawTreeData = ref<TreeItem[]>([]);
const searchValue = ref('');
const selectedKeys = ref<Key[]>(['root']);
const expandedKeys = ref<Key[]>(['root']);
const editableData = reactive<Record<string, string>>({}); // id -> name

const PlusIcon = createIconifyIcon('lucide:plus');
const EditIcon = createIconifyIcon('lucide:edit');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const SaveIcon = createIconifyIcon('lucide:check');
const CancelIcon = createIconifyIcon('lucide:x');
const MoreHorizontalIcon = createIconifyIcon('lucide:more-horizontal');

watch(searchValue, (value) => {
  if (!value) {
    treeData.value = rawTreeData.value;
    // Restore default expansion (root only or previous state? Root is safe)
    expandedKeys.value = [
      'root',
      ...(rawTreeData.value[0]?.children?.map((c) => c.id) || []),
    ];
    return;
  }
  const { filtered, expanded } = filterTree(rawTreeData.value, value);
  treeData.value = filtered;
  expandedKeys.value = ['root', ...expanded];
});

function filterTree(
  nodes: TreeItem[],
  keyword: string,
): { expanded: Key[]; filtered: TreeItem[] } {
  const expanded: Key[] = [];

  const innerFilter = (items: TreeItem[]): TreeItem[] => {
    // eslint-disable-next-line unicorn/no-array-reduce
    return items.reduce((acc, item) => {
      const children = item.children ? innerFilter(item.children) : [];
      const matches = item.name.toLowerCase().includes(keyword.toLowerCase());

      // Keep if matches or has matching children
      // Note: root should always be kept if we want to show anything inside it,
      // but if root itself doesn't match and no children match, it might disappear?
      // Since our root is virtual "All Roles", usually we want to keep it if any child matches.
      // But if user searches "All Roles", root matches.

      if (matches || children.length > 0) {
        if (children.length > 0) {
          expanded.push(item.id);
        }
        acc.push({
          ...item,
          children: children.length > 0 ? children : undefined,
        });
      }
      return acc;
    }, [] as TreeItem[]);
  };

  const filtered = innerFilter(nodes);
  return { filtered, expanded };
}

async function fetchGroupTree() {
  try {
    const data = await queryRoleGroupNoPaging({
      paging: false,
      sorts: [
        {
          name: 'createTime',
          order: 'desc',
        },
      ],
    });
    // Transform flat list to tree
    const children = listToTree<TreeItem>(data, {
      id: 'id',
      pid: 'parentId',
    });

    const fullTree = [
      {
        id: 'root',
        name: $t('role.group.rootName', '全部角色'),
        parentId: '',
        path: '',
        description: '',
        creatorId: '',
        createTime: 0,
        isRoot: true,
        children,
      },
    ];

    rawTreeData.value = fullTree;
    // Initialize with full tree if no search
    if (searchValue.value) {
      // Re-apply filter if refreshing while searching (though usually fetch resets search? let's keep search)
      const { filtered, expanded } = filterTree(fullTree, searchValue.value);
      treeData.value = filtered;
      expandedKeys.value = ['root', ...expanded];
    } else {
      treeData.value = fullTree;
      // Ensure root and its direct children are expanded
      expandedKeys.value = ['root', ...children.map((item) => item.id)];
    }
  } catch (error) {
    console.error(error);
  }
}

function handleSelect(keys: Key[], info: any) {
  // Check if it's a deselection event
  if (!info.selected) {
    // Force re-select the node that was clicked
    selectedKeys.value = [info.node.key];

    // Emit selection event just in case logic depends on it
    const key = info.node.key;
    if (key === 'root') {
      emit('select', null);
    } else {
      emit('select', key || null);
    }
    return;
  }

  // Normal selection logic
  selectedKeys.value = keys;
  const key = keys[0];
  if (key === 'root') {
    emit('select', null);
  } else {
    emit('select', key || null);
  }
}

function handleAddRoot() {
  // Add to Root (id='root')
  const rootNode = treeData.value.find((n) => n.id === 'root');
  if (rootNode) {
    handleAddSub(rootNode);
  }
}

function handleAddSub(node: TreeItem) {
  if (!node.children) {
    node.children = [];
  }
  const newId = `new_${Date.now()}`;
  const newNode: TreeItem = {
    id: newId,
    name: '',
    parentId: node.id === 'root' ? '' : node.id,
    path: '',
    description: '',
    creatorId: '',
    createTime: 0,
    isNew: true,
  };
  node.children.push(newNode);
  expandedKeys.value = [...expandedKeys.value, node.id];
  editableData[newId] = '';
}

function handleEdit(node: TreeItem) {
  editableData[node.id] = node.name;
}

function handleCancel(node: TreeItem) {
  delete editableData[node.id];
  if (node.isNew) {
    // Remove from parent
    removeNodeFromTree(treeData.value, node.id);
  }
}

async function handleSave(node: TreeItem) {
  const name = editableData[node.id];
  if (!name?.trim()) {
    message.warning(`${$t('common.name')} cannot be empty`); // Simplified validation
    return;
  }

  try {
    const payload = {
      name,
      parentId: node.parentId,
      id: node.isNew ? undefined : node.id,
      // Default values for required fields if new
      sortIndex: 0,
      description: '',
    } as SystemRoleGroupApi.RoleGroupEntity; // Cast to bypass strict type check for partial updates

    await saveRoleGroup(payload);
    message.success($t('common.saveSuccess'));
    delete editableData[node.id];
    fetchGroupTree();
  } catch (error) {
    console.error(error);
  }
}

function removeNodeFromTree(nodes: TreeItem[], id: string): boolean {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.id === id) {
      nodes.splice(i, 1);
      return true;
    }
    if (node.children && removeNodeFromTree(node.children, id)) {
      return true;
    }
  }
  return false;
}

function handleDelete(node: TreeItem) {
  Modal.confirm({
    title: $t('common.confirmDelete'),
    content: $t('common.confirmDeleteMsg'),
    onOk: async () => {
      try {
        await deleteRoleGroup(node.id);
        message.success($t('common.deleteSuccess'));
        fetchGroupTree();
        // If deleted node was selected, select root
        if (selectedKeys.value.includes(node.id)) {
          selectedKeys.value = ['root'];
          emit('select', null);
        }
      } catch (error) {
        console.error(error);
      }
    },
  });
}

onMounted(() => {
  fetchGroupTree();
});
</script>

<template>
  <div class="h-full w-1/6 min-w-[180px] pr-2">
    <Card
      class="flex h-full flex-col"
      :body-style="{ padding: '10px', flex: 1, overflow: 'auto' }"
    >
      <template #title>
        <div class="flex items-center justify-between">
          <span>{{ $t('role.group.title', 'Role Group') }}</span>
          <!-- Top button now adds to Root -->
          <Button
            type="primary"
            size="small"
            class="flex items-center justify-center"
            @click="handleAddRoot"
          >
            <template #icon>
              <PlusIcon />
            </template>
          </Button>
        </div>
      </template>

      <div class="mb-2">
        <InputSearch
          v-model:value="searchValue"
          :placeholder="$t('common.search')"
          allow-clear
          size="small"
        />
      </div>

      <Tree
        v-if="treeData.length > 0"
        v-model:expanded-keys="expandedKeys"
        v-model:selected-keys="selectedKeys"
        :tree-data="treeData"
        :field-names="{ children: 'children', title: 'name', key: 'id' }"
        block-node
        show-line
        :multiple="false"
        @select="handleSelect"
      >
        <template #title="{ dataRef }">
          <div class="group flex h-7 items-center justify-between">
            <!-- Edit Mode -->
            <template v-if="editableData[dataRef.id] !== undefined">
              <div class="flex w-full items-center" @click.stop>
                <Input
                  v-model:value="editableData[dataRef.id]"
                  size="small"
                  class="mr-1 flex-1"
                  @press-enter="handleSave(dataRef)"
                />
                <Button
                  type="text"
                  size="small"
                  class="flex size-6 items-center justify-center p-0 text-green-600 hover:text-green-700"
                  @click.stop="handleSave(dataRef)"
                >
                  <template #icon><SaveIcon /></template>
                </Button>
                <Button
                  type="text"
                  size="small"
                  class="flex size-6 items-center justify-center p-0 text-red-500 hover:text-red-600"
                  @click.stop="handleCancel(dataRef)"
                >
                  <template #icon><CancelIcon /></template>
                </Button>
              </div>
            </template>

            <!-- View Mode -->
            <template v-else>
              <span class="truncate pr-2">{{ dataRef.name }}</span>
              <!-- Actions (Always visible) -->
              <div class="flex items-center" @click.stop>
                <Dropdown>
                  <a
                    class="ant-dropdown-link flex items-center p-1 text-gray-500 hover:text-primary"
                    @click.prevent
                  >
                    <MoreHorizontalIcon class="size-4" />
                  </a>
                  <template #overlay>
                    <Menu>
                      <Menu.Item @click="handleAddSub(dataRef)">
                        <template #icon>
                          <PlusIcon />
                        </template>
                        {{ $t('common.action.add') }}
                      </Menu.Item>
                      <!-- Only allow Edit/Delete for non-root nodes -->
                      <Menu.Item
                        v-if="!dataRef.isRoot"
                        @click="handleEdit(dataRef)"
                      >
                        <template #icon>
                          <EditIcon />
                        </template>
                        {{ $t('common.action.edit') }}
                      </Menu.Item>
                      <Menu.Item
                        v-if="!dataRef.isRoot"
                        danger
                        @click="handleDelete(dataRef)"
                      >
                        <template #icon>
                          <TrashIcon />
                        </template>
                        {{ $t('common.action.delete') }}
                      </Menu.Item>
                    </Menu>
                  </template>
                </Dropdown>
              </div>
            </template>
          </div>
        </template>
      </Tree>
      <div v-else class="mt-4 text-center text-gray-500">
        {{ $t('common.noData') }}
      </div>
    </Card>
  </div>
</template>
