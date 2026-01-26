<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';

import { createIconifyIcon } from '@vben/icons';

import { FormItem, Tooltip } from 'ant-design-vue';

import { getRules } from '#/utils/config-metadata';

defineProps<{
  prop: ConfigPropertyMetadata;
}>();

const QuestionCircleOutlined = createIconifyIcon(
  'ant-design:question-circle-outlined',
);
</script>

<template>
  <FormItem :name="prop.property" :rules="getRules(prop)">
    <template #label>
      <div class="flex items-center">
        {{ prop.name }}
        <Tooltip v-if="prop.description" :title="prop.description" class="ml-1">
          <span class="inline-flex items-center">
            <QuestionCircleOutlined
              class="cursor-help text-gray-400 dark:text-gray-500"
            />
          </span>
        </Tooltip>
      </div>
    </template>
    <slot> </slot>
  </FormItem>
</template>
