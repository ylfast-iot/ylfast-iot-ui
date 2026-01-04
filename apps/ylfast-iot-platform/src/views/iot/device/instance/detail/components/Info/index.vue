<script setup lang="ts">
import type { YlDescSchema } from '#/components/yl-desc/src/types';
import type { DeviceType } from '#/enums/device';

import { h, onMounted, ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { useClipboard } from '@vueuse/core';
import {
  Button,
  Card,
  message,
  Modal,
  Spin,
  Tag,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getDeviceConfigMetadata,
  IotDeviceInstanceApi,
} from '#/api/iot/device/instance';
import {
  useYlConfigMetadataDesc,
  YlConfigMetadataDesc,
} from '#/components/yl-config-metadata-desc';
import { YlDesc } from '#/components/yl-desc';
import { DEVICE_TYPE_ENUMS } from '#/enums/device';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
}>();

const { copy } = useClipboard();
const CopyIcon = createIconifyIcon('lucide:copy');

const metadata = ref<any[]>([]);
const metadataLoading = ref(false);

const basicSchemas: YlDescSchema[] = [
  {
    field: 'deviceName',
    label: $t('device.instance.name'),
  },
  {
    field: 'id',
    label: $t('device.instance.id'),
    render: (val) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', { class: 'font-mono text-gray-600' }, val),
        h(
          Tooltip,
          { title: $t('device.instance.copyId') },
          {
            default: () =>
              h(CopyIcon, {
                class:
                  'size-3.5 cursor-pointer text-gray-400 transition-colors hover:text-primary',
                onClick: () => handleCopy(val),
              }),
          },
        ),
      ]);
    },
  },
  {
    field: 'sn',
    label: $t('device.instance.sn'),
  },
  {
    field: 'productName',
    label: $t('device.instance.product'),
  },
  {
    field: 'deviceType',
    label: $t('device.instance.type'),
    render: (val: DeviceType) => {
      const config = DEVICE_TYPE_ENUMS[val];
      return h(
        Tag,
        { color: config?.color || 'blue' },
        () => config?.label || val,
      );
    },
  },
  {
    field: 'gatewayName',
    label: $t('device.instance.gateway'),
    render: (val) => val || '--',
  },
  {
    field: 'protocolName',
    label: $t('device.instance.protocol'),
  },
  {
    field: 'transport',
    label: $t('device.instance.transport'),
  },
  {
    field: 'createTime',
    label: $t('common.createTime'),
    render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '--'),
  },
  {
    field: 'registerTime',
    label: $t('device.instance.registerTime'),
    render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '--'),
  },
  {
    field: 'onlineTime',
    label: $t('device.instance.onlineTime'),
    render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '--'),
  },
  {
    field: 'offlineTime',
    label: $t('device.instance.offlineTime'),
    render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '--'),
  },
  {
    field: 'description',
    label: $t('device.instance.description'),
    span: 3,
  },
];

async function fetchMetadata() {
  if (!props.device.id) return;
  metadataLoading.value = true;
  try {
    const res = await getDeviceConfigMetadata(props.device.id);
    metadata.value = res;
  } catch (error) {
    console.error(error);
  } finally {
    metadataLoading.value = false;
  }
}

function handleCopy(text: string) {
  copy(text);
  message.success($t('common.copySuccess'));
}

async function handleSave() {
  if (!props.device?.id) return;
  const model = await methods.submit();
  const isSelfConfig = props.device.isSelfConfig;
  const isSelfMetadata = props.device.isSelfMetadata;
  const confirmTitle = isSelfConfig
    ? $t('device.instance.confirmTitle.modify')
    : $t('device.instance.confirmTitle.override');
  const confirmContent = isSelfConfig
    ? $t('device.instance.confirmContent.modify')
    : $t('device.instance.confirmContent.override');

  Modal.confirm({
    title: confirmTitle,
    content: confirmContent,
    okType: isSelfConfig ? 'primary' : 'danger',
    onOk: async () => {
      try {
        const updateData = {
          ...props.device,
          configuration: model,
        };

        if (!isSelfMetadata) {
          // 如果不是自己的物模型，则不更新
          updateData.tsl = undefined;
        }

        await IotDeviceInstanceApi.basicCrudApis.putUpdate(
          props.device.id,
          updateData,
        );
        message.success($t('device.instance.configUpdateSuccess'));
        // 可选：触发父组件刷新数据
        await fetchMetadata();
        methods.toggleEditMode();
      } catch (error) {
        console.error(error);
      }
    },
  });
}

const col = 3;
const [register, methods] = useYlConfigMetadataDesc({
  column: {
    xs: 1,
    sm: Math.min(col, 1),
    md: Math.min(col, 2),
    lg: Math.min(col, 2),
    xl: col,
    xxl: col,
  },
  showEditButton: false,
});
const deviceConfigEditMode = ref(false);

onMounted(() => {
  fetchMetadata();
});
</script>

<template>
  <div class="space-y-4 p-4">
    <!-- 基本信息 -->
    <Card size="small">
      <template #title>
        <span class="text-base font-bold">{{ $t('common.basicInfo') }}</span>
      </template>
      <YlDesc :column="3" :data="device" :schemas="basicSchemas" />
    </Card>

    <!-- 配置信息 -->
    <Card v-if="metadata && metadata.length > 0" size="small">
      <template #title>
        <div class="flex items-center justify-between">
          <span class="text-base font-bold">{{
            $t('device.instance.config')
          }}</span>
          <div class="flex justify-end gap-2">
            <template v-if="!deviceConfigEditMode">
              <Button
                size="small"
                type="primary"
                @click="methods.toggleEditMode"
              >
                {{ $t('common.action.edit') }}
              </Button>
            </template>
            <template v-else>
              <Button size="small" @click="methods.toggleEditMode">
                {{ $t('common.action.cancel') }}
              </Button>
              <Button size="small" type="primary" @click="handleSave">
                {{ $t('common.action.save') }}
              </Button>
            </template>
          </div>
        </div>
      </template>
      <Spin :spinning="metadataLoading">
        <YlConfigMetadataDesc
          @register="register"
          v-model:edit-mode="deviceConfigEditMode"
          :metadata="metadata"
          :model="device.configuration"
          @save="handleSave"
        />
      </Spin>
    </Card>
  </div>
</template>
