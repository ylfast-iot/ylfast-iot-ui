<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { QueryParamEntity } from '#/adapter';
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';

import { onMounted, ref } from 'vue';

import { Page, useVbenForm, useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button,
  Dropdown,
  Menu,
  MenuItem,
  message,
  Popconfirm,
  Tag,
} from 'ant-design-vue';

import {
  changeEnableStatus,
  getDeviceDetailsPage,
  IotDeviceInstanceApi as InstanceApi,
} from '#/api/iot/device/instance';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';
import { COMMON_STATE } from '#/enums';
import { DEVICE_STATE } from '#/enums/device';

import DeviceCard from './components/DeviceCard.vue';
import { columns, modalFormSchemas, searchFormSchemas } from './data';

const EditIcon = createIconifyIcon('lucide:edit-3');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const PlusIcon = createIconifyIcon('lucide:plus');
const MoreHorizontalIcon = createIconifyIcon('lucide:more-horizontal');
const CheckIcon = createIconifyIcon('lucide:check-circle');
const BanIcon = createIconifyIcon('lucide:ban');

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
  schema: modalFormSchemas,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-4',
});

onMounted(() => {
  // Inject onChange handler for productId
  formApi.updateSchema([
    {
      componentProps: {
        onChange: (_value: any, option: any) => {
          if (option) {
            formApi.setValues({
              deviceType: option.deviceType,
              deviceState: DEVICE_STATE.unActive, // Default state for new device
              enableStatus: COMMON_STATE.FORBIDDEN.value, // Default enabled
              transport: option.transport,
              protocolId: option.protocolId,
              productName: option.productName,
            });
          }
        },
      },
      fieldName: 'productId',
    },
  ]);
});

function normalizeFormValues(values: Recordable<any>) {
  // id 如果是空的则直接设置为undefined，防止为 空字符串时后端校验不通过
  if (!values.id) {
    values.id = undefined;
  }
}

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
      normalizeFormValues(values);

      modalApi.setState({ confirmLoading: true });

      if (formType.value === 'add') {
        await InstanceApi.basicCrudApis.postAdd(values as any);
        message.success($t('common.createSuccess'));
      } else {
        await InstanceApi.basicCrudApis.putUpdate(currentId.value, {
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
      ? $t('device.instance.action.add')
      : $t('common.edit'),
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

  return await getDeviceDetailsPage(queryParams);
};

const [TableCard, gridApi] =
  useYlVxeTableCard<IotDeviceInstanceApi.DeviceInstance>({
    defaultMode: 'card',
    gridOptions: {
      rowConfig: {
        keyField: 'id',
      },
      columns,
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
      formSchemas: searchFormSchemas,
      storeOption: {
        conf: {
          storageKey: 'iot-device-instance-dc-storage',
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
    {
      componentProps: {
        disabled: false,
      },
      fieldName: 'productId',
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
    {
      componentProps: {
        disabled: true,
      },
      fieldName: 'productId',
    },
  ]);
  modalApi.open();
}

async function handleDelete(row: Recordable<any>) {
  try {
    await InstanceApi.basicCrudApis.deleteBatch([row.id]);
    message.success($t('common.deleteSuccess'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleToggleStatus(row: Recordable<any>) {
  try {
    const newStatus = row.enableStatus === 1 ? 0 : 1;
    await changeEnableStatus({
      enableStatus: newStatus,
      id: row.id,
    });
    message.success(
      newStatus === 1
        ? $t('common.enable') + $t('common.success')
        : $t('common.disable') + $t('common.success'),
    );
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

function handleBatchOperation(key: string) {
  const selectedRecords = gridApi.grid.getCheckboxRecords();
  if (key === 'delete') {
    if (selectedRecords.length === 0) {
      message.warning($t('common.tips.selectData'));
      return;
    }
    // Batch delete logic
    InstanceApi.basicCrudApis
      .deleteBatch(selectedRecords.map((item) => item.id))
      .then(() => {
        message.success($t('common.deleteSuccess'));
        gridApi.reload();
      });
  } else if (key === 'add') {
    // Batch add placeholder
    message.info($t('device.instance.tips.batchAddNotImplemented'));
  }
}

function handleCardClick(_row: any) {
  // Navigate to detail page (Placeholder)
  // console.log('Navigate to detail:', row.id);
}
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <!-- Toolbar -->
      <template #toolbar-tools>
        <div class="flex gap-2">
          <Button type="primary" @click="handleAdd">
            <template #icon><PlusIcon class="mr-1 size-4" /></template>
            {{ $t('device.instance.action.add') }}
          </Button>

          <Dropdown>
            <template #overlay>
              <Menu @click="({ key }) => handleBatchOperation(key as string)">
                <MenuItem key="add">
                  {{ $t('device.instance.action.batchAdd') }}
                </MenuItem>
                <MenuItem key="delete">
                  {{ $t('device.instance.action.batchDelete') }}
                </MenuItem>
              </Menu>
            </template>
            <Button>
              {{ $t('device.instance.action.batch') }}
              <MoreHorizontalIcon class="ml-1 size-4" />
            </Button>
          </Dropdown>
        </div>
      </template>

      <!-- Table Action Column -->
      <template #action="{ row }">
        <div class="flex gap-2">
          <Button
            :title="$t('common.edit')"
            size="small"
            type="link"
            @click.stop="handleEdit(row)"
          >
            <template #icon><EditIcon class="size-4" /></template>
          </Button>
          <Popconfirm
            :title="
              row.enableStatus === 1
                ? $t('device.instance.action.confirmDisable')
                : $t('device.instance.action.confirmEnable')
            "
            @confirm="handleToggleStatus(row)"
          >
            <Button
              :danger="row.enableStatus === 1"
              :title="
                row.enableStatus === 1
                  ? $t('common.disable')
                  : $t('common.enable')
              "
              size="small"
              type="link"
            >
              <template #icon>
                <BanIcon v-if="row.enableStatus === 1" class="size-4" />
                <CheckIcon v-else class="size-4" />
              </template>
            </Button>
          </Popconfirm>
          <Popconfirm
            :title="$t('common.action.confirmDelete')"
            @confirm="handleDelete(row)"
          >
            <Button
              :title="$t('common.delete')"
              danger
              size="small"
              type="link"
            >
              <template #icon><TrashIcon class="size-4" /></template>
            </Button>
          </Popconfirm>
        </div>
      </template>

      <!-- Table Status Column -->
      <template #status="{ row }">
        <Tag :color="row.enableStatus === 1 ? 'success' : 'error'">
          {{
            row.enableStatus === 1 ? $t('common.enable') : $t('common.disable')
          }}
        </Tag>
      </template>

      <!-- Card Template -->
      <template #card="{ row }">
        <DeviceCard
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
