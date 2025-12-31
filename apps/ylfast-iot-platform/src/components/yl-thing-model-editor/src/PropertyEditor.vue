<script setup lang="ts">
import type {
  BeforeChangeContext,
  BeforeChangeFn,
  ThingModelChangeAction,
} from './types';

import type { VxeGridProps, VxeTableDefines } from '#/adapter/vxe-table';
import type { DataType, DataTypeDef } from '#/types/data-type';
import type { DeviceMetadata, DevicePropertyMetadata } from '#/types/metadata';

import { computed, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { cloneDeep } from '@vben/utils';

import { useClipboard, useElementSize } from '@vueuse/core';
import { Button, Input, message, Modal, Select, Tooltip } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTypeDefinitionComponent } from '#/components/yl-data-type-strategies/type-definition';
import MonacoEditor from '#/components/yl-monaco-editor/index.vue';
import { DATA_TYPE_OPTIONS } from '#/enums/data-type';

import GroupTabs from './components/GroupTabs.vue';
import PropertyExpandConfig from './components/PropertyExpandConfig.vue';
import SourceConfig from './components/SourceConfig.vue';
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
  type: 'expands' | 'properties' = 'properties',
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
const SettingOutlined = createIconifyIcon('ant-design:setting-outlined');
const SaveOutlined = createIconifyIcon('ant-design:save-outlined');
const SearchOutlined = createIconifyIcon('ant-design:search-outlined');
const EyeOutlined = createIconifyIcon('ant-design:eye-outlined');
const CopyOutlined = createIconifyIcon('ant-design:copy-outlined');
const CodeOutlined = createIconifyIcon('ant-design:code-outlined');
const DeleteOutlined = createIconifyIcon('ant-design:delete-outlined');

const rootEl = ref<HTMLDivElement | null>(null);
const tabsEl = ref<HTMLDivElement | null>(null);

// JSON Edit Modal
const jsonEditorValue = ref('');
const [JsonEditModal, jsonEditModalApi] = useVbenModal({
  title: $t('thingModel.common.editJson'),
  draggable: true,
  class: 'w-3/5 h-[600px] flex flex-col',
  onConfirm: async () => {
    try {
      const newProperties = JSON.parse(jsonEditorValue.value);
      if (!Array.isArray(newProperties)) {
        message.error($t('thingModel.common.jsonArrayError'));
        return;
      }
      if (
        !(await runBeforeChange(
          'import',
          undefined,
          newProperties,
          'properties',
        ))
      )
        return;

      emit('update:value', { ...props.value, properties: newProperties });
      emit('change', 'properties', {
        ...props.value,
        properties: newProperties,
      });
      message.success($t('thingModel.common.success'));
      jsonEditModalApi.close();
    } catch {
      message.error($t('thingModel.common.jsonParseError'));
    }
  },
});

function openJsonEditor() {
  jsonEditorValue.value = JSON.stringify(props.value.properties || [], null, 2);
  jsonEditModalApi.open();
}

const { height: rootHeight } = useElementSize(rootEl);
const { height: tabsHeight } = useElementSize(tabsEl);

const wrapperStyle = computed(() => {
  // Calculate available height: Root Height - Tabs Height - Margins (approx 8px for mt-2)
  const h = rootHeight.value - tabsHeight.value - 8;
  return {
    height: `${Math.max(h, 0)}px`,
  };
});

// State
const activeGroup = ref<string>('all');
const searchText = ref('');
const currentConfigRow = ref<DevicePropertyMetadata | null>(null);
const tempConfigValue = ref<DataTypeDef | null>(null);
const currentExpandRow = ref<DevicePropertyMetadata | null>(null);
const tempExpandValue = ref<any>(null); // Type should match PropertyExpands
const duplicateIds = ref<Set<string>>(new Set());
const hasTableChanges = ref(false);

// ...

