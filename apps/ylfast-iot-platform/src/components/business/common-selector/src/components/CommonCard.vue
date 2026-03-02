<script setup lang="ts">
import type { CommonSelectorProps } from '../types';

import type { QueryParamEntity, Term } from '#/adapter';

import { onMounted, reactive, ref, watch } from 'vue';

import { Empty, Pagination, Spin } from 'ant-design-vue';

import { useYlDcForm } from '#/components/yl-dc-form';

const props = withDefaults(defineProps<CommonSelectorProps>(), {
  multiple: true,
  showPager: true,
  showSearchForm: true,
  defaultSelectedRows: () => [],
  idField: 'id',
  searchFormSchemas: () => [],
  showMoreButton: true,
});

const emit = defineEmits(['selectionChange']);

// State
const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const selectedMap = ref<Map<string, any>>(new Map());

const pagination = reactive({
  current: 1,
  pageSize: 12,
});

// Cache current search terms
const currentTerms = ref<Term[]>([]);
const oldParamsTermsStr = ref('');

// Search Form
const [DynamicSearchForm] = useYlDcForm({
  showMoreButton: props.showMoreButton,
  layoutOption: {
    cols: 2,
    breakpoints: { xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 3 },
  },
  formSchemas: props.searchFormSchemas,
});

// Data Fetching
async function fetchData() {
  loading.value = true;
  try {
    if (props.queryApi) {
      const terms = [...currentTerms.value];
      if (props.paramsTerms && props.paramsTerms.length > 0) {
        terms.push(...props.paramsTerms);
      }

      let queryParams: QueryParamEntity = {
        pageIndex: pagination.current - 1,
        pageSize: pagination.pageSize,
        terms,
      };

      // Hook: beforeFetch
      if (props.beforeFetch) {
        queryParams = await props.beforeFetch(queryParams);
      }

      const res = await props.queryApi(queryParams);

      let result = {
        data: res.data,
        total: res.total,
      };

      // Hook: afterFetch
      if (props.afterFetch) {
        result = await props.afterFetch(result);
      }

      list.value = result.data;
      total.value = result.total;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function handleSearch(terms: any[]) {
  currentTerms.value = terms;
  pagination.current = 1;
  fetchData();
}

function handleReset(terms: any[]) {
  currentTerms.value = terms;
  pagination.current = 1;
  fetchData();
}

// Selection Logic
function toggleSelection(row: any) {
  const id = row[props.idField || 'id'];
  if (props.multiple) {
    if (selectedMap.value.has(id)) {
      selectedMap.value.delete(id);
    } else {
      selectedMap.value.set(id, row);
    }
  } else {
    selectedMap.value.clear();
    selectedMap.value.set(id, row);
  }
  emitChange();
}

function emitChange() {
  emit('selectionChange', [...selectedMap.value.values()]);
}

function getSelection() {
  return [...selectedMap.value.values()];
}

function clearSelection() {
  selectedMap.value.clear();
  emitChange();
}

function setSelection(rows: any[]) {
  if (!rows) return;
  const idKey = props.idField || 'id';

  selectedMap.value.clear();

  if (props.multiple) {
    rows.forEach((r) => selectedMap.value.set(r[idKey], r));
  } else {
    if (rows.length > 0) {
      selectedMap.value.set(rows[0][idKey], rows[0]);
    }
  }
  // Do NOT emit change here to avoid loop if called by watcher
}

// Watchers
watch(
  () => props.defaultSelectedRows,
  (rows) => {
    setSelection(rows || []);
  },
  { immediate: true, deep: true },
);

// Consolidated Watcher for Params & Initial Fetch
watch(
  () => props.paramsTerms,
  (newTerms) => {
    const newTermsStr = JSON.stringify(newTerms || []);
    if (newTermsStr === oldParamsTermsStr.value && list.value.length > 0)
      return;

    oldParamsTermsStr.value = newTermsStr;
    pagination.current = 1;
    fetchData();
  },
  { deep: true, immediate: true },
);

// Pagination
function handlePageChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  fetchData();
}

onMounted(() => {
  // fetchData is now handled by the immediate watch on paramsTerms
});

defineExpose({ getSelection, clearSelection, setSelection });
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Search -->
    <div v-if="showSearchForm" class="mb-4 flex-shrink-0">
      <DynamicSearchForm @search="handleSearch" @reset="handleReset" />
    </div>

    <!-- Content -->
    <div class="min-h-[500px] flex-1 overflow-y-auto overflow-x-hidden p-1">
      <Spin :spinning="loading">
        <div
          v-if="list.length > 0"
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div
            v-for="item in list"
            :key="item[idField || 'id']"
            @click="toggleSelection(item)"
          >
            <!-- Card Slot -->
            <slot
              name="card-item"
              :item="item"
              :is-selected="selectedMap.has(item[idField || 'id'])"
            ></slot>
          </div>
        </div>
        <div v-else class="flex h-64 items-center justify-center">
          <Empty />
        </div>
      </Spin>
    </div>

    <!-- Pagination -->
    <div
      v-if="showPager"
      class="flex flex-shrink-0 justify-end border-t border-border pt-3"
    >
      <Pagination
        v-model:current="pagination.current"
        v-model:page-size="pagination.pageSize"
        :total="total"
        size="small"
        show-size-changer
        show-quick-jumper
        :show-total="(total) => `共 ${total} 条`"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>
