<script setup lang="ts">
import type { Recordable } from '#/adapter';
import type { DeviceState, DeviceType } from '#/enums/device';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useVbenForm, useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, message, Popconfirm, Tag } from 'ant-design-vue';

import {
  bindDevice,
  getDeviceDetailsPage,
  IotDeviceInstanceApi,
  unBindDevice,
} from '#/api/iot/device/instance';
import { useDeviceSelector } from '#/components/business/device/device-selector';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';
import { COMMON_STATE } from '#/enums';
import {
  DEVICE_STATE,
  DEVICE_STATE_TYPE_ENUMS,
  DEVICE_TYPE_ENUMS,
} from '#/enums/device';
import {
  modalFormSchemas,
  searchFormSchemas,
} from '#/views/iot/device/instance/data';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
}>();

const router = useRouter();
const PlusIcon = createIconifyIcon('lucide:plus');
const LinkIcon = createIconifyIcon('lucide:link');
const UnlinkIcon = createIconifyIcon('lucide:unlink');
const EyeIcon = createIconifyIcon('lucide:eye');

const selectedRowCount = ref(0);

function handleCheckboxChange() {
  const records = gridApi.grid.getCheckboxRecords();
  selectedRowCount.value = records.length;
}

const gridQuery = async (params: any, ...args: any[]) => {
  const { page } = params;
  const formValues = args[0] || {};
  const { terms = [] } = formValues;

  return await getDeviceDetailsPage({
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    sorts: [
      {
        name: 'createTime',
        order: 'desc',
      },
      {
        name: 'deviceState',
        order: 'desc',
        value: DEVICE_STATE.online,
      },
    ],
    terms: [
      ...terms,
      {
        column: 'parentDeviceId',
        termType: 'eq',
        value: props.device.id,
      },
    ],
  });
};

const [TableCard, gridApi] =
  useYlVxeTableCard<IotDeviceInstanceApi.DeviceDetail>({
    gridEvents: {
      checkboxAll: handleCheckboxChange,
      checkboxChange: handleCheckboxChange,
    },
    gridOptions: {
      columns: [
        { type: 'checkbox', width: 50 },
        { type: 'seq', width: 60 },
        {
          field: 'id',
          title: $t('device.instance.id'),
          width: 180,
        },
        {
          field: 'sn',
          title: $t('device.instance.sn'),
          width: 180,
        },
        {
          field: 'deviceName',
          title: $t('device.instance.name'),
        },
        {
          field: 'productName',
          title: $t('device.instance.product'),
        },
        {
          field: 'deviceType',
          slots: { default: 'deviceType' },
          title: $t('device.instance.type'),
          width: 120,
        },
        {
          align: 'center',
          field: 'deviceState',
          slots: { default: 'state' },
          title: $t('device.instance.status'),
          width: 120,
        },
        {
          field: 'createTime',
          formatter: 'formatDateTime',
          title: $t('device.instance.createTime'),
          width: 180,
        },
        {
          field: 'action',
          fixed: 'right',
          slots: { default: 'action' },
          title: $t('common.action.label'),
          width: 150,
        },
      ],
      height: 'auto',
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
        refresh: true,
      },
    },
    mode: 'table',
    searchFormMode: 'yl-dc-form',
    separator: false,
    showSearchForm: true,
    ylDcFromOptions: {
      formSchemas: searchFormSchemas,
      storeOption: {
        conf: {
          storageKey: 'iot-device-sub-instance-dc-storage',
        },
        mode: 'localstorage',
      },
    },
  });

// --- Add & Bind Modal Logic ---

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
      // Use bindDevice with addAndBindDevice to create and bind in one step
      await bindDevice({
        addAndBindDevice: values as any,
        parentDeviceId: props.device.id,
      });

      message.success($t('common.createSuccess'));

      await modalApi.close();
      await gridApi.reload();
    } catch (error) {
      console.error(error);
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  title: $t('device.instance.action.addAndBind'),
});

onMounted(() => {
  // Inject onChange handler for productId (same as in instance/index.vue)
  formApi.updateSchema([
    {
      componentProps: {
        onChange: (_value: any, option: any) => {
          if (option) {
            formApi.setValues({
              deviceState: DEVICE_STATE.unActive,
              deviceType: option.deviceType,
              enableStatus: COMMON_STATE.FORBIDDEN.value,
              productName: option.productName,
              protocolId: option.protocolId,
              transport: option.transport,
            });
          }
        },
      },
      fieldName: 'productId',
    },
  ]);
});

function normalizeFormValues(values: Recordable) {
  if (!values.id) {
    values.id = undefined;
  }
}

