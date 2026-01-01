<script setup lang="ts">
import type {
  AfterChangeContext,
  AfterChangeFn,
  BeforeChangeContext,
  BeforeChangeFn,
  ThingModelChangeAction,
} from './types';

import type { VxeGridProps, VxeTableDefines } from '#/adapter/vxe-table';
import type { DataType, DataTypeDef } from '#/types/data-type';
import type { DeviceEventMetadata, DeviceMetadata } from '#/types/metadata';

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
  Select,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTypeDefinitionComponent } from '#/components/yl-data-type-strategies/type-definition';
// import ObjectDefinition from '#/components/yl-data-type-strategies/type-definition/ObjectDefinition.vue'; // No longer needed
import MonacoEditor from '#/components/yl-monaco-editor/index.vue';
import { DATA_TYPE_OPTIONS } from '#/enums/data-type';

import EventTypeConfig from './components/EventTypeConfig.vue';
import { createBaseGridOptions, isInherited } from './helper';

const props = withDefaults(
  defineProps<{
    afterChange?: AfterChangeFn;
    beforeChange?: BeforeChangeFn;
    disabled?: boolean;
    value: DeviceMetadata;
  }>(),
  {
    afterChange: undefined,
    beforeChange: undefined,
  },
);

const emit = defineEmits(['update:value', 'change']);

// ...

async function runBeforeChange(
  action: ThingModelChangeAction,
  records?: any,
  val?: any,
  type: 'events' = 'events',
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

async function runAfterChange(
  action: ThingModelChangeAction,
  oldMetadata: DeviceMetadata,
  newMetadata: DeviceMetadata,
  records?: any,
  val?: any,
  type: 'events' = 'events',
) {
  if (!props.afterChange) return true;
  const context: AfterChangeContext = {
    type,
    action,
    records,
    value: val,
    oldMetadata,
    newMetadata,
  };
  try {
    const result = await props.afterChange(context);
    // If explicitly returns false, treat as failure
    return result !== false;
  } catch (error) {
    console.error(error);
    return false;
  }
}

const PlusOutlined = createIconifyIcon('ant-design:plus-outlined');
const SettingOutlined = createIconifyIcon('ant-design:setting-outlined'); // Re-add for config button
const SaveOutlined = createIconifyIcon('ant-design:save-outlined');
const SearchOutlined = createIconifyIcon('ant-design:search-outlined');
const EyeOutlined = createIconifyIcon('ant-design:eye-outlined');
const CopyOutlined = createIconifyIcon('ant-design:copy-outlined');
const CodeOutlined = createIconifyIcon('ant-design:code-outlined');
const DeleteOutlined = createIconifyIcon('ant-design:delete-outlined');

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
      const newEvents = JSON.parse(jsonEditorValue.value);
      if (!Array.isArray(newEvents)) {
        message.error($t('thingModel.common.jsonArrayError'));
        return;
      }
      const oldMetadata = cloneDeep(props.value);
      if (!(await runBeforeChange('import', undefined, newEvents))) return;

      const newMetadata = { ...props.value, events: newEvents };
      emit('update:value', newMetadata);
      emit('change', 'events', newMetadata);

      if (
        await runAfterChange(
          'import',
          oldMetadata,
          newMetadata,
          undefined,
          newEvents,
          'events',
        )
      ) {
        message.success($t('thingModel.common.success'));
        jsonEditModalApi.close();
      } else {
        emit('update:value', oldMetadata);
        emit('change', 'events', oldMetadata);
      }
    } catch {
      message.error($t('thingModel.common.jsonParseError'));
    }
  },
});

function openJsonEditor() {
  jsonEditorValue.value = JSON.stringify(props.value.events || [], null, 2);
  jsonEditModalApi.open();
}

const wrapperStyle = computed(() => {
  // Calculate available height: Root Height only (no tabs)
  const h = rootHeight.value;
  return {
    height: `${Math.max(h, 0)}px`,
  };
});

// State
const searchText = ref('');
const duplicateIds = ref<Set<string>>(new Set());
const hasTableChanges = ref(false);

const currentConfigRow = ref<DeviceEventMetadata | null>(null); // Re-introduce for output config
const tempConfigValue = ref<DataTypeDef | null>(null); // Re-introduce for output config

const [PreviewModal, previewModalApi] = useVbenModal({
  title: $t('thingModel.common.preview'),
  footer: false,
  class: 'w-3/5 h-[600px] flex flex-col',
  draggable: true,
});

const { copy } = useClipboard();

