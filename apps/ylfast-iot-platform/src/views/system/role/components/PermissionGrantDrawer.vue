<script setup lang="ts">
import type { SystemMenuApi } from '#/api/system/menu';

import { ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useVbenVxeGrid } from '@vben/plugins/vxe-table';

import { Checkbox, message, Tabs } from 'ant-design-vue';

import { getGrantInfoTreePost, saveGrantInfo } from '#/api/system/menu';

import { permissionColumns } from '../data';

const activeTab = ref('permission');
const roleId = ref<string>('');

watch(activeTab, (val) => {
  if (val === 'permission' && roleId.value) {
    loadGrantInfoTree(roleId.value);
  }
});

// 表格配置
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: permissionColumns,
    treeConfig: {
      transform: false,
      rowField: 'id',
      parentField: 'parentId',
      childrenField: 'children',
      expandAll: true,
    },
    border: true,
    showOverflow: true,
    pagerConfig: {
      enabled: false,
    },
  },
});

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  onConfirm: async () => {
    await handleSave();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<{ roleId: string }>();
      roleId.value = data.roleId;
      if (data.roleId && activeTab.value === 'permission') {
        loadGrantInfoTree(data.roleId);
      }
    }
  },
});

async function loadGrantInfoTree(id: string) {
  try {
    drawerApi.setState({ confirmLoading: true });
    gridApi.setGridOptions({ loading: true });
    const data = await getGrantInfoTreePost('role', id, {
      terms: [
        {
          value: '%show":false%',
          termType: 'nlike',
          column: 'options',
        },
      ],
    });
    gridApi.setGridOptions({ data: data || [] });
  } catch (error) {
    console.error(error);
  } finally {
    drawerApi.setState({ confirmLoading: false });
    gridApi.setGridOptions({ loading: false });
  }
}

async function handleSave() {
  try {
    drawerApi.setState({ confirmLoading: true });

    // 收集选中的菜单和权限
    const selectedMenus: SystemMenuApi.MenuView[] = [];

    const fullData = gridApi.grid.getFullData(); // 获取表格所有数据

    // 递归收集已授权的菜单和权限
    const collectSelected = (nodes: SystemMenuApi.MenuView[]) => {
      nodes.forEach((node) => {
        // 如果菜单本身被授权或者有任何按钮被授权
        const hasGrantedButtons = node.buttons?.some((b) => b.granted);

        if (node.granted || hasGrantedButtons) {
          selectedMenus.push(node);
        }

        if (node.children) {
          collectSelected(node.children);
        }
      });
    };

    if (fullData) {
      collectSelected(fullData as SystemMenuApi.MenuView[]);
    }

    await saveGrantInfo({
      targetType: 'role',
      targetId: roleId.value,
      menus: selectedMenus,
    } as SystemMenuApi.MenuGrantRequest);

    message.success($t('common.saveSuccess'));
    drawerApi.close();
  } catch (error) {
    console.error(error);
  } finally {
    drawerApi.setState({ confirmLoading: false });
  }
}

// 查找父节点辅助函数 (适用于中小规模树形结构)
function findParent(
  nodes: SystemMenuApi.MenuView[],
  targetId: string,
  parent: null | SystemMenuApi.MenuView = null,
): null | SystemMenuApi.MenuView {
  for (const node of nodes) {
    if (node.id === targetId) {
      return parent;
    }
    if (node.children) {
      const found = findParent(node.children, targetId, node);
      if (found) return found;
    }
  }
  return null;
}

// 递归更新父节点状态
function updateParentStatus(row: SystemMenuApi.MenuView) {
  const fullData = gridApi.grid.getFullData() as SystemMenuApi.MenuView[];
  const parent = findParent(fullData, row.id!);

  if (parent) {
    const children = parent.children || [];

    // 检查所有子节点是否完全授权
    const allChildrenGranted = children.every((child) => isFullyGranted(child));
    // 检查是否有任何子节点被授权（包括半选）
    const anyChildGranted = children.some(
      (child) => child.granted || getIndeterminate(child),
    );

    if (allChildrenGranted) {
      parent.granted = true;
    } else if (anyChildGranted) {
      // 如果有子节点被选中，父节点也被视为“授予”状态（用于保持树路径）
      // 具体的半选样式由 Checkbox 的 indeterminate 属性控制
      parent.granted = true;
    } else {
      // 检查父节点自身的按钮是否有被选中的
      const parentButtonsGranted = parent.buttons?.some((b) => b.granted);
      if (!parentButtonsGranted) {
        parent.granted = false;
      }
    }

    // 向上递归更新
    updateParentStatus(parent);
  }
}

