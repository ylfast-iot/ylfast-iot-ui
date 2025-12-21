<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Input, InputNumber, message, Select } from 'ant-design-vue';

import YlMonacoEditor from '#/components/yl-monaco-editor/index.vue';

const props = withDefaults(defineProps<Props>(), {
  value: () => ({}),
  fixedOptions: () => [],
});
const emit = defineEmits(['update:value', 'change']);
const DeleteIcon = createIconifyIcon('lucide:trash-2');
const PlusIcon = createIconifyIcon('lucide:plus');
const EditIcon = createIconifyIcon('lucide:edit');

type DataType = 'boolean' | 'json' | 'number' | 'string';

interface FixedOption {
  key: string;
  type?: DataType;
  value?: any;
  description?: string;
}

interface OptionItem {
  key: string;
  value: any;
  type: DataType;
  isFixed: boolean;
  description?: string;
}

interface Props {
  value?: Record<string, any>;
  fixedOptions?: (FixedOption | string)[];
}

const list = ref<OptionItem[]>([]);
const currentEditItem = ref<null | OptionItem>(null);
const jsonContent = ref('');

const [JsonModal, modalApi] = useVbenModal({
  title: 'Edit JSON',
  onConfirm: handleJsonSave,
  class: 'w-[600px]',
});

const typeOptions = computed(() => [
  { label: $t('menu.dataType.string'), value: 'string' },
  { label: $t('menu.dataType.number'), value: 'number' },
  { label: $t('menu.dataType.boolean'), value: 'boolean' },
  { label: $t('menu.dataType.json'), value: 'json' },
]);

const booleanOptions = [
  { label: 'True', value: 1 },
  { label: 'False', value: 0 },
];

function inferType(val: any): DataType {
  if (typeof val === 'boolean') return 'boolean';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'object' && val !== null) return 'json';
  return 'string';
}

function convertValueOnTypeChange(val: any, newType: DataType): any {
  if (newType === 'number') {
    const n = Number(val);
    return Number.isNaN(n) ? 0 : n;
  }
  if (newType === 'boolean') {
    return val ? 1 : 0;
  }
  if (newType === 'json') {
    if (typeof val === 'object') return val;
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }
  if (newType === 'string') {
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val ?? '');
  }
  return val;
}

function convertListToValue(items: OptionItem[]) {
  const result: Record<string, any> = {};
  items.forEach((item) => {
    if (item.key) {
      let val = item.value;
      if (item.type === 'json' && typeof val === 'string') {
        try {
          val = JSON.parse(val);
        } catch {
          val = {};
        }
      }
      if (item.type === 'boolean') {
        val = !!val;
      }

      // 仅保留非空值: 排除 '', null, undefined
      if (val !== '' && val !== null && val !== undefined) {
        result[item.key] = val;
      }
    }
  });
  return result;
}

function normalizeFixedOptions(opts: (FixedOption | string)[]): FixedOption[] {
  return opts.map((opt) => {
    if (typeof opt === 'string') {
      return { key: opt };
    }
    return opt;
  });
}

function initList() {
  const valueMap = props.value || {};
  const newList: OptionItem[] = [];
  const fixed = normalizeFixedOptions(props.fixedOptions || []);
  const fixedKeys = new Set(fixed.map((f) => f.key));

  fixed.forEach((f) => {
    const val = valueMap[f.key];
    const type = f.type || inferType(val);

    let finalValue = val;
    if (finalValue === undefined) {
      if (f.value === undefined) {
        switch (type) {
          case 'boolean': {
            finalValue = false;
            break;
          }
          case 'json': {
            finalValue = {};
            break;
          }
          case 'number': {
            finalValue = 0;
            break;
          }
          default: {
            finalValue = '';
          }
        }
      } else {
        finalValue = f.value;
      }
    }

    if (type === 'boolean') {
      finalValue = finalValue ? 1 : 0;
    }

    newList.push({
      key: f.key,
      value: finalValue,
      type,
      isFixed: true,
      description: f.description,
    });
  });

  Object.keys(valueMap).forEach((key) => {
    if (!fixedKeys.has(key)) {
      const val = valueMap[key];
      const type = inferType(val);
      let finalValue = val;
      if (type === 'boolean') {
        finalValue = finalValue ? 1 : 0;
      }
      newList.push({
        key,
        value: finalValue,
        type,
        isFixed: false,
      });
    }
  });
  list.value = newList;
}

