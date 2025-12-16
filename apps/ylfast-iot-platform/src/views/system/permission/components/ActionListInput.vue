<script setup lang="ts">
import type { PropType } from 'vue';

import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { cloneDeep } from '@vben/utils';

import { Button, Input } from 'ant-design-vue';

// Define the Action interface locally
interface Action {
  action: string;
  name: string;
  describe: string;
  i18nName?: string;
  i18nDescribe?: string;
}

const props = defineProps({
  value: {
    type: Array as PropType<Action[]>,
    default: () => [],
  },
  height: {
    type: [String, Number] as PropType<number | string>,
    default: 'auto',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:value', 'change']);

const containerStyle = computed(() => {
  const { height } = props;
  if (height === 'auto') return {};
  return { height: typeof height === 'number' ? `${height}px` : height };
});

const TrashIcon = createIconifyIcon('lucide:trash-2');
const PlusIcon = createIconifyIcon('lucide:plus');

function handleAdd() {
  // Use spread to create a new array reference
  const newList = props.value ? [...props.value] : [];
  newList.push({ action: '', name: '', describe: '' });
  emit('update:value', newList);
  emit('change', newList);
}

function handleDelete(index: number) {
  const newList = props.value ? [...props.value] : [];
  newList.splice(index, 1);
  emit('update:value', newList);
  emit('change', newList);
}

function handleChange(index: number, key: keyof Action, val: string) {
  const newList = props.value ? cloneDeep(props.value) : [];
  if (!newList[index]) return;
  newList[index][key] = val;
  emit('update:value', newList);
  emit('change', newList);
}
</script>

<template>
  <div class="w-full">
    <div
      :style="containerStyle"
      class="flex flex-col overflow-hidden rounded-md border"
    >
      <div class="scrollbar-hidden flex-1 overflow-y-auto">
        <table class="w-full text-left text-sm">
          <thead class="sticky top-0 z-10 bg-gray-50 shadow-sm">
            <tr>
              <th class="w-16 px-4 py-2 text-center font-medium text-gray-500">
                -
              </th>
              <th class="px-4 py-2 font-medium text-gray-500">
                {{ $t('permission.field.actionType') }}
              </th>
              <th class="px-4 py-2 font-medium text-gray-500">
                {{ $t('permission.field.name') }}
              </th>
              <th class="px-4 py-2 font-medium text-gray-500">
                {{ $t('permission.field.describe') }}
              </th>
              <th class="w-16 px-4 py-2 text-center font-medium text-gray-500">
                {{ $t('common.action.label') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="(item, index) in value"
              :key="index"
              class="hover:bg-gray-50/50"
            >
              <td
                class="w-16 overflow-hidden text-ellipsis whitespace-nowrap px-4 py-2 text-center text-gray-400"
              >
                #{{ index + 1 }}
              </td>
              <td class="px-4 py-2">
                <Input
                  :disabled="disabled"
                  :value="item.action"
                  :placeholder="$t('permission.placeholder.actionType')"
                  size="small"
                  @update:value="(val) => handleChange(index, 'action', val)"
                />
              </td>
              <td class="px-4 py-2">
                <Input
                  :disabled="disabled"
                  :value="item.name"
                  :placeholder="$t('permission.placeholder.actionName')"
                  size="small"
                  @update:value="(val) => handleChange(index, 'name', val)"
                />
              </td>
              <td class="px-4 py-2">
                <Input
                  :disabled="disabled"
                  :value="item.describe"
                  :placeholder="$t('permission.placeholder.describe')"
                  size="small"
                  @update:value="(val) => handleChange(index, 'describe', val)"
                />
              </td>
              <td class="px-4 py-2 text-center">
                <Button
                  :disabled="disabled"
                  danger
                  size="small"
                  type="text"
                  @click="handleDelete(index)"
                >
                  <template #icon>
                    <TrashIcon />
                  </template>
                </Button>
              </td>
            </tr>
            <tr v-if="!value || value.length === 0">
              <td colspan="5" class="px-4 py-8 text-center text-gray-400">
                {{ $t('permission.text.noData') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-2 rounded-md border border-dashed">
      <Button :disabled="disabled" block type="text" @click="handleAdd">
        <template #icon>
          <PlusIcon />
        </template>
        {{ $t('permission.action.addOperation') }}
      </Button>
    </div>
  </div>
</template>
