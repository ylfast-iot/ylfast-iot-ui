<script setup lang="ts">
import type {
  BeforeChangeContext,
  BeforeChangeFn,
  ThingModelChangeAction,
} from './types';

import type { VxeGridProps, VxeTableDefines } from '#/adapter/vxe-table';
import type { DataType, DataTypeDef, ObjectDef } from '#/types/data-type';
import type { DeviceMetadata, FunctionMetadata } from '#/types/metadata';

import { computed, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { cloneDeep } from '@vben/utils';

import { useClipboard, useElementSize } from '@vueuse/core';
import {
  Button,
  Input,
  message,
  Modal,
  Select, // Re-adding Select for DataType selection
  Switch,
  Tooltip,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTypeDefinitionComponent } from '#/components/yl-data-type-strategies/type-definition'; // Re-adding for dynamic component loading
import ObjectDefinition from '#/components/yl-data-type-strategies/type-definition/ObjectDefinition.vue';
import MonacoEditor from '#/components/yl-monaco-editor/index.vue';
import { DATA_TYPE_OPTIONS } from '#/enums/data-type'; // Re-adding for DataType options

import { createBaseGridOptions } from './helper';

const props = withDefaults(
  defineProps<{
    beforeChange?: BeforeChangeFn;
    disabled?: boolean;
    value: DeviceMetadata;
  }>(),
  {
    beforeChange: undefined,
  },
);

const emit = defineEmits(['update:value', 'change']);

// ...

async function runBeforeChange(
  action: ThingModelChangeAction,
  records?: any,
  val?: any,
  type: 'functions' = 'functions',
) {
  if (!props.beforeChange) return true;
  const context: BeforeChangeContext = {
    type,
    action,
    records,
    value: val,
  };
  try {
    return await props.beforeChange(context);
  } catch (error) {
    console.error(error);
    return false;
  }
}

const PlusOutlined = createIconifyIcon('ant-design:plus-outlined');
const SettingOutlined = createIconifyIcon('ant-design:setting-outlined'); // Re-adding for config button
const SaveOutlined = createIconifyIcon('ant-design:save-outlined');
const SearchOutlined = createIconifyIcon('ant-design:search-outlined');
const EyeOutlined = createIconifyIcon('ant-design:eye-outlined');
const CopyOutlined = createIconifyIcon('ant-design:copy-outlined');
const CodeOutlined = createIconifyIcon('ant-design:code-outlined');
const DeleteOutlined = createIconifyIcon('ant-design:delete-outlined');
const FormOutlined = createIconifyIcon('ant-design:form-outlined');

const rootEl = ref<HTMLDivElement | null>(null);

const { height: rootHeight } = useElementSize(rootEl);

// ...

// JSON Edit Modal
const jsonEditorValue = ref('');
const [JsonEditModal, jsonEditModalApi] = useVbenModal({
  title: $t('thingModel.common.editJson'),
  draggable: true,
  class: 'w-3/5 h-[600px] flex flex-col',
  onConfirm: async () => {
    try {
      const newFunctions = JSON.parse(jsonEditorValue.value);
      if (!Array.isArray(newFunctions)) {
        message.error($t('thingModel.common.jsonArrayError'));
        return;
      }
      if (!(await runBeforeChange('import', undefined, newFunctions))) return;

      emit('update:value', { ...props.value, functions: newFunctions });
      emit('change', 'functions', { ...props.value, functions: newFunctions });
      message.success($t('thingModel.common.success'));
      jsonEditModalApi.close();
    } catch {
      message.error($t('thingModel.common.jsonParseError'));
    }
  },
});

function openJsonEditor() {
  jsonEditorValue.value = JSON.stringify(props.value.functions || [], null, 2);
  jsonEditModalApi.open();
}

const wrapperStyle = computed(() => {
  const h = rootHeight.value;
  return {
    height: `${Math.max(h, 0)}px`,
  };
});

// State
const searchText = ref('');
const currentInputParamsRow = ref<FunctionMetadata | null>(null);
const tempInputParams = ref<ObjectDef>({ type: 'OBJECT', object: [] });

const currentConfigRow = ref<FunctionMetadata | null>(null); // Re-introduce for output config
const tempConfigValue = ref<DataTypeDef | null>(null); // Re-introduce for output config

const duplicateIds = ref<Set<string>>(new Set());
const hasTableChanges = ref(false);

const [PreviewModal, previewModalApi] = useVbenModal({
  title: $t('thingModel.common.preview'),
  footer: false,
  class: 'w-3/5 h-[600px] flex flex-col',
  draggable: true,
});

const { copy } = useClipboard();

function handleCopy() {
  copy(JSON.stringify(props.value.functions || [], null, 2));
  message.success($t('thingModel.common.success'));
}

function openPreview() {
  previewModalApi.open();
}

function checkChanges() {
  if (!gridApi.grid) return;
  const { insertRecords, removeRecords, updateRecords } =
    gridApi.grid.getRecordset();
  hasTableChanges.value =
    insertRecords.length > 0 ||
    removeRecords.length > 0 ||
    updateRecords.length > 0;
  updateDuplicateStatus();
}

// Input Params Modal (remains the same)
const [InputParamsModal, inputParamsModalApi] = useVbenModal({
  title: $t('thingModel.function.inputs'),
  class: 'w-4/5',
  draggable: true,
  onConfirm: () => {
    const { column } = inputParamsModalApi.getData();
    if (currentInputParamsRow.value) {
      currentInputParamsRow.value.inputParams = tempInputParams.value.object;
      gridApi.grid?.updateStatus({
        row: currentInputParamsRow.value,
        column,
      });
      checkChanges();
      inputParamsModalApi.close();
    }
  },
});

function openInputParams(row: FunctionMetadata) {
  currentInputParamsRow.value = row;
  // @ts-ignore
  tempInputParams.value = {
    type: 'OBJECT',
    object: cloneDeep(row.inputParams || []),
  };
  inputParamsModalApi.setData({ row, column: null });
  inputParamsModalApi.open();
}

// Config Modal for Output Type (re-introducing this)
const [ConfigModal, modalApi] = useVbenModal({
  title: $t('thingModel.function.outputType'),
  draggable: true,
  destroyOnClose: false,
  class: 'w-3/5',
  closeOnClickModal: false,
  onConfirm: () => {
    const { column } = modalApi.getData();
    if (currentConfigRow.value && tempConfigValue.value) {
      currentConfigRow.value.output = {
        ...currentConfigRow.value.output,
        ...tempConfigValue.value,
      };
      // Force VxeTable to detect the change
      gridApi.grid?.updateStatus({
        row: currentConfigRow.value,
        column,
      });
      checkChanges();
      modalApi.close();
    }
  },
});

function openConfig(row: FunctionMetadata) {
  currentConfigRow.value = row;
  tempConfigValue.value = cloneDeep(row.output);
  modalApi.setData({ row, column: null });
  modalApi.open();
}

function hasConfig(type: string) {
  return !!getTypeDefinitionComponent(type as DataType);
}

// Validator (remains the same)
const validUniqueId: VxeTableDefines.ValidatorRule<FunctionMetadata>['validator'] =
  ({ cellValue }) => {
    const { fullData } = gridApi.grid.getTableData();
    const count = fullData.filter((item) => item.id === cellValue).length;
    if (count > 1) {
      return new Error($t('thingModel.common.uniqueIdError'));
    }
  };

function updateDuplicateStatus() {
  const { fullData } = gridApi.grid.getTableData();
  const idCounts = new Map<string, number>();

  fullData.forEach((row) => {
    if (row.id) {
      idCounts.set(row.id, (idCounts.get(row.id) || 0) + 1);
    }
  });

  const newDuplicates = new Set<string>();
  idCounts.forEach((count, id) => {
    if (count > 1) {
      newDuplicates.add(id);
    }
  });

  duplicateIds.value = newDuplicates;
}

// Grid Options
const gridOptions = computed<VxeGridProps<FunctionMetadata>>(() => {
  return {
    ...createBaseGridOptions(props),
    cellClassName: ({ row, column }) => {
      if (column.field === 'id' && duplicateIds.value.has(row.id)) {
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      }
      return null;
    },
    editRules: {
      id: [
        { required: true, content: $t('thingModel.common.required') },
        { validator: validUniqueId, trigger: 'change' },
      ],
      name: [{ required: true, content: $t('thingModel.common.required') }],
      output: [{ required: true, content: $t('thingModel.common.required') }], // Output is now DataTypeDef, so required check makes sense
    },
    columns: [
      { type: 'checkbox', width: 50, fixed: 'left' },
      {
        field: 'id',
        title: $t('thingModel.common.id'),
        editRender: {
          name: 'AInput',
          props: {
            placeholder: `${$t('thingModel.common.pleaseEnter')}${$t('thingModel.common.id')}`,
            disabled: props.disabled,
          },
        },
        minWidth: 150,
      },
      {
        field: 'name',
        title: $t('thingModel.common.name'),
        editRender: {
          name: 'AInput',
          props: {
            placeholder: `${$t('thingModel.common.pleaseEnter')}${$t('thingModel.common.name')}`,
            disabled: props.disabled,
          },
        },
        minWidth: 160,
      },
      {
        field: 'async',
        title: $t('thingModel.function.async'),
        editRender: {},
        slots: { edit: 'async_edit', default: 'async_default' },
        width: 100,
      },
      {
        field: 'inputParams',
        title: $t('thingModel.function.inputs'),
        editRender: {},
        slots: { default: 'inputs_default', edit: 'inputs_edit' },
        minWidth: 160,
      },
      {
        field: 'output',
        title: $t('thingModel.function.outputType'),
        editRender: {}, // Re-add editRender for Select
        slots: { edit: 'output_edit', default: 'output_default' }, // Re-add output_edit slot
        minWidth: 200, // Make wider for Select+Button
      },
      {
        title: $t('thingModel.common.action'),
        width: 180,
        fixed: 'right',
        slots: { default: 'action' },
      },
    ],
    // Initial data is filtered by search
    data: filterData(),
  };
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: gridOptions.value,
  gridEvents: {
    editClosed: () => checkChanges(),
  },
});

function filterData() {
  let data = props.value.functions || [];
  // Filter by Search
  if (searchText.value) {
    const lower = searchText.value.toLowerCase();
    data = data.filter(
      (item) =>
        item.name?.toLowerCase().includes(lower) ||
        item.id?.toLowerCase().includes(lower),
    );
  }
  return data;
}

// Watchers
watch(
  () => props.disabled,
  () => {
    gridApi.setGridOptions(gridOptions.value);
  },
);

watch(
  [() => props.value.functions, searchText],
  () => {
    gridApi.setGridOptions({ data: filterData() });
    hasTableChanges.value = false;
  },
  { deep: true },
);

// Actions
async function addRow() {
  if (!(await runBeforeChange('add'))) return;
  const newRow: Partial<FunctionMetadata> = {
    id: ``,
    name: '',
    async: false,
    inputParams: [],
    output: { type: 'STRING' }, // Initialize as basic DataTypeDef
    expands: {},
  };
  const { row } = await gridApi.grid.insertAt(newRow, -1);
  if (row) {
    gridApi.grid.setEditRow(row);
  }
  checkChanges();
}

function removeRow(row: FunctionMetadata) {
  Modal.confirm({
    title: $t('common.confirmDelete'),
    content: $t('common.confirmDeleteMsg'),
    onOk: async () => {
      if (!(await runBeforeChange('delete', row))) return;
      gridApi.grid.remove(row);
      syncData(); // Immediate sync on delete
      message.success($t('common.deleteSuccess'));
    },
  });
}

function copyRow(row: FunctionMetadata) {
  const newRow = cloneDeep(row);
  newRow.id = `${newRow.id}_copy`;
  newRow._ROW_KEY = undefined;
  newRow._X_ROW_KEY = undefined;

  const { fullData } = gridApi.grid.getTableData();
  const idx = fullData.indexOf(row);

  let targetRow: any = -1;
  if (idx !== -1 && idx < fullData.length - 1) {
    targetRow = fullData[idx + 1];
  }

  runBeforeChange('copy', row).then((res) => {
    if (!res) return;
    gridApi.grid.insertAt(newRow, targetRow).then(({ row: insertedRow }) => {
      gridApi.grid.setEditRow(insertedRow);
      checkChanges();
    });
  });
}

function hasEditStatus(row: FunctionMetadata) {
  return gridApi.grid?.isEditByRow(row);
}

function isRowModified(row: FunctionMetadata) {
  return gridApi.grid?.isUpdateByRow(row) || gridApi.grid?.isInsertByRow(row);
}

function editRowEvent(row: FunctionMetadata) {
  gridApi.grid?.setEditRow(row);
}

async function saveRowEvent(row: FunctionMetadata) {
  const err = await gridApi.grid.validate(row);
  if (err) return;
  if (!(await runBeforeChange('update', row))) return;
  gridApi.grid.clearEdit();
  syncData(); // Immediate sync on row save
  message.success(
    `${$t('thingModel.common.save')} ${$t('thingModel.common.success')}`,
  );
}

function cancelRowEvent(row: FunctionMetadata) {
  gridApi.grid.clearEdit();
  gridApi.grid.revertData(row);
  checkChanges();
}

// Batch Delete
function handleBatchDelete() {
  const records = gridApi.grid?.getCheckboxRecords();
  if (!records || records.length === 0) {
    message.warning($t('common.tips.selectData'));
    return;
  }
  Modal.confirm({
    title: $t('common.confirmDelete'),
    content: $t('common.confirmDeleteMsg'),
    onOk: async () => {
      if (!(await runBeforeChange('batch-delete', records))) return;
      gridApi.grid.remove(records);
      syncData();
      message.success($t('common.deleteSuccess'));
    },
  });
}

// Global Save
async function handleGlobalSave() {
  const err = await gridApi.grid.validate(true);
  if (err) {
    message.error($t('thingModel.common.validationFailed'));
    return;
  }
  const { insertRecords, removeRecords, updateRecords } =
    gridApi.grid.getRecordset();
  const allChanges = [...insertRecords, ...removeRecords, ...updateRecords];
  if (allChanges.length > 0 && !(await runBeforeChange('update', allChanges)))
    return;

  syncData();
  message.success(
    `${$t('thingModel.common.save')} ${$t('thingModel.common.success')}`,
  );
  hasTableChanges.value = false;
}

function syncData() {
  const { fullData } = gridApi.grid.getTableData();
  const allFunctions = [...(props.value.functions || [])];

  let newFunctions: FunctionMetadata[] = [];

  if (searchText.value) {
    const lowerSearch = searchText.value.toLowerCase();
    const processedIds = new Set<string>();
    const fullDataMap = new Map(fullData.map((i) => [i.id, i]));

    allFunctions.forEach((originalItem) => {
      const matchesSearch =
        !searchText.value ||
        originalItem.name?.toLowerCase().includes(lowerSearch) ||
        originalItem.id?.toLowerCase().includes(lowerSearch);

      if (matchesSearch) {
        if (fullDataMap.has(originalItem.id)) {
          newFunctions.push(
            fullDataMap.get(originalItem.id) as FunctionMetadata,
          );
          processedIds.add(originalItem.id);
        }
      } else {
        newFunctions.push(originalItem);
      }
    });

    fullData.forEach((item) => {
      if (!processedIds.has(item.id)) {
        newFunctions.push(item as FunctionMetadata);
      }
    });
  } else {
    newFunctions = fullData as FunctionMetadata[];
  }

  emit('update:value', { ...props.value, functions: newFunctions });
  emit('change', 'functions', { ...props.value, functions: newFunctions });
  checkChanges(); // Explicitly re-check changes and update duplicate status
}

// Formatter for input parameters display
function formatInputParams({ row }: { row: FunctionMetadata }) {
  const params = row.inputParams || [];
  if (params.length === 0) {
    return '()';
  }
  const formatted = params
    .map((p) => `${p.name}:${$t(`dataType.types.${p.valueType.type}`)}`)
    .join(', ');
  return `(${formatted})`;
}
</script>

<template>
  <div ref="rootEl" class="flex h-full flex-col">
    <!-- Config Modal for Output Type (re-introducing this) -->
    <ConfigModal>
      <div v-if="currentConfigRow && tempConfigValue" class="p-4">
        <component
          :is="getTypeDefinitionComponent(tempConfigValue.type)"
          v-model:value="tempConfigValue"
        />
      </div>
    </ConfigModal>

    <JsonEditModal>
      <div class="h-full overflow-hidden">
        <MonacoEditor v-model:model-value="jsonEditorValue" language="json" />
      </div>
    </JsonEditModal>

    <!-- Input Params Modal (remains the same) -->
    <InputParamsModal>
      <ObjectDefinition v-model:value="tempInputParams" :disabled="disabled" />
    </InputParamsModal>

    <!-- Preview Modal -->
    <PreviewModal>
      <template #title>
        <span>{{ $t('thingModel.common.preview') }}</span>
        <Tooltip :title="$t('thingModel.common.copy')">
          <div
            class="absolute right-16 top-3 flex size-6 cursor-pointer items-center justify-center rounded-full px-1 text-lg text-foreground/80 opacity-70 transition-opacity hover:bg-accent hover:text-accent-foreground hover:opacity-100"
            @click="handleCopy"
          >
            <CopyOutlined class="size-4" />
          </div>
        </Tooltip>
      </template>
      <div class="h-full overflow-hidden">
        <MonacoEditor
          :model-value="JSON.stringify(value.functions || [], null, 2)"
          language="json"
          :read-only="true"
        />
      </div>
    </PreviewModal>

    <!-- Grid Area -->
    <div :style="wrapperStyle" class="overflow-hidden">
      <Grid>
        <template #toolbar_buttons>
          <div class="flex w-full items-center justify-between">
            <Input
              v-model:value="searchText"
              :placeholder="$t('thingModel.common.searchPlaceholder')"
              class="w-64"
              allow-clear
            >
              <template #prefix><SearchOutlined /></template>
            </Input>
            <div class="flex gap-2">
              <Tooltip :title="$t('thingModel.common.preview')">
                <div
                  class="flex size-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                  @click="openPreview"
                >
                  <EyeOutlined />
                </div>
              </Tooltip>
              <Tooltip :title="$t('thingModel.common.editJson')">
                <div
                  class="flex size-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                  :class="{ 'pointer-events-none opacity-50': disabled }"
                  @click="!disabled && openJsonEditor()"
                >
                  <CodeOutlined />
                </div>
              </Tooltip>
              <Tooltip :title="$t('thingModel.common.add')">
                <div
                  class="flex size-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                  :class="{ 'pointer-events-none opacity-50': disabled }"
                  @click="!disabled && addRow()"
                >
                  <PlusOutlined />
                </div>
              </Tooltip>
              <Tooltip :title="$t('common.action.batchDelete')">
                <div
                  class="flex size-7 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-500"
                  :class="{ 'pointer-events-none opacity-50': disabled }"
                  @click="!disabled && handleBatchDelete()"
                >
                  <DeleteOutlined />
                </div>
              </Tooltip>
              <Tooltip :title="$t('thingModel.common.save')">
                <div
                  class="flex size-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                  :class="{
                    'pointer-events-none opacity-50':
                      disabled || !hasTableChanges,
                  }"
                  @click="!disabled && hasTableChanges && handleGlobalSave()"
                >
                  <SaveOutlined />
                </div>
              </Tooltip>
            </div>
          </div>
        </template>

        <!-- Async Edit -->
        <template #async_edit="{ row }">
          <Switch v-model:checked="row.async" />
        </template>
        <template #async_default="{ row }">
          {{
            row.async ? $t('thingModel.common.yes') : $t('thingModel.common.no')
          }}
        </template>

        <!-- Input Params Default (Formatted Text) -->

        <template #inputs_default="{ row }">
          {{ formatInputParams({ row }) }}
        </template>

        <!-- Input Params Edit (Button) -->

        <template #inputs_edit="{ row }">
          <Button
            size="small"
            @click="openInputParams(row)"
            :disabled="disabled"
          >
            <template #icon><FormOutlined /></template>
            {{ $t('thingModel.function.configInputs') }}
          </Button>
        </template>

        <!-- Output Type Edit (re-introducing this) -->

        <template #output_edit="{ row }">
          <div class="flex items-center gap-1">
            <Select
              v-model:value="row.output.type"
              :options="DATA_TYPE_OPTIONS"
              class="!h-8 flex-1"
              :placeholder="`${$t('thingModel.common.pleaseEnter')}${$t('thingModel.function.outputType')}`"
              :disabled="disabled"
            />
            <div
              v-if="hasConfig(row.output.type)"
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
              :class="{ 'pointer-events-none opacity-50': disabled }"
              :title="$t('thingModel.common.config')"
              @mousedown.stop
              @click.stop="openConfig(row)"
            >
              <SettingOutlined />
            </div>
          </div>
        </template>

        <template #output_default="{ row }">
          {{ $t(`dataType.types.${row.output.type}`) }}
        </template>

        <!-- Actions -->

        <template #action="{ row }">
          <template v-if="hasEditStatus(row)">
            <Button
              type="link"
              size="small"
              @click="saveRowEvent(row)"
              :disabled="!isRowModified(row)"
            >
              {{ $t('thingModel.common.save') }}
            </Button>

            <Button type="link" size="small" @click="cancelRowEvent(row)">
              {{ $t('thingModel.common.cancel') }}
            </Button>
          </template>
          <template v-else>
            <Button
              type="link"
              size="small"
              @click="editRowEvent(row)"
              :disabled="disabled"
            >
              {{ $t('thingModel.common.edit') }}
            </Button>
            <Button
              type="link"
              size="small"
              @click="copyRow(row)"
              :disabled="disabled"
            >
              {{ $t('thingModel.common.copy') }}
            </Button>
            <Button
              type="link"
              danger
              size="small"
              @click="removeRow(row)"
              :disabled="disabled"
            >
              {{ $t('thingModel.common.delete') }}
            </Button>
          </template>
        </template>
      </Grid>
    </div>
  </div>
</template>