// 检查节点是否完全授权（自身、所有按钮、所有子节点）
function isFullyGranted(node: SystemMenuApi.MenuView): boolean {
  if (!node.granted) return false;

  const buttonsGranted = !node.buttons || node.buttons.every((b) => b.granted);
  const childrenGranted =
    !node.children || node.children.every((child) => isFullyGranted(child));

  return buttonsGranted && childrenGranted;
}

// 辅助函数：检查内容（按钮+子节点）是否完全授权，忽略节点自身的 granted 状态
function checkContentFullyGranted(node: SystemMenuApi.MenuView): boolean {
  const buttonsOk = !node.buttons || node.buttons.every((b) => b.granted);
  const childrenOk =
    !node.children || node.children.every((c) => isFullyGranted(c));
  return buttonsOk && childrenOk;
}

// 获取半选状态
function getIndeterminate(row: SystemMenuApi.MenuView): boolean {
  // 如果主复选框未选中，通常没有半选状态
  if (!row.granted) return false;

  // 如果已选中，检查是否为“完全”选中
  // 如果不是完全选中，则是半选状态
  // 注意：这里使用 checkContentFullyGranted 因为 row.granted 在此处已经是 true
  return !checkContentFullyGranted(row);
}

// 递归更新子节点授权状态
function updateChildrenGrant(node: SystemMenuApi.MenuView, granted: boolean) {
  // 更新按钮
  if (node.buttons) {
    node.buttons.forEach((btn) => {
      btn.granted = granted;
    });
  }

  // 递归更新子节点
  if (node.children) {
    node.children.forEach((child) => {
      child.granted = granted;
      updateChildrenGrant(child, granted);
    });
  }
}

// 处理菜单复选框变更
function handleMenuChange(row: SystemMenuApi.MenuView, isChecked: boolean) {
  // 更新当前节点
  row.granted = isChecked;

  // 更新子节点
  updateChildrenGrant(row, isChecked);

  // 更新父节点
  updateParentStatus(row);
}

// 处理按钮复选框变更
function handleButtonChange(row: SystemMenuApi.MenuView) {
  // 如果有任何按钮被选中，菜单必须被选中（授予权限）
  // 如果没有按钮被选中，取消菜单选中

  const hasChecked = row.buttons?.some((b) => b.granted);

  // 如果该行有按钮，强制要求至少选中一个才能授予菜单权限
  if (row.buttons && row.buttons.length > 0) {
    row.granted = !!hasChecked;
  }

  updateParentStatus(row);
}
</script>

<template>
  <Drawer
    :title="$t('role.configPermission', 'Permission Configuration')"
    class="w-2/3"
  >
    <div class="flex h-full flex-col">
      <Tabs v-model:active-key="activeTab" class="flex-1">
        <Tabs.TabPane
          key="permission"
          :tab="$t('role.tab.permissionAllocation', 'Permission Allocation')"
        >
          <div class="h-full overflow-hidden p-4">
            <Grid>
              <!-- 菜单名称列 (菜单授权复选框) -->
              <template #name="{ row }">
                <div class="text-left">
                  <Checkbox
                    :checked="row.granted && !getIndeterminate(row)"
                    :indeterminate="getIndeterminate(row)"
                    @update:checked="(val) => handleMenuChange(row, val)"
                  >
                    {{ row.name }}
                  </Checkbox>
                </div>
              </template>

              <!-- 操作权限列 -->
              <template #actions="{ row }">
                <div
                  v-if="row.buttons && row.buttons.length > 0"
                  class="flex flex-wrap gap-2"
                >
                  <div
                    v-for="btn in row.buttons"
                    :key="btn.id"
                    class="flex items-center gap-1"
                  >
                    <Checkbox
                      v-model:checked="btn.granted"
                      @change="handleButtonChange(row)"
                    >
                      {{ btn.name }}
                    </Checkbox>
                  </div>
                </div>
              </template>
            </Grid>
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane
          key="user"
          :tab="$t('role.tab.userManagement', 'User Management')"
        >
          <div class="p-4 text-center text-gray-500">
            {{ $t('common.comingSoon', 'Coming Soon') }}
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  </Drawer>
</template>
