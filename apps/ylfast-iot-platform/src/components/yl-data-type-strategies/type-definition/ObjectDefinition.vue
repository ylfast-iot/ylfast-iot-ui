<script setup lang="ts">
import type { VxeGridProps, VxeTableDefines } from '#/adapter/vxe-table';
import type {
  DataType,
  DataTypeDef,
  ObjectDef,
  ObjectProperty,
} from '#/types/data-type';

import { computed, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { cloneDeep } from '@vben/utils';

import {
  Button,
  Form,
  FormItem,
  Input,
  message,
  Select,
  Tooltip,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { DATA_TYPE_OPTIONS } from '#/enums/data-type';

import { getTypeDefinitionComponent } from './registry';

const props = defineProps<{
  disabled?: boolean;
  value: ObjectDef;
}>();

const emit = defineEmits(['update:value', 'change']);

const PlusOutlined = createIconifyIcon('ant-design:plus-outlined');
const SettingOutlined = createIconifyIcon('ant-design:setting-outlined');
const SaveOutlined = createIconifyIcon('ant-design:save-outlined');
const SearchOutlined = createIconifyIcon('ant-design:search-outlined');

const currentConfigRow = ref<null | ObjectProperty>(null);
const duplicateIds = ref<Set<string>>(new Set());
// Track if table has modified changes (dirty state)
const hasTableChanges = ref(false);
const searchText = ref('');
const currentConfigType = ref<DataType | null>(null);
const tempConfigValue = ref<DataTypeDef | null>(null);

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

const [ConfigModal, modalApi] = useVbenModal({
  title: $t('dataType.strategies.object.configTitle'),
  draggable: true,
  destroyOnClose: false,
  class: 'w-3/5',
  closeOnClickModal: false,
  onConfirm: () => {
    const { column } = modalApi.getData();
    if (currentConfigRow.value && tempConfigValue.value) {
      // Merge config back to row
      currentConfigRow.value.valueType = {
        ...currentConfigRow.value.valueType,
        ...tempConfigValue.value,
      };
      // Force VxeTable to detect the change and mark the row as 'update' status
      gridApi.grid?.updateStatus({
        row: currentConfigRow.value,
        column,
      });
      modalApi.close();
    }
  },
});

function hasConfig(type: DataType) {
  // Returns true if the type has a dedicated definition component
  return !!getTypeDefinitionComponent(type);
}

function openConfig(row: ObjectProperty, column: any) {
  currentConfigRow.value = row;
  currentConfigType.value = row.valueType.type;
  // Deep copy current configuration to temp
  tempConfigValue.value = cloneDeep(row.valueType);
  modalApi.setData({
    row,
    column,
  });
  modalApi.open();
}

const validUniqueId: VxeTableDefines.ValidatorRule<ObjectProperty>['validator'] =
  ({ cellValue }) => {
    const { fullData } = gridApi.grid.getTableData();
    // Count occurrences of this ID
    const count = fullData.filter((item) => item.id === cellValue).length;

    if (count > 1) {
      return new Error($t('dataType.strategies.object.uniqueIdError'));
    }
  };

const gridOptions = computed<VxeGridProps<ObjectProperty>>(() => {
  return {
    border: true,
    keepSource: true,
    showOverflow: true,
    align: 'center',
    height: 'auto',
    maxHeight: 400,
    cellClassName: ({ row, column }) => {
      if (column.field === 'id' && duplicateIds.value.has(row.id)) {
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      }
      return null;
    },
    columnConfig: {
      resizable: true,
    },
    toolbarConfig: {
      custom: true,
      slots: { buttons: 'toolbar_buttons' },
    },
    editConfig: {
      trigger: 'click',
      mode: 'row',
      showStatus: true,
      showAsterisk: true,
      autoFocus: true,
      autoClear: false,
    },
    editRules: {
      id: [
        { required: true, content: '请输入ID' },
        { validator: validUniqueId, trigger: 'change' },
      ],
      name: [{ required: true, content: '请输入名称', trigger: 'change' }],
      valueType: [{ required: true, content: '请选择类型' }],
    },
    columns: [
      {
        field: 'id',
        title: $t('dataType.strategies.object.id'),
        editRender: {
          name: 'AInput',
          props: {
            placeholder: $t('dataType.strategies.object.placeholders.id'),
          },
        },
        minWidth: 150,
      },
      {
        field: 'name',
        minWidth: 160,
        title: $t('dataType.strategies.object.name'),
        editRender: {
          name: 'AInput',
          props: {
            placeholder: $t('dataType.strategies.object.placeholders.name'),
          },
        },
      },
      {
        field: 'valueType',
        title: $t('dataType.strategies.object.type'),
        editRender: {}, // Use slots for custom render
        slots: { edit: 'type_edit', default: 'type_default' },
        minWidth: 160,
      },
      {
        field: 'required',
        title: $t('dataType.strategies.object.required'),
        editRender: {
          name: 'ASwitch',
          props: {
            checkedChildren: $t('dataType.strategies.boolean.defaultYes'),
            unCheckedChildren: $t('dataType.strategies.boolean.defaultNo'),
          },
        },
        slots: { default: ({ row }) => (row.required ? '是' : '否') },
        minWidth: 100,
      },
      {
        title: $t('dataType.strategies.object.action'),
        minWidth: 180,
        slots: { default: 'action' },
      },
    ],
    data: props.value?.object || [],
  };
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: gridOptions.value,
  gridEvents: {
    editClosed: () => {
      checkChanges();
    },
  },
});

async function handleGlobalSave() {
  const err = await gridApi.grid.validate(true);
  if (err) return;
  syncData();
  message.success($t('dataType.strategies.object.saveSuccess'));
  // syncData triggers reload, which clears dirty state, so hasTableChanges will naturally become false via watch->setGridOptions
  // But we can set it false manually for immediate feedback
  hasTableChanges.value = false;
}

// Watch for external changes to props.value or searchText and update grid
watch(
  [() => props.value, searchText],
  ([val, text], [oldVal]) => {
    if (val && val.object) {
      let data = val.object;
      if (text) {
        const lowerText = text.toLowerCase();
        data = data.filter(
          (item) =>
            item.name?.toLowerCase().includes(lowerText) ||
            item.id?.toLowerCase().includes(lowerText),
        );
      }
      gridApi.setGridOptions({ data });
      // Reset changes flag if value reference changed (external load)
      if (val !== oldVal) {
        hasTableChanges.value = false;
      }
    }
  },
  { deep: true, immediate: true },
);

async function addProperty() {
  const newRow: ObjectProperty = {
    id: ``,
    name: '',
    description: '',
    expands: {},
    required: false,
    valueType: {
      type: 'STRING',
    },
    // @ts-ignore
    propertyValueType: { type: 'STRING' },
  };
  const { row } = await gridApi.grid.insertAt(newRow, -1);
  if (row) {
    gridApi.grid?.setEditRow(row);
  }
  checkChanges();
}
function removeRow(row: any) {
  gridApi.grid?.remove(row);
  syncData();
}

function copyRow(row: ObjectProperty) {
  const newRow = {
    ...cloneDeep(row),
    _ROW_KEY: undefined,
    _X_ROW_KEY: undefined,
    id: `${row.id}_copy`,
  };

  const { fullData } = gridApi.grid.getTableData();
  // Find index using internal key or id as fallback
  const idx = fullData.findIndex(
    (item) =>
      (item._X_ROW_KEY && item._X_ROW_KEY === row._X_ROW_KEY) ||
      item.id === row.id,
  );

  if (idx !== -1) {
    // Use -1 to append if we are at the end, otherwise insert at next index
    const insertPos = idx === fullData.length - 1 ? -1 : idx + 1;
    gridApi.grid.insertAt(newRow, insertPos).then(({ row: insertedRow }) => {
      gridApi.grid.setEditRow(insertedRow);
      checkChanges();
    });
  }
}

function hasEditStatus(row: ObjectProperty) {
  return gridApi.grid?.isEditByRow(row);
}

function isRowModified(row: ObjectProperty) {
  return gridApi.grid?.isUpdateByRow(row) || gridApi.grid?.isInsertByRow(row);
}

function editRowEvent(row: ObjectProperty) {
  gridApi.grid?.setEditRow(row);
}

async function saveRowEvent(row: ObjectProperty) {
  const err = await gridApi.grid.validate(row);
  if (err) return;
  gridApi.grid.clearEdit();
  syncData();
  message.success($t('dataType.strategies.object.saveSuccess'));
}

const cancelRowEvent = (row: ObjectProperty) => {
  gridApi.grid.clearEdit();
  gridApi.grid.revertData(row);
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

function syncData() {
  const { fullData } = gridApi.grid.getTableData();

  // If no search text, fullData is the complete list
  if (!searchText.value) {
    const newValue = { ...props.value, object: fullData };
    emit('update:value', newValue);
    emit('change', newValue);
    return;
  }

  // Merging logic for search mode
  const originData = props.value?.object || [];
  const lowerSearch = searchText.value.toLowerCase();
  const fullDataMap = new Map(fullData.map((i) => [i.id, i]));
  const newObjectList: ObjectProperty[] = [];
  const processedIds = new Set<string>();

  originData.forEach((originalItem) => {
    const isMatch =
      originalItem.name?.toLowerCase().includes(lowerSearch) ||
      originalItem.id?.toLowerCase().includes(lowerSearch);

    if (isMatch) {
      // Item matches search, check if it's still in the grid (might be edited or deleted)
      if (fullDataMap.has(originalItem.id)) {
        newObjectList.push(fullDataMap.get(originalItem.id)!);
        processedIds.add(originalItem.id);
      }
    } else {
      // Keep items that don't match search criteria (hidden items)
      newObjectList.push(originalItem);
    }
  });

  // Add new items from grid (newly added or ID changed)
  fullData.forEach((item) => {
    if (!processedIds.has(item.id)) {
      newObjectList.push(item);
    }
  });

  const newValue = { ...props.value, object: newObjectList };
  emit('update:value', newValue);
  emit('change', newValue);
}
</script>

<template>
  <div
    class="object-definition rounded border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900"
  >
    <ConfigModal>
      <div v-if="currentConfigType && tempConfigValue" class="p-4">
        <component
          :is="getTypeDefinitionComponent(currentConfigType)"
          v-model:value="tempConfigValue"
        />
      </div>
    </ConfigModal>

    <Form layout="vertical">
      <FormItem :label="$t('dataType.strategies.object.properties')">
        <div class="h-[350px]">
          <Grid>
            <template #toolbar_buttons>
              <div class="flex w-full items-center justify-between">
                <Input
                  v-model:value="searchText"
                  :placeholder="
                    $t('dataType.strategies.object.searchPlaceholder')
                  "
                  class="w-64"
                  allow-clear
                >
                  <template #prefix>
                    <SearchOutlined />
                  </template>
                </Input>
                <div class="flex gap-2">
                  <Tooltip
                    :title="$t('dataType.strategies.object.addProperty')"
                  >
                    <div
                      class="flex size-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                      :class="{ 'pointer-events-none opacity-50': disabled }"
                      @click="!disabled && addProperty()"
                    >
                      <PlusOutlined />
                    </div>
                  </Tooltip>
                  <Tooltip :title="$t('dataType.strategies.object.save')">
                    <div
                      class="flex size-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                      :class="{
                        'pointer-events-none opacity-50':
                          disabled || !hasTableChanges,
                      }"
                      @click="
                        !disabled && hasTableChanges && handleGlobalSave()
                      "
                    >
                      <SaveOutlined />
                    </div>
                  </Tooltip>
                </div>
              </div>
            </template>

            <template #type_edit="{ row, column }">
              <div class="flex items-center gap-1">
                <Select
                  v-model:value="row.valueType.type"
                  :options="DATA_TYPE_OPTIONS"
                  class="!h-8 flex-1"
                />
                <div
                  v-if="hasConfig(row.valueType.type)"
                  class="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                  :title="$t('dataType.strategies.object.configTitle')"
                  @mousedown.stop
                  @click.stop="openConfig(row, column)"
                >
                  <SettingOutlined />
                </div>
              </div>
            </template>

            <template #type_default="{ row }">
              {{ $t(`dataType.types.${row.valueType.type}`) }}
            </template>

            <template #action="{ row }">
              <template v-if="hasEditStatus(row)">
                <Button
                  type="link"
                  size="small"
                  @click="saveRowEvent(row)"
                  :disabled="!isRowModified(row)"
                >
                  {{ $t('dataType.strategies.object.save') }}
                </Button>
                <Button type="link" size="small" @click="cancelRowEvent(row)">
                  {{ $t('dataType.strategies.object.cancel') }}
                </Button>
              </template>
              <template v-else>
                <Button
                  type="link"
                  size="small"
                  @click="editRowEvent(row)"
                  :disabled="disabled"
                >
                  {{ $t('dataType.strategies.object.edit') }}
                </Button>
                <Button
                  type="link"
                  size="small"
                  @click="copyRow(row)"
                  :disabled="disabled"
                >
                  {{ $t('dataType.strategies.object.copy') }}
                </Button>
                <Button
                  type="link"
                  danger
                  size="small"
                  @click.stop="removeRow(row)"
                  :disabled="disabled"
                >
                  {{ $t('dataType.strategies.object.delete') }}
                </Button>
              </template>
            </template>
          </Grid>
        </div>
      </FormItem>
    </Form>
  </div>
</template>