// Expand Config Modal
const [ExpandModal, expandModalApi] = useVbenModal({
  title: $t('thingModel.property.expands'),
  draggable: true,
  destroyOnClose: false,
  class: 'w-2/5',
  closeOnClickModal: false,
  onConfirm: () => {
    const { column } = expandModalApi.getData();
    if (currentExpandRow.value && tempExpandValue.value) {
      currentExpandRow.value.expands = {
        ...currentExpandRow.value.expands,
        ...tempExpandValue.value,
      };
      gridApi.grid?.updateStatus({
        row: currentExpandRow.value,
        column,
      });
      checkChanges();
      expandModalApi.close();
    }
  },
});

function openExpandConfig(row: DevicePropertyMetadata) {
  currentExpandRow.value = row;
  // Ensure deep copy and default structure
  tempExpandValue.value = cloneDeep(row.expands || {});
  if (!tempExpandValue.value.storageType) {
    tempExpandValue.value.storageType = { ignore: false, 'json-string': false };
  }
  expandModalApi.setData({ row, column: null });
  expandModalApi.open();
}

const [PreviewModal, previewModalApi] = useVbenModal({
  title: $t('thingModel.common.preview'),
  footer: false,
  class: 'w-3/5 h-[600px] flex flex-col',
  draggable: true,
});

const { copy } = useClipboard();

