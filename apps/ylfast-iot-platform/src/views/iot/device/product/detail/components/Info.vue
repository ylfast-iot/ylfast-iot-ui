<script setup lang="ts">
import type { IotDeviceProductApi } from '#/api/iot/device/product';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { useClipboard } from '@vueuse/core';
import { Descriptions, message, Tag, Tooltip } from 'ant-design-vue';

import { DEVICE_TYPE_ENUMS } from '#/enums/device';

import { formatDateTime } from '../../../../../../../../../packages/@core/base/shared/src/utils';

defineProps<{
  product: IotDeviceProductApi.ProductDetail;
}>();

const { copy } = useClipboard();
const CopyIcon = createIconifyIcon('lucide:copy');

function handleCopy(text: string) {
  if (!text) return;
  copy(text);
  message.success($t('common.copySuccess'));
}
</script>

<template>
  <div class="p-4">
    <Descriptions bordered :column="2">
      <Descriptions.Item :label="$t('device.product.productName')">
        {{ product.productName }}
      </Descriptions.Item>
      <Descriptions.Item :label="$t('common.id')">
        <div class="flex items-center gap-2">
          <span>{{ product.id }}</span>
          <Tooltip :title="$t('device.instance.copyId')">
            <div
              class="cursor-pointer text-gray-400 hover:text-primary"
              @click="handleCopy(product.id)"
            >
              <CopyIcon class="size-4" />
            </div>
          </Tooltip>
        </div>
      </Descriptions.Item>
      <Descriptions.Item :label="$t('device.instance.type')">
        <Tag :color="DEVICE_TYPE_ENUMS[product.deviceType.value]?.color">
          {{ DEVICE_TYPE_ENUMS[product.deviceType.value]?.label }}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item :label="$t('device.product.productType')">
        {{ product.productType || '--' }}
      </Descriptions.Item>
      <Descriptions.Item :label="$t('device.instance.transport')">
        {{ product.transport || '--' }}
      </Descriptions.Item>
      <Descriptions.Item :label="$t('device.instance.protocol')">
        {{ product.protocolName || '--' }}
      </Descriptions.Item>
      <Descriptions.Item :label="$t('common.createTime')">
        {{ formatDateTime(product.createTime) || '--' }}
      </Descriptions.Item>
      <Descriptions.Item :label="$t('common.description')" :span="2">
        {{ product.description || '--' }}
      </Descriptions.Item>
    </Descriptions>
  </div>
</template>
