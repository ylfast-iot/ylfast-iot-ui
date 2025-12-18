<script setup lang="ts">
import type { Key } from 'ant-design-vue/es/table/interface';

import type { SystemOrganizationApi } from '#/api/system/organization';

import { onMounted, reactive, ref } from 'vue';

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
  deleteOrganization,
  getOrganizationTree,
  saveOrganization,
  updateOrganization,
} from '#/api/system/organization';

const emit = defineEmits(['select']);

interface TreeItem extends SystemOrganizationApi.OrganizationEntity {
  isNew?: boolean;
}

const treeData = ref<TreeItem[]>([]);
const rawTreeData = ref<TreeItem[]>([]); // Store original data
const selectedKeys = ref<Key[]>([]);
const expandedKeys = ref<Key[]>([]);
const editableData = reactive<Record<string, string>>({}); // id -> name
const searchValue = ref('');

const PlusIcon = createIconifyIcon('lucide:plus');
const EditIcon = createIconifyIcon('lucide:edit');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const SaveIcon = createIconifyIcon('lucide:check');
const CancelIcon = createIconifyIcon('lucide:x');
const MoreHorizontalIcon = createIconifyIcon('lucide:more-horizontal');

async function fetchOrgTree() {
  try {
    const data = await getOrganizationTree();
    rawTreeData.value = data;
    treeData.value = data;

    // Expand all by default or just first level?
    // Let's expand first level
    expandedKeys.value = data.map((item) => item.id);

    // Default select first node
    if (data.length > 0) {
      const firstNodeId = data[0].id;
      selectedKeys.value = [firstNodeId];
      emit('select', firstNodeId);
    }

    // Trigger search if value exists (e.g. after reload)
    if (searchValue.value) {
      handleSearch();
    }
  } catch (error) {
    console.error(error);
  }
}

function filterTree(tree: TreeItem[], keyword: string): TreeItem[] {
  if (!keyword) return tree;

  // eslint-disable-next-line unicorn/no-array-reduce
  return tree.reduce<TreeItem[]>((acc, node) => {
    // Clone node to avoid mutating original structure during recursive filtering
    const newNode = { ...node };

    let hasMatchingChildren = false;
    if (newNode.children) {
      newNode.children = filterTree(newNode.children, keyword);
      hasMatchingChildren = newNode.children.length > 0;
    }

    const matches = newNode.name.toLowerCase().includes(keyword.toLowerCase());

    if (matches || hasMatchingChildren) {
      acc.push(newNode);
    }
    return acc;
  }, []);
}

function getAllKeys(tree: TreeItem[]): Key[] {
  const keys: Key[] = [];
  for (const node of tree) {
    keys.push(node.id);
    if (node.children) {
      keys.push(...getAllKeys(node.children));
    }
  }
  return keys;
}

function handleSearch() {
  if (!searchValue.value) {
    treeData.value = rawTreeData.value;
    return;
  }
  const filtered = filterTree(rawTreeData.value, searchValue.value);
  treeData.value = filtered;
  expandedKeys.value = getAllKeys(filtered);
}

function handleSelect(keys: Key[], info: any) {
  if (!info.selected) {
    selectedKeys.value = [info.node.key];
    emit('select', info.node.key || null);
    return;
  }
  selectedKeys.value = keys;
  emit('select', keys[0] || null);
}

function handleAddTop() {
  const newId = `new_${Date.now()}`;
  const newNode: TreeItem = {
    id: newId,
    name: '',
    parentId: '', // Top level
    sortIndex: 0,
    isNew: true,
  };
  treeData.value.push(newNode);
  editableData[newId] = '';
}

function handleAddSub(node: TreeItem) {
  if (!node.children) {
    node.children = [];
  }
  const newId = `new_${Date.now()}`;
  const newNode: TreeItem = {
    id: newId,
    name: '',
    parentId: node.id,
    sortIndex: 0,
    isNew: true,
  };
  node.children.push(newNode);
  if (!expandedKeys.value.includes(node.id)) {
    expandedKeys.value = [...expandedKeys.value, node.id];
  }
  editableData[newId] = '';
}

function handleEdit(node: TreeItem) {
  editableData[node.id] = node.name;
}

function handleCancel(node: TreeItem) {
  delete editableData[node.id];
  if (node.isNew) {
    removeNodeFromTree(treeData.value, node.id);
  }
}

async function handleSave(node: TreeItem) {
  const name = editableData[node.id];
  if (!name?.trim()) {
    message.warning($t('organization.nameRequired'));
    return;
  }

  try {
    const payload = {
      name,
      parentId: node.parentId,
      sortIndex: node.sortIndex || 0,
    } as SystemOrganizationApi.OrganizationEntity;

    await (node.isNew
      ? saveOrganization(payload)
      : updateOrganization(node.id, payload));

    message.success($t('common.saveSuccess'));
    delete editableData[node.id];
    fetchOrgTree();
  } catch (error) {
    console.error(error);
  }
}

function removeNodeFromTree(nodes: TreeItem[], id: string): boolean {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node?.id === id) {
      nodes.splice(i, 1);
      return true;
    }
    if (node?.children && removeNodeFromTree(node.children, id)) {
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
        await deleteOrganization(node.id);
        message.success($t('common.deleteSuccess'));
        fetchOrgTree();
        if (selectedKeys.value.includes(node.id)) {
          selectedKeys.value = [];
          emit('select', null);
        }
      } catch (error) {
        console.error(error);
      }
    },
  });
}

onMounted(() => {
  fetchOrgTree();
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
          <span>{{ $t('organization.title') }}</span>
          <Button
            type="primary"
            size="small"
            class="flex items-center justify-center"
            @click="handleAddTop"
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
          :placeholder="$t('common.action.search')"
          allow-clear
          size="small"
          @change="handleSearch"
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
                        {{ $t('organization.addSub') }}
                      </Menu.Item>
                      <Menu.Item @click="handleEdit(dataRef)">
                        <template #icon>
                          <EditIcon />
                        </template>
                        {{ $t('organization.edit') }}
                      </Menu.Item>
                      <Menu.Item danger @click="handleDelete(dataRef)">
                        <template #icon>
                          <TrashIcon />
                        </template>
                        {{ $t('organization.delete') }}
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