function handleAddAndBind() {
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

// --- Device Selector for Binding ---
const [BindDeviceSelector, { open: openDeviceSelector, clearSelection }] =
  useDeviceSelector({
    onSubmitAfter: () => {
      clearSelection();
    },
  });

async function handleBind() {
  if (!openDeviceSelector) return;
  const { rows } = await openDeviceSelector({
    modalTitle: $t('device.selector.title'),
    multiple: true,
    // 拦截器：排除当前设备，且排除所有网关类型的设备
    beforeFetch: (params: any) => {
      params.terms = [
        ...(params.terms || []),
        {
          column: 'id',
          termType: 'nin',
          value: props.device.id,
        },
        {
          column: 'deviceType',
          termType: 'neq',
          value: 'GATEWAY',
        },
      ];
      return params;
    },
  });

  if (rows && rows.length > 0) {
    try {
      await bindDevice({
        bindDeviceList: rows,
        parentDeviceId: props.device.id,
      });
      message.success($t('common.success'));
      gridApi.reload();
    } catch (error) {
      console.error('Failed to bind devices', error);
    }
  }
}

async function handleBatchUnbind() {
  const records = gridApi.grid.getCheckboxRecords();
  if (records.length === 0) {
    message.warning($t('common.tips.selectData'));
    return;
  }

  try {
    await unBindDevice({
      bindDeviceList: records.map(
        (i) => i as IotDeviceInstanceApi.DeviceInstance,
      ),
      parentDeviceId: props.device.id,
    });
    message.success($t('common.action.unbind') + $t('common.success'));
    selectedRowCount.value = 0;
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleUnbind(row: IotDeviceInstanceApi.DeviceDetail) {
  try {
    // Cast detail to instance for unbind API
    // The API expects DeviceInstance in the list, but DeviceDetail has enough overlapping fields for ID
    await unBindDevice({
      bindDeviceList: [row as unknown as IotDeviceInstanceApi.DeviceInstance],
      parentDeviceId: props.device.id,
    });
    message.success($t('common.action.unbind') + $t('common.success'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

function handleDetail(row: IotDeviceInstanceApi.DeviceDetail) {
  router.push({
    path: '/iot/device/instance/detail',
    query: { id: row.id },
  });
}

function getDeviceType(deviceType: any) {
  const typeValue = (deviceType?.value || deviceType) as DeviceType;
  return (
    DEVICE_TYPE_ENUMS[typeValue] || {
      color: 'default',
      label: typeValue,
    }
  );
}
</script>

<template>
  <div class="h-full p-4">
    <TableCard>
      <template #toolbar-tools>
        <div class="flex gap-2">
          <Button type="primary" @click="handleAddAndBind">
            <template #icon><PlusIcon class="mr-1 size-4" /></template>
            {{ $t('device.instance.action.addAndBind') }}
          </Button>
          <Button @click="handleBind">
            <template #icon><LinkIcon class="mr-1 size-4" /></template>
            {{ $t('device.instance.action.bindExisting') }}
          </Button>
          <Popconfirm
            :disabled="selectedRowCount === 0"
            :title="$t('common.confirmUnbind')"
            @confirm="handleBatchUnbind"
          >
            <Button :disabled="selectedRowCount === 0" danger ghost>
              <template #icon><UnlinkIcon class="mr-1 size-4" /></template>
              {{ $t('common.action.batchUnbind') }}
            </Button>
          </Popconfirm>
        </div>
      </template>
      <template #deviceType="{ row }">
        <Tag :color="getDeviceType(row.deviceType).color">
          {{ getDeviceType(row.deviceType).label }}
        </Tag>
      </template>
      <template #state="{ row }">
        <div class="flex-center flex items-center gap-2">
          <span
            class="h-2 w-2 rounded-full"
            :class="
              row.deviceState?.value === 'online'
                ? 'bg-green-500'
                : row.deviceState?.value === 'unActive'
                  ? 'bg-red-500'
                  : 'bg-gray-400'
            "
          ></span>
          <span>
            {{
              row.deviceState?.value === 'unActive'
                ? $t('common.disable')
                : DEVICE_STATE_TYPE_ENUMS[row.deviceState?.value as DeviceState]
                    ?.label
            }}
          </span>
        </div>
      </template>

      <!-- Action Column -->
      <template #action="{ row }">
        <div class="flex-center flex gap-2">
          <Button
            :title="$t('device.instance.detail')"
            size="small"
            type="link"
            @click.stop="handleDetail(row)"
          >
            <template #icon><EyeIcon class="size-4" /></template>
          </Button>

          <Popconfirm
            :title="$t('common.confirmUnbind')"
            @confirm="handleUnbind(row)"
          >
            <Button
              :title="$t('common.action.unbind')"
              danger
              size="small"
              type="link"
            >
              <template #icon><UnlinkIcon class="size-4" /></template>
            </Button>
          </Popconfirm>
        </div>
      </template>
    </TableCard>
    <Modal>
      <Form />
    </Modal>
    <!-- 绑定已有设备弹窗 -->
    <BindDeviceSelector hide-trigger />
  </div>
</template>