function handleCopy() {
  copy(JSON.stringify(props.value.events || [], null, 2));
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

// Config Modal for Output Type (re-introducing this, from PropertyEditor)
const [ConfigModal, modalApi] = useVbenModal({
  title: $t('thingModel.common.config'), // Common config title
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

function openConfig(row: DeviceEventMetadata) {
  currentConfigRow.value = row;
  tempConfigValue.value = cloneDeep(row.output); // output is ObjectDef which is a DataTypeDef
  modalApi.setData({ row, column: null });
  modalApi.open();
}

function hasConfig(type: string) {
  return !!getTypeDefinitionComponent(type as DataType);
}

// Validator (remains the same)
const validUniqueId: VxeTableDefines.ValidatorRule<DeviceEventMetadata>['validator'] =
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
const gridOptions = computed<VxeGridProps<DeviceEventMetadata>>(() => {
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
        field: 'eventType',
        title: $t('thingModel.event.type'),
        editRender: {},
        slots: { edit: 'type_edit', default: 'type_default' },
        minWidth: 200,
      },
      {
        field: 'output',
        title: $t('thingModel.function.outputType'), // Reused outputType from function
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
  let data = props.value.events || [];
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
  [() => props.value.events, searchText],
  () => {
    gridApi.setGridOptions({ data: filterData() });
    hasTableChanges.value = false;
  },
  { deep: true },
);

// Actions
async function addRow() {
  const oldMetadata = cloneDeep(props.value);
  if (!(await runBeforeChange('add'))) return;
  const newRow: Partial<DeviceEventMetadata> = {
    id: `event_${Date.now()}`,
    name: '',
    output: { type: 'STRING' }, // Initialize as basic DataTypeDef
    eventType: { type: 'SIMPLE' },
    expands: {},
  };
  const { row } = await gridApi.grid.insertAt(newRow, -1);
  if (row) {
    gridApi.grid.setEditRow(row);
  }
  checkChanges();

  const { fullData } = gridApi.grid.getTableData();
  const newMetadata = { ...props.value, events: fullData };

  if (!(await runAfterChange('add', oldMetadata, newMetadata)) && row) {
    gridApi.grid.remove(row);
    checkChanges();
  }
}

function removeRow(row: DeviceEventMetadata) {
  Modal.confirm({
    title: $t('common.confirmDelete'),
    content: $t('common.confirmDeleteMsg'),
    onOk: async () => {
      const oldMetadata = cloneDeep(props.value);
      if (!(await runBeforeChange('delete', row))) return;
      gridApi.grid.remove(row);
      const newMetadata = syncData();

      if (await runAfterChange('delete', oldMetadata, newMetadata, row)) {
        message.success($t('common.deleteSuccess'));
      } else {
        emit('update:value', oldMetadata);
        emit('change', 'events', oldMetadata);
      }
    },
  });
}

function copyRow(row: DeviceEventMetadata) {
  const newRow = cloneDeep(row);
  newRow.id = `${newRow.id}_copy`;
  newRow._ROW_KEY = undefined;
  newRow._X_ROW_KEY = undefined;

  // Clear inheritance on copy
  if (newRow.expands) {
    newRow.expands.inheritedProduct = undefined;
  }

  const { fullData } = gridApi.grid.getTableData();
  const idx = fullData.indexOf(row);

  let targetRow: any = -1;
  if (idx !== -1 && idx < fullData.length - 1) {
    targetRow = fullData[idx + 1];
  }

  runBeforeChange('copy', row).then(async (res) => {
    const oldMetadata = cloneDeep(props.value);
    if (!res) return;
    const { row: insertedRow } = await gridApi.grid.insertAt(newRow, targetRow);
    gridApi.grid.setEditRow(insertedRow);
    checkChanges();

    const { fullData } = gridApi.grid.getTableData();
    const newMetadata = { ...props.value, events: fullData };

    if (!(await runAfterChange('copy', oldMetadata, newMetadata, row))) {
      gridApi.grid.remove(insertedRow);
      checkChanges();
    }
  });
}

function hasEditStatus(row: DeviceEventMetadata) {
  return gridApi.grid?.isEditByRow(row);
}

function isRowModified(row: DeviceEventMetadata) {
  return gridApi.grid?.isUpdateByRow(row) || gridApi.grid?.isInsertByRow(row);
}

function editRowEvent(row: DeviceEventMetadata) {
  gridApi.grid?.setEditRow(row);
}

async function saveRowEvent(row: DeviceEventMetadata) {
  const oldMetadata = cloneDeep(props.value);
  const err = await gridApi.grid.validate(row);
  if (err) return;
  if (!(await runBeforeChange('update', row))) return;
  gridApi.grid.clearEdit();
  const newMetadata = syncData();

  if (await runAfterChange('update', oldMetadata, newMetadata, row)) {
    message.success(
      `${$t('thingModel.common.save')} ${$t('thingModel.common.success')}`,
    );
  } else {
    emit('update:value', oldMetadata);
    emit('change', 'events', oldMetadata);
  }
}

function cancelRowEvent(row: DeviceEventMetadata) {
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
      const oldMetadata = cloneDeep(props.value);
      if (!(await runBeforeChange('batch-delete', records))) return;
      gridApi.grid.remove(records);
      const newMetadata = syncData();

      if (
        await runAfterChange('batch-delete', oldMetadata, newMetadata, records)
      ) {
        message.success($t('common.deleteSuccess'));
      } else {
        emit('update:value', oldMetadata);
        emit('change', 'events', oldMetadata);
      }
    },
  });
}

// Global Save
async function handleGlobalSave() {
  const oldMetadata = cloneDeep(props.value);
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

  const newMetadata = syncData();

  if (
    allChanges.length > 0 &&
    !(await runAfterChange('update', oldMetadata, newMetadata, allChanges))
  ) {
    emit('update:value', oldMetadata);
    emit('change', 'events', oldMetadata);
  } else {
    message.success(
      `${$t('thingModel.common.save')} ${$t('thingModel.common.success')}`,
    );
    hasTableChanges.value = false;
  }
}

function syncData() {
  const { fullData } = gridApi.grid.getTableData();
  const allEvents = [...(props.value.events || [])];

  let newEvents: DeviceEventMetadata[] = [];

  if (searchText.value) {
    const lowerSearch = searchText.value.toLowerCase();
    const processedIds = new Set<string>();
    const fullDataMap = new Map(fullData.map((i) => [i.id, i]));

    allEvents.forEach((originalItem) => {
      const matchesSearch =
        !searchText.value ||
        originalItem.name?.toLowerCase().includes(lowerSearch) ||
        originalItem.id?.toLowerCase().includes(lowerSearch);

      if (matchesSearch) {
        if (fullDataMap.has(originalItem.id)) {
          newEvents.push(
            fullDataMap.get(originalItem.id) as DeviceEventMetadata,
          );
          processedIds.add(originalItem.id);
        }
      } else {
        newEvents.push(originalItem);
      }
    });

    fullData.forEach((item) => {
      if (!processedIds.has(item.id)) {
        newEvents.push(item as DeviceEventMetadata);
      }
    });
  } else {
    newEvents = fullData as DeviceEventMetadata[];
  }

  const newMetadata = { ...props.value, events: newEvents };
  emit('update:value', newMetadata);
  emit('change', 'events', newMetadata);
  checkChanges(); // Explicitly re-check changes and update duplicate status
  return newMetadata;
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
          :model-value="JSON.stringify(value.events || [], null, 2)"
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

        <!-- Type Edit -->
        <template #type_edit="{ row }">
          <EventTypeConfig v-model:value="row.eventType" :disabled="disabled" />
        </template>
        <template #type_default="{ row }">
          <Tag v-if="row.eventType.type === 'ALARM'" color="orange">
            {{ $t('thingModel.event.typeWarn') }}
            <span v-if="row.eventType.alarmLevel">
              :
              {{
                $t(
                  `thingModel.event.type${row.eventType.alarmLevel.charAt(0).toUpperCase() + row.eventType.alarmLevel.slice(1)}`,
                ) || row.eventType.alarmLevel
              }}
            </span>
          </Tag>
          <Tag v-else color="blue">{{ $t('thingModel.event.typeInfo') }}</Tag>
        </template>

        <!-- Output Type -->
        <template #output_edit="{ row }">
          <div class="flex items-center gap-1">
            <Select
              v-model:value="row.output.type"
              :options="DATA_TYPE_OPTIONS"
              class="!h-8 flex-1"
              :placeholder="`${$t('thingModel.common.pleaseEnter')}${$t('thingModel.event.output')}`"
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
              :disabled="disabled || isInherited(row)"
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
              :disabled="disabled || isInherited(row)"
            >
              {{ $t('thingModel.common.delete') }}
            </Button>
          </template>
        </template>
      </Grid>
    </div>
  </div>
</template>
