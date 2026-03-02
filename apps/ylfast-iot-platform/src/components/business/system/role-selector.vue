<script setup lang="ts">
import type { SystemRoleApi } from '#/api/system/role';

import { computed, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import {
  Button,
  Checkbox,
  InputSearch,
  Pagination,
  Spin,
} from 'ant-design-vue';

import { queryRolePost } from '#/api/system/role';

interface Props {
  value?: string[];
  maxHeight?: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: () => [],
  maxHeight: '320px',
});

const emit = defineEmits(['update:value', 'change']);

// 状态
const loading = ref(false);
const roleList = ref<SystemRoleApi.RoleEntity[]>([]);
const totalCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(12);
const searchText = ref('');

// 内部维护的选择列表，用于同步 v-model
const selectedIds = ref<string[]>([...props.value]);

// 监听外部值变化
watch(
  () => props.value,
  (val) => {
    selectedIds.value = [...(val || [])];
  },
  { deep: true },
);

// 搜索
function handleSearch(val: string) {
  searchText.value = val;
  currentPage.value = 1;
  fetchRoles();
}

// 分页变更
function handlePageChange(page: number, size: number) {
  currentPage.value = page;
  pageSize.value = size;
  fetchRoles();
}

/**
 * 加载数据
 */
async function fetchRoles() {
  loading.value = true;
  try {
    const { data, total } = await queryRolePost({
      pageIndex: currentPage.value - 1,
      pageSize: pageSize.value,
      terms: searchText.value
        ? [{ column: 'name', termType: 'like', value: `%${searchText.value}%` }]
        : [],
    });
    roleList.value = data || [];
    totalCount.value = total || 0;
  } finally {
    loading.value = false;
  }
}

// 计算当前页是否全选
const isAllSelectedOnCurrentPage = computed(() => {
  if (roleList.value.length === 0) return false;
  return roleList.value.every((role) => selectedIds.value.includes(role.id));
});

const isIndeterminateOnCurrentPage = computed(() => {
  const currentIds = roleList.value.map((r) => r.id);
  const selectedCountOnPage = currentIds.filter((id) =>
    selectedIds.value.includes(id),
  ).length;
  return selectedCountOnPage > 0 && selectedCountOnPage < roleList.value.length;
});

// 全选/取消全选本页
function handleSelectAllPage(e: any) {
  const checked = e.target.checked;
  const currentIds = roleList.value.map((r) => r.id);
  let nextIds = [...selectedIds.value];
  nextIds = checked
    ? [...new Set([...currentIds, ...nextIds])]
    : nextIds.filter((id) => !currentIds.includes(id));
  updateValue(nextIds);
}

// 切换单个角色选择
function toggleRole(roleId: string, checked: boolean) {
  let nextIds = [...selectedIds.value];
  if (checked) {
    if (!nextIds.includes(roleId)) {
      nextIds.push(roleId);
    }
  } else {
    nextIds = nextIds.filter((id) => id !== roleId);
  }
  updateValue(nextIds);
}

// 清除所有选择
function clearSelections() {
  updateValue([]);
}

function updateValue(val: string[]) {
  selectedIds.value = val;
  emit('update:value', val);
  emit('change', val);
}

// 初始化加载
fetchRoles();

defineExpose({
  refresh: fetchRoles,
  clear: clearSelections,
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 搜索栏 -->
    <InputSearch
      v-model:value="searchText"
      :placeholder="$t('subscription.keywordSearch')"
      allow-clear
      @search="handleSearch"
    />

    <!-- 状态栏: 全选 & 已选统计 -->
    <div
      class="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-4 py-2.5"
    >
      <div class="flex items-center gap-3">
        <Checkbox
          :checked="isAllSelectedOnCurrentPage"
          :indeterminate="isIndeterminateOnCurrentPage"
          @change="handleSelectAllPage"
        >
          {{ $t('subscription.selectAll') }}
        </Checkbox>
        <span class="text-[13px] text-muted-foreground">
          {{ $t('subscription.selectedItems', { count: selectedIds.length }) }}
        </span>
      </div>
      <Button size="small" type="link" @click="clearSelections">
        {{ $t('subscription.clearSelection') }}
      </Button>
    </div>

    <!-- 角色列表 -->
    <Spin :spinning="loading">
      <div
        class="grid grid-cols-1 gap-1 overflow-y-auto pr-1"
        :style="{ maxHeight }"
      >
        <div
          v-for="role in roleList"
          :key="role.id"
          class="flex cursor-pointer items-center gap-3 rounded-md px-4 py-3 transition-colors hover:bg-muted/50"
          @click="toggleRole(role.id, !selectedIds.includes(role.id))"
        >
          <Checkbox
            :checked="selectedIds.includes(role.id)"
            @click.stop
            @change="(e: any) => toggleRole(role.id, e.target.checked)"
          />
          <span class="text-[14px] text-foreground">{{ role.name }}</span>
        </div>
        <div
          v-if="roleList.length === 0 && !loading"
          class="py-10 text-center text-muted-foreground"
        >
          {{ $t('common.noData') }}
        </div>
      </div>
    </Spin>

    <!-- 分页栏 -->
    <div class="mt-2 flex justify-end">
      <Pagination
        v-model:current="currentPage"
        v-model:page-size="pageSize"
        :total="totalCount"
        :show-total="
          (total: number) =>
            `第 ${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, total)} 条/总共 ${total} 条`
        "
        size="small"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}
</style>
