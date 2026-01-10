<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { IotProductTypeApi } from '#/api/iot/device/product-type';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Button, message, Popconfirm } from 'ant-design-vue';

import {
  getAllProductTypeTreeByQuery,
  IotProductTypeApi as ProductTypeApi,
} from '#/api/iot/device/product-type';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';
import ProductTypeModal from '#/views/iot/device/product-type/components/ProductTypeModal.vue';

import { getColumns, getSearchFormSchemas } from './data';

const formType = ref<'add' | 'edit'>('add');

// Modal
const [Modal, modalApi] = useVbenModal({
  connectedComponent: ProductTypeModal,
});

// Grid Query Adapter
const gridQuery = async (_params: any, ...args: any[]) => {
  const formValues = args[0] || {
    terms: [],
  };

  const data = await getAllProductTypeTreeByQuery({
    pageIndex: 0,
    pageSize: 9999,
    paging: false,
    sorts: [
      {
        name: 'sortIndex',
        order: 'asc',
      },
    ],
    terms: [...(formValues.terms || [])],
  });
  return data;
};

const [TableCard, gridApi] = useYlVxeTableCard<IotProductTypeApi.ProductType>({
  cardOptions: {
    minWidth: 300,
  },
  mode: 'table',

  gridOptions: {
    columns: getColumns(),
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
      expandAll: false,
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
    virtualYConfig: {
      enabled: true,
    },
  },
  searchFormMode: 'yl-dc-form',
  showSearchForm: true,
  tableTitle: $t('device.productType.title'),

  ylDcFromOptions: {
    formSchemas: getSearchFormSchemas(),
    storeOption: {
      mode: 'localstorage',
      conf: {
        storageKey: 'product-type-dc-storage',
      },
    },
  },
});

// Actions
function handleAdd() {
  formType.value = 'add';
  modalApi.setData({
    type: 'add',
    values: {},
  });
  modalApi.open();
}

function handleAddSub(row: Recordable<any>) {
  formType.value = 'add';
  modalApi.setData({
    type: 'add',
    values: { parentId: row.id },
  });
  modalApi.open();
}

function handleEdit(row: Recordable<any>) {
  formType.value = 'edit';
  modalApi.setData({
    type: 'edit',
    values: { ...row },
  });
  modalApi.open();
}

async function handleDelete(row: Recordable<any>) {
  try {
    await ProductTypeApi.basicCrudApis.deleteById(row.id);
    message.success($t('common.deleteSuccess'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

function handleModalSuccess() {
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <template #toolbar-tools>
        <Button type="primary" @click="handleAdd">
          {{ $t('common.action.add') }}
        </Button>
      </template>

      <!-- Grid Actions -->
      <template #action="{ row }">
        <Button size="small" type="link" @click="handleAddSub(row)">
          {{ $t('common.action.addSub') }}
        </Button>
        <Button size="small" type="link" @click="handleEdit(row)">
          {{ $t('common.action.edit') }}
        </Button>
        <Popconfirm
          :title="$t('common.confirmDelete')"
          @confirm="handleDelete(row)"
        >
          <Button danger size="small" type="link">
            {{ $t('common.action.delete') }}
          </Button>
        </Popconfirm>
      </template>
    </TableCard>

    <Modal @success="handleModalSuccess" />
  </Page>
</template>
