<script setup lang="ts">
import type { LoggerApi } from '#/api/system/logger';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Descriptions, DescriptionsItem, Divider, Tag } from 'ant-design-vue';

const data = ref<LoggerApi.SystemLog | null>(null);

const [Modal, modalApi] = useVbenModal({
  confirmText: $t('common.action.confirm'),
  draggable: true,
  onCancel: () => {
    modalApi.close();
  },
  onConfirm: () => {
    modalApi.close();
  },
  showCancelButton: false,
});

function open(log: LoggerApi.SystemLog) {
  data.value = log;
  modalApi.setState({ title: $t('logger.system.detail') });
  modalApi.open();
}

const preClass =
  'overflow-auto whitespace-pre-wrap rounded bg-gray-100 p-2 text-xs';

const exceptionClass =
  'overflow-auto rounded bg-red-50 p-2 text-xs text-red-600';

defineExpose({ open });
</script>

<template>
  <Modal class="w-3/4">
    <div v-if="data" class="overflow-y-auto p-4">
      <Descriptions :column="2" bordered>
        <DescriptionsItem :label="$t('logger.system.name')">
          {{ data.name }}
        </DescriptionsItem>

        <DescriptionsItem :label="$t('logger.system.level')">
          <Tag
            :color="
              data.level === 'ERROR'
                ? 'red'
                : data.level === 'WARN'
                  ? 'orange'
                  : 'green'
            "
          >
            {{ data.level }}
          </Tag>
        </DescriptionsItem>

        <DescriptionsItem :label="$t('logger.system.serviceName')">
          {{ data.context?.server }}
        </DescriptionsItem>

        <DescriptionsItem :label="$t('logger.system.createTime')">
          {{ new Date(data.createTime).toLocaleString() }}
        </DescriptionsItem>

        <DescriptionsItem :label="$t('logger.system.threadName')" :span="2">
          {{ data.threadName }}
        </DescriptionsItem>

        <DescriptionsItem :label="$t('logger.system.className')" :span="2">
          {{ data.className }}
        </DescriptionsItem>

        <DescriptionsItem :label="$t('logger.system.methodName')" :span="2">
          {{ data.methodName }}:{{ data.lineNumber }}
        </DescriptionsItem>
      </Descriptions>

      <Divider>{{ $t('logger.system.message') }}</Divider>

      <pre :class="preClass">{{ data.message }}</pre>

      <div v-if="data.exceptionStack">
        <Divider style="color: red; border-color: red">
          {{ $t('logger.system.exceptionStack') }}
        </Divider>

        <pre :class="exceptionClass">{{ data.exceptionStack }}</pre>
      </div>
    </div>
  </Modal>
</template>
