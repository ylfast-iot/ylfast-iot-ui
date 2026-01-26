<script setup lang="ts">
import type { CommonSelectorProps, SelectorActionType } from '../types';

import type { QueryParamEntity } from '#/adapter';

import { nextTick, watch } from 'vue';

import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

const props = withDefaults(defineProps<CommonSelectorProps>(), {
  multiple: true,
  showPager: true,
  showSearchForm: true,
  defaultSelectedRows: () => [],
  idField: 'id',
  tableColumns: () => [],
  searchFormSchemas: () => [],
});

const emit = defineEmits(['selectionChange']);

const [TableCard, gridApi] = useYlVxeTableCard<any>({
  mode: 'table',
  showSearchForm: props.showSearchForm,
  searchFormMode: 'yl-dc-form',
  ylDcFromOptions: {
    formSchemas: props.searchFormSchemas,
  },
  separator: false,
  gridOptions: {
    rowConfig: {
      isHover: true,
      keyField: props.idField,
    },
    checkboxConfig: {
      trigger: 'row',
      reserve: true,
    },
    radioConfig: {
      trigger: 'row',
      reserve: true,
    },
    height: 500,
    columns: [
      { type: props.multiple ? 'checkbox' : 'radio', width: 50 },
      ...props.tableColumns,
    ],
    proxyConfig: {
      enabled: true,
      ajax: {
        query: async ({ page }: any, ...args: any) => {
          if (props.queryApi) {
            const formValues = args[0] || {};
            const terms = [...(formValues.terms || [])];

            // 合并外部传入的 terms
            if (props.paramsTerms && props.paramsTerms.length > 0) {
              terms.push(...props.paramsTerms);
            }

            let queryParams: QueryParamEntity = {
              pageIndex: page.currentPage - 1,
              pageSize: page.pageSize,
              terms,
            };
            // Hook: beforeFetch
            if (props.beforeFetch) {
              queryParams = await props.beforeFetch(queryParams);
            }

            const res = await props.queryApi(queryParams);

            let result = {
              items: res.data,
              total: res.total,
            };

            // Hook: afterFetch
            if (props.afterFetch) {
              const modifiedRes = await props.afterFetch({
                data: res.data,
                total: res.total,
              });
              result = {
                items: modifiedRes.data,
                total: modifiedRes.total,
              };
            }

            return result;
          }
          return {
            items: [],
            total: 0,
          };
        },
      },
      response: {
        result: 'items',
        total: 'total',
      },
    },
    pagerConfig: {
      enabled: props.showPager,
    },
    toolbarConfig: {
      refresh: true,
      custom: true,
    },
  },
  gridEvents: {
    checkboxChange: handleSelectionChange,
    checkboxAll: handleSelectionChange,
    radioChange: handleSelectionChange,
  },
});

watch(
  () => props.defaultSelectedRows,
  (rows) => {
    setSelection(rows || []);
  },
  { immediate: true, deep: true },
);

function handleSelectionChange() {
  const records = props.multiple
    ? gridApi.grid.getCheckboxRecords()
    : [gridApi.grid.getRadioRecord()].filter(Boolean);
  emit('selectionChange', records);
}

function getSelection() {
  return props.multiple
    ? gridApi.grid.getCheckboxRecords()
    : [gridApi.grid.getRadioRecord()].filter(Boolean);
}

function clearSelection() {
  const grid = gridApi.grid;
  if (!grid) return;
  if (props.multiple) {
    grid.clearCheckboxRow();
    grid.clearCheckboxReserve();
  } else {
    grid.clearRadioRow();
    grid.clearRadioReserve();
  }
}

function setSelection(rows: any[]) {
  if (!rows) return;
  nextTick(() => {
    const grid = gridApi.grid;
    if (!grid) return;

    if (props.multiple) {
      grid.setCheckboxRow(rows, true);
    } else {
      if (rows.length > 0) {
        grid.setRadioRow(rows[0]);
      } else {
        grid.clearRadioRow();
      }
    }
  });
}

const actions: SelectorActionType = {
  getSelection,
  clearSelection,
  setSelection,
};

defineExpose(actions);
</script>

<template>
  <TableCard>
    <!-- Pass through all slots for custom column rendering -->
    <template v-for="(_, slotName) in $slots" #[slotName]="slotData">
      <slot :name="slotName" v-bind="slotData"></slot>
    </template>
  </TableCard>
</template>
