<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button,
  Card,
  Empty,
  message,
  Popconfirm,
  Select,
} from 'ant-design-vue';

import { getClusterNodes } from '#/api/system/monitor/cluster';

import MediaServerConfigForm from './MediaServerConfigForm.vue';

const props = defineProps<{
  provider?: string;
  register?: (action: any) => void;
  value?: any[];
}>();

const emit = defineEmits(['update:value']);

const PlusIcon = createIconifyIcon('lucide:plus');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const ServerIcon = createIconifyIcon('lucide:server');

const clusterNodes = ref<any[]>([]);
const items = ref<any[]>(props.value || []);

// Sync items to formModel
watch(
  items,
  (val) => {
    emit('update:value', val);
  },
  { deep: true },
);

// Map to store child validators
const childValidators = ref<Map<number, any>>(new Map());

function handleChildRegister(index: number, action: any) {
  childValidators.value.set(index, action);
}

async function validate() {
  // Manual validation for serverId
  const invalidNodes = items.value
    .map((item, index) => (item.serverId ? null : index + 1))
    .filter((v) => v !== null);

  if (invalidNodes.length > 0) {
    message.error(
      $t('mediaServer.clusterConfig.validateError', {
        nodes: invalidNodes.join(', '),
      }),
    );
    throw new Error('Validation failed');
  }

  // Then validate all nested configurations
  const validations = [...childValidators.value.values()].map((v) =>
    v.validate(),
  );
  await Promise.all(validations);
  return items.value;
}

defineExpose({
  validate,
});

onMounted(async () => {
  if (props.register) {
    props.register({
      validate,
      setProps: () => {},
      resetFields: () => {
        items.value = [];
      },
    });
  }
  try {
    const res = await getClusterNodes();
    clusterNodes.value = (res.nodes || []).map((node: any) => ({
      label: node.alias || node.serverId,
      value: node.serverId,
    }));
  } catch (error) {
    console.error('Failed to load cluster nodes:', error);
  }
});

watch(
  () => props.value,
  (val) => {
    if (val && JSON.stringify(val) !== JSON.stringify(items.value)) {
      items.value = [...val];
    }
  },
  { deep: true },
);

function addItem() {
  items.value.push({
    serverId: undefined,
    configuration: {},
  });
}

function removeItem(index: number) {
  items.value.splice(index, 1);
  childValidators.value.delete(index);
}
</script>

<template>
  <div class="w-full">
    <div
      v-if="items.length > 0"
      class="flex flex-col gap-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30"
    >
      <Card
        v-for="(item, index) in items"
        :key="index"
        size="small"
        class="relative overflow-visible shadow-sm"
        :head-style="{ backgroundColor: 'hsl(var(--muted)/0.3)' }"
      >
        <template #title>
          <div class="flex items-center gap-2 py-0.5">
            <ServerIcon class="size-4 text-primary" />
            <span class="text-sm font-bold text-slate-700 dark:text-gray-300">
              {{ $t('mediaServer.clusterConfig.nodePrefix') }}{{ index + 1 }}
            </span>
            <div class="ml-4 flex items-center gap-2">
              <span class="text-destructive">*</span>
              <Select
                v-model:value="item.serverId"
                :options="clusterNodes"
                :placeholder="$t('mediaServer.clusterConfig.assignNode')"
                size="small"
                class="w-[200px]"
                :bordered="false"
              />
            </div>
          </div>
        </template>
        <template #extra>
          <Popconfirm
            :title="$t('common.action.confirmDelete')"
            @confirm="removeItem(index)"
          >
            <Button type="text" size="small" danger class="flex items-center">
              <template #icon><TrashIcon class="size-3.5" /></template>
              <span class="ml-1 text-[11px]">{{
                $t('mediaServer.clusterConfig.removeNode')
              }}</span>
            </Button>
          </Popconfirm>
        </template>

        <MediaServerConfigForm
          v-model:value="item.configuration"
          :register="(action: any) => handleChildRegister(index, action)"
          :provider="provider"
          embedded
        />
      </Card>
      <Button
        type="dashed"
        block
        @click="addItem"
        class="bg-white dark:bg-gray-800"
      >
        <template #icon><PlusIcon class="size-4" /></template>
        {{ $t('mediaServer.clusterConfig.addNode') }}
      </Button>
    </div>
    <div v-if="items.length === 0" class="py-10 text-center">
      <Empty :description="$t('mediaServer.clusterConfig.empty')">
        <Button type="primary" @click="addItem">
          <template #icon><PlusIcon class="size-4" /></template>
          {{ $t('mediaServer.clusterConfig.addNode') }}
        </Button>
      </Empty>
    </div>
  </div>
</template>
