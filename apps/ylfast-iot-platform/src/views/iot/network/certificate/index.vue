<script setup lang="ts">
import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, message, Modal, Popconfirm } from 'ant-design-vue';

import {
  getCertificateDetailText,
  IotCertificateApi,
} from '#/api/iot/certificate';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import CertificateCard from './components/CertificateCard.vue';
import { getColumns, getSearchFormSchemas } from './data';
import EditDrawer from './EditDrawer.vue';

const PlusIcon = createIconifyIcon('lucide:plus');

const editDrawerRef = ref<any>(null);

const gridQuery = async (params: any, ...args: any[]) => {
  const { page } = params;
  const formValues = args[0] || {};
  const { terms } = formValues;

  const { data, total } = await IotCertificateApi.basicCrudApis.postQuery({
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    sorts: [{ name: 'createTime', order: 'desc' }],
    terms: terms || [],
  });

  return {
    items: data,
    total,
  };
};

const [TableCard, gridApi] = useYlVxeTableCard({
  defaultMode: 'card',
  gridOptions: {
    height: 'auto',
    columns: getColumns(),
    proxyConfig: {
      ajax: {
        query: gridQuery,
      },
    },
    toolbarConfig: {
      refresh: true,
      zoom: true,
      custom: true,
    },
  },
  searchFormMode: 'yl-dc-form',
  showSearchForm: true,
  ylDcFromOptions: {
    formSchemas: getSearchFormSchemas(),
    storeOption: {
      conf: {
        storageKey: 'iot-certificate-dc-storage',
      },
      mode: 'localstorage',
    },
  },
});

function handleAdd() {
  editDrawerRef.value?.setData({
    mode: 'server',
    format: 'PEM',
    type: 'common',
    authenticationMethod: 'single',
    configuration: {},
  });
}

function handleEdit(row: any) {
  editDrawerRef.value?.setData(row);
}

async function handleView(row: any) {
  try {
    const text = await getCertificateDetailText(row.id);
    Modal.info({
      title: $t('certificate.edit.title'),
      width: 600,
      content: text,
      maskClosable: true,
    });
  } catch (error) {
    console.error(error);
  }
}

async function handleDelete(row: any) {
  await IotCertificateApi.basicCrudApis.deleteById(row.id);
  message.success($t('common.deleteSuccess'));
  gridApi.reload();
}

function handleSuccess() {
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <template #toolbar-tools>
        <Button type="primary" @click="handleAdd">
          <template #icon><PlusIcon class="mr-1 size-4" /></template>
          {{ $t('common.action.add') }}
        </Button>
      </template>

      <template #action="{ row }">
        <div class="flex-center flex gap-1">
          <Button type="link" size="small" @click.stop="handleView(row)">
            {{ $t('common.action.view') }}
          </Button>
          <Button type="link" size="small" @click.stop="handleEdit(row)">
            {{ $t('common.action.edit') }}
          </Button>
          <Popconfirm
            :title="$t('common.confirmDelete')"
            @confirm="handleDelete(row)"
          >
            <Button type="link" danger size="small" @click.stop>
              {{ $t('common.action.delete') }}
            </Button>
          </Popconfirm>
        </div>
      </template>

      <!-- Card Template -->
      <template #card="{ row }">
        <CertificateCard
          :row="row"
          @delete="handleDelete"
          @edit="handleEdit"
          @view="handleView"
        />
      </template>
    </TableCard>

    <EditDrawer ref="editDrawerRef" @success="handleSuccess" />
  </Page>
</template>