function handleCopy() {
  copy(JSON.stringify(props.value.properties || [], null, 2));
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

// Group Data Helpers
const propertyGroups = computed(
  () => props.value.expands?.propertyGroups || [],
);

async function handleGroupsUpdate(groups: any[]) {
  if (!(await runBeforeChange('update', undefined, undefined, 'expands')))
    return;
  const newVal = {
    ...props.value,
    expands: { ...props.value.expands, propertyGroups: groups },
  };
  emit('update:value', newVal);
  emit('change', 'expands', newVal);
}

// Config Modal Logic
const [ConfigModal, modalApi] = useVbenModal({
  title: $t('thingModel.common.config'),
  draggable: true,
  destroyOnClose: false,
  class: 'w-3/5',
  closeOnClickModal: false,
  onConfirm: () => {
    const { column } = modalApi.getData();
    if (currentConfigRow.value && tempConfigValue.value) {
      currentConfigRow.value.valueType = {
        ...currentConfigRow.value.valueType,
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

function openConfig(row: DevicePropertyMetadata) {
  currentConfigRow.value = row;
  tempConfigValue.value = cloneDeep(row.valueType);
  modalApi.setData({ row, column: null });
  modalApi.open();
}

function hasConfig(type: string) {
  return !!getTypeDefinitionComponent(type as DataType);
}

// Validator
const validUniqueId: VxeTableDefines.ValidatorRule<DevicePropertyMetadata>['validator'] =
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
const gridOptions = computed(() => {
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
      valueType: [
        { required: true, content: $t('thingModel.common.required') },
      ],
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
        field: 'valueType',
        title: $t('thingModel.property.dataType'),
        editRender: {},
        slots: { edit: 'type_edit', default: 'type_default' },
        minWidth: 200,
      },
      {
        field: 'source',
        title: $t('thingModel.property.source'),
        editRender: {},
        slots: { edit: 'source_edit', default: 'source_default' },
        minWidth: 220,
      },
      {
        field: 'expands',
        title: $t('thingModel.property.expands'),
        width: 180,
        slots: { default: 'expands_default' },
      },
      {
        title: $t('thingModel.common.action'),
        width: 180,
        fixed: 'right',
        slots: { default: 'action' },
      },
    ],
    // Initial data is filtered by group + search
    data: filterData(),
  } as VxeGridProps<DevicePropertyMetadata>;
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: gridOptions.value,
  gridEvents: {
    editClosed: () => checkChanges(),
  },
});

function filterData() {
  const rawData = props.value.properties || [];

  let data = rawData.map((property) => {
    // 适配旧版本数据
    if (!property.valueType && property.propertyValueType) {
      property.valueType = property.propertyValueType;
      const { propertyValueType: _propertyValueType, ...rest } = property;
      return {
        ...rest,
      };
    }
    return property;
  });

  // Filter by Group
  if (activeGroup.value !== 'all') {
    data = data.filter((item) => item.expands?.groupId === activeGroup.value);
  }
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
  [() => props.value.properties, activeGroup, searchText],
  () => {
    gridApi.setGridOptions({ data: filterData() });
    hasTableChanges.value = false;
  },
  { deep: true },
);

// Actions
async function addRow() {
  if (!(await runBeforeChange('add'))) return;
  const newRow: Partial<DevicePropertyMetadata> = {
    id: undefined,
    name: undefined,
    valueType: { type: 'STRING' },
    source: { type: 'DEVICE', accessType: ['READ'] },
    expands: {
      groupId: activeGroup.value === 'all' ? undefined : activeGroup.value,
      propertyValueWebDisplay: true,
      storageType: { ignore: false, 'json-string': false },
    },
  };
  const { row } = await gridApi.grid.insertAt(newRow, -1);
  if (row) {
    gridApi.grid.setEditRow(row);
  }
  checkChanges();
}

function removeRow(row: DevicePropertyMetadata) {
  Modal.confirm({
    title: $t('common.confirmDelete'),
    content: $t('common.confirmDeleteMsg'),
    onOk: async () => {
      if (!(await runBeforeChange('delete', row))) return;
      gridApi.grid.remove(row);
      syncData(); // Immediate sync on delete (ObjectDefinition style)
      message.success($t('common.deleteSuccess'));
    },
  });
}

function copyRow(row: DevicePropertyMetadata) {
  const newRow = cloneDeep(row);
  newRow.id = `${newRow.id}_copy`;
  // newRow._ROW_KEY = undefined;
  newRow._X_ROW_KEY = undefined;

  const { fullData } = gridApi.grid.getTableData();
  const idx = fullData.indexOf(row);

  // Insert after the current row
  // insertAt(record, row) inserts *before* the row.
  // To insert after 'row', we insert before 'nextRow'.
  // If 'row' is the last one (or not found), we insert at -1 (end).
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

function hasEditStatus(row: DevicePropertyMetadata) {
  return gridApi.grid?.isEditByRow(row);
}

function isRowModified(row: DevicePropertyMetadata) {
  return gridApi.grid?.isUpdateByRow(row) || gridApi.grid?.isInsertByRow(row);
}

function editRowEvent(row: DevicePropertyMetadata) {
  gridApi.grid?.setEditRow(row);
}

async function saveRowEvent(row: DevicePropertyMetadata) {
  const err = await gridApi.grid.validate(row);
  if (err) return;
  if (!(await runBeforeChange('update', row))) return;
  gridApi.grid.clearEdit();
  syncData(); // Immediate sync on row save
  message.success(
    `${$t('thingModel.common.save')} ${$t('thingModel.common.success')}`,
  );
}

function cancelRowEvent(row: DevicePropertyMetadata) {
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

async function handleGroupIdChange({
  newGroups,
  newId,
  oldId,
}: {
  newGroups?: any[];
  newId: string;
  oldId: string;
}) {
  if (!(await runBeforeChange('update', undefined, undefined, 'expands')))
    return;

  const newProperties = (props.value.properties || []).map((p) => {
    if (p.expands?.groupId === oldId) {
      return { ...p, expands: { ...p.expands, groupId: newId } };
    }
    return p;
  });

  const newValue = {
    ...props.value,
    properties: newProperties,
  };

  if (newGroups) {
    newValue.expands = {
      ...newValue.expands,
      propertyGroups: newGroups,
    };
  }

  emit('update:value', newValue);
  emit('change', 'properties', newValue);
  checkChanges();
}

function syncData() {
  const { fullData } = gridApi.grid.getTableData();
  const allProperties = [...(props.value.properties || [])];

  let newProperties: DevicePropertyMetadata[] = [];

  if (activeGroup.value === 'all' && !searchText.value) {
    newProperties = fullData as DevicePropertyMetadata[];
  } else {
    const lowerSearch = searchText.value.toLowerCase();
    const processedIds = new Set<string>();
    const fullDataMap = new Map(fullData.map((i) => [i.id, i]));

    allProperties.forEach((originalItem) => {
      const matchesGroup =
        activeGroup.value === 'all' ||
        originalItem.expands?.groupId === activeGroup.value;
      const matchesSearch =
        !searchText.value ||
        originalItem.name?.toLowerCase().includes(lowerSearch) ||
        originalItem.id?.toLowerCase().includes(lowerSearch);

      if (matchesGroup && matchesSearch) {
        if (fullDataMap.has(originalItem.id)) {
          newProperties.push(
            fullDataMap.get(originalItem.id) as DevicePropertyMetadata,
          );
          processedIds.add(originalItem.id);
        }
      } else {
        newProperties.push(originalItem);
      }
    });

    fullData.forEach((item) => {
      if (!processedIds.has(item.id)) {
        newProperties.push(item as DevicePropertyMetadata);
      }
    });
  }

  emit('update:value', { ...props.value, properties: newProperties });
  emit('change', 'properties', { ...props.value, properties: newProperties });
  checkChanges(); // Explicitly re-check changes and update duplicate status
}
</script>

<template>
  <div ref="rootEl" class="flex h-full flex-col">
    <ConfigModal>
      <div v-if="tempConfigValue" class="p-4">
        <component
          :is="getTypeDefinitionComponent(tempConfigValue.type)"
          v-model:value="tempConfigValue"
        />
      </div>
    </ConfigModal>

    <ExpandModal>
      <div v-if="tempExpandValue" class="p-4">
        <PropertyExpandConfig
          v-model:value="tempExpandValue"
          :disabled="disabled"
        />
      </div>
    </ExpandModal>

    <JsonEditModal>
      <div class="h-full overflow-hidden">
        <MonacoEditor v-model:model-value="jsonEditorValue" language="json" />
      </div>
    </JsonEditModal>

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
          :model-value="JSON.stringify(value.properties || [], null, 2)"
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
          <div class="flex items-center gap-1">
            <Select
              v-model:value="row.valueType.type"
              :options="DATA_TYPE_OPTIONS"
              class="!h-8 flex-1"
              :placeholder="`${$t('thingModel.common.pleaseEnter')}${$t('thingModel.property.dataType')}`"
              :disabled="disabled"
            />
            <div
              v-if="hasConfig(row.valueType.type)"
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
        <template #type_default="{ row }">
          {{ $t(`dataType.types.${row.valueType.type}`) }}
        </template>

        <!-- Source Edit -->
        <template #source_edit="{ row }">
          <SourceConfig v-model:value="row.source" :disabled="disabled" />
        </template>
        <template #source_default="{ row }">
          <div>
            {{
              row.source.type === 'DEVICE'
                ? $t('thingModel.property.sourceDevice')
                : $t('thingModel.property.sourceRule')
            }}
          </div>
          <div class="text-xs text-gray-500">
            {{ row.source.accessType?.join(', ') }}
          </div>
        </template>

        <!-- Expands -->
        <template #expands_default="{ row }">
          <Button size="small" @click="openExpandConfig(row)">
            <template #icon><SettingOutlined /></template>
            {{ $t('thingModel.common.config') }}
          </Button>
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

    <!-- Bottom Group Tabs -->
    <div ref="tabsEl" class="mt-2 shrink-0">
      <GroupTabs
        v-model:active-group="activeGroup"
        :groups="propertyGroups"
        :disabled="disabled"
        @update:groups="handleGroupsUpdate"
        @group-id-change="handleGroupIdChange"
      />
    </div>
  </div>
</template>