function stableStringify(obj: any): string {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }
  const keys = Object.keys(obj).sort();
  const sortedObj: Record<string, any> = {};
  keys.forEach((key) => {
    const val = obj[key];
    if (typeof val === 'object' && val !== null) {
      sortedObj[key] = Array.isArray(val)
        ? val
        : JSON.parse(stableStringify(val));
    } else {
      sortedObj[key] = val;
    }
  });
  return JSON.stringify(sortedObj);
}

watch(
  () => [props.value, props.fixedOptions],
  () => {
    if (list.value.length === 0) {
      initList();
      return;
    }
    const currentVal = convertListToValue(list.value);
    if (stableStringify(currentVal) !== stableStringify(props.value || {})) {
      initList();
    }
  },
  { immediate: true, deep: true },
);

function emitChange() {
  const result = convertListToValue(list.value);
  emit('update:value', result);
  emit('change', result);
}

function handleTypeChange(item: OptionItem) {
  item.value = convertValueOnTypeChange(item.value, item.type);
  emitChange();
}

function handleValueChange() {
  emitChange();
}

function handleAdd() {
  list.value.push({
    key: '',
    value: '',
    type: 'string',
    isFixed: false,
  });
  emitChange();
}

function handleRemove(index: number) {
  list.value.splice(index, 1);
  emitChange();
}

function openJsonModal(item: OptionItem) {
  currentEditItem.value = item;
  jsonContent.value = JSON.stringify(item.value, null, 2);
  modalApi.open();
}

function handleJsonSave() {
  if (!currentEditItem.value) return;
  try {
    const newVal = JSON.parse(jsonContent.value);
    currentEditItem.value.value = newVal;
    emitChange();
    modalApi.close();
  } catch {
    message.error('Invalid JSON format');
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      <div
        v-for="(item, index) in list"
        :key="index"
        class="group flex items-stretch border-b border-gray-100 last:border-0 hover:bg-gray-50/30"
      >
        <!-- Left: Label Area -->
        <div
          class="flex w-[200px] shrink-0 flex-col justify-center border-r border-gray-100 bg-gray-50/50 px-4 py-3"
        >
          <template v-if="item.isFixed">
            <span
              class="text-sm font-medium text-gray-700"
              :title="item.description"
            >
              {{ item.description || item.key }}
            </span>
            <span class="font-mono text-xs text-gray-400">
              {{ item.key }}
            </span>
          </template>
          <template v-else>
            <Input
              v-model:value="item.key"
              class="w-full"
              placeholder="Key"
              size="small"
              @change="handleValueChange"
            />
          </template>
        </div>

        <!-- Right: Control Area -->
        <div class="flex flex-1 items-center gap-3 px-4 py-2">
          <!-- Type Selector (Subtle) -->
          <Select
            v-model:value="item.type"
            :disabled="item.isFixed"
            :options="typeOptions"
            class="w-24 shrink-0"
            size="small"
            variant="borderless"
            @change="() => handleTypeChange(item)"
          />

          <!-- Value Input -->
          <div class="min-w-0 flex-1">
            <template v-if="item.type === 'boolean'">
              <Select
                v-model:value="item.value"
                :options="booleanOptions"
                class="w-full"
                size="small"
                @change="handleValueChange"
              />
            </template>
            <template v-else-if="item.type === 'number'">
              <InputNumber
                v-model:value="item.value"
                class="w-full"
                placeholder="Value"
                size="small"
                @change="handleValueChange"
              />
            </template>
            <template v-else-if="item.type === 'json'">
              <Button block size="small" @click="openJsonModal(item)">
                <template #icon><EditIcon class="size-4" /></template>
                Edit JSON
              </Button>
            </template>
            <template v-else>
              <Input
                v-model:value="item.value"
                placeholder="Value"
                size="small"
                @change="handleValueChange"
              />
            </template>
          </div>

          <!-- Delete Action -->
          <div class="w-8 shrink-0 text-right">
            <Button
              v-if="!item.isFixed"
              danger
              size="small"
              type="text"
              @click="handleRemove(index)"
            >
              <DeleteIcon class="size-4 opacity-70 hover:opacity-100" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <Button block type="dashed" @click="handleAdd">
      <PlusIcon class="mr-1 size-4" /> {{ $t('common.add') }}
    </Button>

    <JsonModal>
      <div class="h-[400px] w-full border border-gray-200">
        <YlMonacoEditor v-model:model-value="jsonContent" language="json" />
      </div>
    </JsonModal>
  </div>
</template>
