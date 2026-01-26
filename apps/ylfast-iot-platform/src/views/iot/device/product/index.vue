<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { QueryParamEntity } from '#/adapter';
import type { IotDeviceProductApi } from '#/api/iot/device/product';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenForm, useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, message, Popconfirm, Tooltip } from 'ant-design-vue';

import {
  IotDeviceProductApi as ProductApi,
  registerProduct,
  unregisterProduct,
} from '#/api/iot/device/product';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import ProductCard from './components/ProductCard.vue';
import { getColumns, getModalFormSchemas, getSearchFormSchemas } from './data';

const EditIcon = createIconifyIcon('lucide:edit-3');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const PlusIcon = createIconifyIcon('lucide:plus');
const CheckIcon = createIconifyIcon('lucide:check-circle');
const BanIcon = createIconifyIcon('lucide:ban');
const EyeIcon = createIconifyIcon('lucide:eye');

const router = useRouter();
const formType = ref<'add' | 'edit'>('add');
const currentId = ref<string>('');

// --- Modal Form ---
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: getModalFormSchemas(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-4',
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[600px]',
  closeOnClickModal: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      const { valid } = await formApi.validate();
      if (!valid) return;

      const values = await formApi.getValues();
      // 新增时移除空 id
      if (!values.id) delete values.id;

      modalApi.setState({ confirmLoading: true });

      if (formType.value === 'add') {
        await ProductApi.basicCrudApis.postAdd(values as any);
        message.success($t('common.createSuccess'));
      } else {
        await ProductApi.basicCrudApis.putUpdate(currentId.value, {
          ...values,
        });
        message.success($t('common.updateSuccess'));
      }
      await modalApi.close();
      await gridApi.reload();
    } catch (error) {
      console.error(error);
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  title:
    formType.value === 'add'
      ? $t('common.action.add')
      : $t('common.action.edit'),
});

// --- Grid & Logic ---
const gridQuery = async (params: any, ...args: any[]) => {
  const { page } = params;
  const formValues = args[0] || {};
  const { terms } = formValues;

  const queryParams: QueryParamEntity = {
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    terms,

    sorts: [{ name: 'createTime', order: 'desc' }],
  };
  return await ProductApi.basicCrudApis.postQuery(queryParams);
};

const [TableCard, gridApi] =
  useYlVxeTableCard<IotDeviceProductApi.DeviceProduct>({
    defaultMode: 'card',
    gridOptions: {
      rowConfig: {
        keyField: 'id',
      },
      columns: getColumns(),
      height: 'auto',
      pagerConfig: {
        enabled: true,
        pageSize: 12,
        pageSizes: [12, 24, 48],
      },
      proxyConfig: {
        ajax: {
          query: gridQuery,
        },
        response: {
          result: 'data',
        },
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
    ylDcFromOptions: {
      formSchemas: getSearchFormSchemas(),
      storeOption: {
        conf: {
          storageKey: 'iot-device-product-dc-storage',
        },
        mode: 'localstorage',
      },
    },
  });

// --- Handlers ---
function handleAdd() {
  formType.value = 'add';
  currentId.value = '';
  formApi.resetForm();
  formApi.updateSchema([
    {
      componentProps: {
        disabled: false,
      },
      fieldName: 'id',
    },
  ]);
  modalApi.open();
}

function handleEdit(row: Recordable<any>) {
  formType.value = 'edit';
  currentId.value = row.id;
  formApi.resetForm();
  formApi.setValues(row);
  formApi.updateSchema([
    {
      componentProps: {
        disabled: true,
      },
      fieldName: 'id',
    },
  ]);
  modalApi.open();
}

async function handleDelete(row: Recordable<any>) {
  try {
    await ProductApi.basicCrudApis.deleteById(row.id);
    message.success($t('common.deleteSuccess'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleToggleStatus(row: Recordable<any>) {
  try {
    if (row.state === 1) {
      // 当前是启用(1)，执行禁用
      await unregisterProduct(row.id);
      message.success($t('common.disableSuccess'));
    } else {
      // 当前是禁用(0)，执行启用
      // Check if gateway is connected before enabling
      if (!row.gatewayId) {
        message.warning('产品未接入设备消息网关，不允许启用');
        return;
      }
      await registerProduct(row.id);
      message.success($t('common.enableSuccess'));
    }
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

function handleCardClick(row: any) {
  router.push({
    path: '/iot/device/product/detail',
    query: { id: row.id },
  });
}
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <!-- Toolbar -->
      <template #toolbar-tools>
        <div class="flex gap-2">
          <Button type="primary" @click="handleAdd">
            <template #icon>
              <PlusIcon class="mr-1 size-4" />
            </template>
            {{ $t('common.action.add') }}
          </Button>
        </div>
      </template>

      <!-- Table Action Column -->
      <template #action="{ row }">
        <div class="flex-center flex gap-2">
          <Button
            :title="$t('device.instance.detail')"
            size="small"
            type="link"
            @click.stop="handleCardClick(row)"
          >
            <template #icon>
              <EyeIcon class="size-4" />
            </template>
          </Button>
          <Button
            :title="$t('common.edit')"
            size="small"
            type="link"
            @click.stop="handleEdit(row)"
          >
            <template #icon>
              <EditIcon class="size-4" />
            </template>
          </Button>
          <Popconfirm
            :title="
              row.state === 1
                ? $t('device.product.action.confirmDisable')
                : $t('device.product.action.confirmEnable')
            "
            @confirm="handleToggleStatus(row)"
          >
            <Button
              :danger="row.state === 1"
              :title="
                row.state === 1 ? $t('common.disable') : $t('common.enable')
              "
              size="small"
              type="link"
            >
              <template #icon>
                <BanIcon v-if="row.state === 1" class="size-4" />
                <CheckIcon v-else class="size-4" />
              </template>
            </Button>
          </Popconfirm>
          <Tooltip
            :title="
              row.state === 1
                ? $t('device.product.tips.disableBeforeDelete')
                : $t('common.delete')
            "
          >
            <Popconfirm
              :disabled="row.state === 1"
              :title="$t('common.action.confirmDelete')"
              @confirm="handleDelete(row)"
            >
              <Button
                :disabled="row.state === 1"
                :title="
                  row.state === 1
                    ? $t('device.product.tips.disableBeforeDelete')
                    : $t('common.delete')
                "
                danger
                size="small"
                type="link"
              >
                <template #icon>
                  <TrashIcon class="size-4" />
                </template>
              </Button>
            </Popconfirm>
          </Tooltip>
        </div>
      </template>

      <!-- Card Template -->
      <template #card="{ row }">
        <ProductCard
          :row="row"
          @click="handleCardClick"
          @delete="handleDelete"
          @edit="handleEdit"
          @toggle-status="handleToggleStatus"
        />
      </template>
    </TableCard>

    <Modal>
      <Form />
    </Modal>
  </Page>
</template>
