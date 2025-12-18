<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { SystemMenuApi } from '#/api/system/menu';

import { ref } from 'vue';

import { Page, useVbenDrawer, useVbenForm } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Button, message, Popconfirm, Tabs, Tag } from 'ant-design-vue';

import {
  createMenu,
  deleteMenu,
  getAllMenuTree,
  saveMenu,
} from '#/api/system/menu';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import ButtonManagement from './components/ButtonManagement.vue';
import PermissionConfig from './components/PermissionConfig.vue';
import { columns, modalFormSchemas, searchFormSchemas } from './data';

const formType = ref<'add' | 'edit'>('add');
const activeTab = ref('basic');

// Data for tabs
const permissions = ref<any[]>([]);
const buttons = ref<SystemMenuApi.ButtonInfo[]>([]);

// Form
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: modalFormSchemas,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

// Drawer
const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  onConfirm: async () => {
    try {
      const { valid } = await formApi.validate();
      if (!valid) {
        return;
      }
      const values = await formApi.getValues();
      drawerApi.setState({ confirmLoading: true });

      const menuData: SystemMenuApi.Menu = {
        ...values,
        permissions: permissions.value,
        buttons: buttons.value,
      } as SystemMenuApi.Menu;

      if (formType.value === 'add') {
        if (!menuData.id) delete (menuData as any).id;
        await createMenu(menuData);
        message.success($t('menu.success.create'));
      } else {
        await saveMenu(menuData);
        message.success($t('menu.success.update'));
      }

      drawerApi.close();
      gridApi.reload();
    } catch (error) {
      console.error(error);
    } finally {
      drawerApi.setState({ confirmLoading: false });
    }
  },
  class: 'w-5/6',
});

// Grid Query Adapter
const gridQuery = async (_params: any, ...args: any[]) => {
  const formValues = args[0] || {
    terms: [],
  };

  const defaultTerms = [
    {
      value: '%show":false%',
      termType: 'nlike',
      column: 'options',
    },
    {
      terms: [
        {
          terms: [
            {
              column: 'owner',
              termType: 'eq',
              value: 'iot',
            },
            {
              column: 'owner',
              termType: 'isnull',
              value: '1',
              type: 'or',
            },
          ],
        },
        {
          type: 'or',
          terms: [
            {
              value: '%show":false%',
              termType: 'nlike',
              column: 'options',
            },
          ],
        },
      ],
    },
  ];
  const data = await getAllMenuTree({
    pageIndex: 0,
    pageSize: 9999,
    paging: false,
    sorts: [
      {
        name: 'sortIndex',
        order: 'asc',
      },
    ],
    terms: [...formValues.terms, ...defaultTerms],
  });
  return data;
};

const [TableCard, gridApi] = useYlVxeTableCard<SystemMenuApi.Menu>({
  cardOptions: {
    minWidth: 300,
  },
  mode: 'table',

  gridOptions: {
    columns: columns!,
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    rowConfig: {
      keyField: 'id',
    },
    treeConfig: {
      transform: false,
      rowField: 'id',
      parentField: 'parentId',
      childrenField: 'children',
      expandAll: true,
    },
    proxyConfig: {
      response: {
        result: '',
        list: '',
      },
      ajax: {
        query: gridQuery,
      },
      enabled: true,
    },
    toolbarConfig: {
      custom: true,
      export: true,
      refresh: true,
      search: true,
      zoom: true,
    },
  },
  searchFormMode: 'yl-dc-form',
  showSearchForm: true,
  tableTitle: $t('menu.name'),

  ylDcFromOptions: {
    formSchemas: searchFormSchemas,
    storeOption: {
      mode: 'localstorage',
      conf: {
        storageKey: 'menu-dc-storage',
      },
    },
  },
});

// Actions
function handleAdd() {
  formType.value = 'add';
  activeTab.value = 'basic';
  permissions.value = [];
  buttons.value = [];
  drawerApi.setState({ title: $t('menu.add') });
  formApi.resetForm();
  drawerApi.open();
}

function handleAddSub(row: Recordable<any>) {
  formType.value = 'add';
  activeTab.value = 'basic';
  permissions.value = [];
  buttons.value = [];
  drawerApi.setState({ title: $t('menu.add') });
  formApi.resetForm();
  formApi.setValues({ parentId: row.id });
  drawerApi.open();
}

function handleEdit(row: Recordable<any>) {
  formType.value = 'edit';
  activeTab.value = 'basic';
  permissions.value = row.permissions || [];
  buttons.value = row.buttons || [];
  drawerApi.setState({ title: $t('menu.edit') });
  formApi.resetForm();
  formApi.setValues(row);
  drawerApi.open();
}

async function handleDelete(row: Recordable<any>) {
  try {
    await deleteMenu(row.id);
    message.success($t('menu.success.delete'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <template #toolbar-tools>
        <Button type="primary"  @click="handleAdd">
          {{ $t('menu.add') }}
        </Button>
      </template>

      <!-- Grid Actions -->
      <template #action="{ row }">
        <Button size="small" type="link" @click="handleAddSub(row)">
          {{ $t('menu.addSub') }}
        </Button>
        <Button size="small" type="link" @click="handleEdit(row)">
          {{ $t('common.action.edit') }}
        </Button>
        <Popconfirm
          :title="$t('menu.confirmDelete')"
          @confirm="handleDelete(row)"
        >
          <Button danger size="small" type="link">
            {{ $t('common.action.delete') }}
          </Button>
        </Popconfirm>
      </template>

      <!-- Status Column -->
      <template #status="{ row }">
        <Tag :color="row.status === 1 ? 'success' : 'error'">
          {{ row.status === 1 ? $t('menu.enable') : $t('menu.disable') }}
        </Tag>
      </template>
    </TableCard>

    <Drawer>
      <div class="flex h-full flex-col">
        <Tabs v-model:active-key="activeTab" class="flex-1">
          <Tabs.TabPane key="basic" :tab="$t('menu.tab.basicInfo')">
            <div class="p-4">
              <Form />
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane key="permissions" :tab="$t('menu.tab.permissions')">
            <div class="h-full p-4">
              <PermissionConfig v-model:value="permissions" />
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane key="buttons" :tab="$t('menu.tab.buttons')">
            <div class="h-full p-4">
              <ButtonManagement v-model:value="buttons" />
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>
    </Drawer>
  </Page>
</template>
