<script setup lang="ts">
import type { LoggerApi } from '#/api/system/logger';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Descriptions, DescriptionsItem, Divider, Tag } from 'ant-design-vue';

const data = ref<LoggerApi.AccessLog | null>(null);

const [Modal, modalApi] = useVbenModal({
  confirmText: $t('common.action.confirm'),
  draggable: true,
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    modalApi.close();
  },
  showCancelButton: false,
});

function open(log: LoggerApi.AccessLog) {
  data.value = log;
  modalApi.setState({ title: $t('logger.access.detail') });
  modalApi.open();
}

defineExpose({ open });

const formatJson = (json: any) => {
  try {
    if (typeof json === 'string') {
      return JSON.stringify(JSON.parse(json), null, 2);
    }
    return JSON.stringify(json, null, 2);
  } catch {
    return json;
  }
};
</script>

<template>
  <Modal class="w-3/4">
    <div v-if="data" class="overflow-y-auto p-4">
      <Descriptions :column="2" bordered>
        <DescriptionsItem :label="$t('logger.access.ip')">
          {{ data.ip }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('logger.access.ipRegion')">
          {{ data.ipRegion }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('logger.access.url')" :span="2">
          {{ data.url }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('logger.access.method')">
          <Tag :color="data.httpMethod === 'GET' ? 'green' : 'blue'">
            {{ data.httpMethod }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem :label="$t('logger.access.duration')">
          {{ data.responseTime - data.requestTime }} ms
        </DescriptionsItem>
        <DescriptionsItem :label="$t('logger.access.requestTime')">
          {{ new Date(data.requestTime).toLocaleString() }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('logger.access.user')">
          {{ data.creatorId }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('logger.access.describe')" :span="2">
          {{ data.describe }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('logger.access.target')" :span="2">
          {{ data.target }}.{{ data.method }}
        </DescriptionsItem>
      </Descriptions>

      <Divider>{{ $t('logger.access.parameters') }}</Divider>
      <pre class="max-h-40 overflow-auto rounded bg-gray-100 p-2 text-xs">{{
        formatJson(data.parameters)
      }}</pre>

      <Divider>{{ $t('logger.access.httpHeaders') }}</Divider>
      <pre class="max-h-40 overflow-auto rounded bg-gray-100 p-2 text-xs">{{
        formatJson(data.httpHeaders)
      }}</pre>

      <div v-if="data.exception">
        <Divider style="color: red; border-color: red">
          {{ $t('logger.access.exception') }}
        </Divider>
        <pre class="overflow-auto rounded bg-red-50 p-2 text-xs text-red-600">{{
          data.exception
        }}</pre>
      </div>
    </div>
  </Modal>
</template>
