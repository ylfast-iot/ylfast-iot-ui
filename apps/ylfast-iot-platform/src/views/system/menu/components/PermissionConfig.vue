<script setup lang="ts">
import type { SystemPermissionApi } from '#/api/system/permission';

import { computed, onMounted, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import { Checkbox, Input, Spin, Table } from 'ant-design-vue';

import { getPermissionListNoPaging } from '#/api/system/permission';

interface Props {
  value?: any[]; // The selected permissions: [{ permission: 'user', actions: ['query', 'save'] }]
}

const props = defineProps<Props>();
const emit = defineEmits(['update:value']);

const loading = ref(false);
const allPermissions = ref<SystemPermissionApi.Permission[]>([]);
const searchText = ref('');

// Local state for selected permissions
// Map<permissionId, Set<action>>
const selectedMap = ref<Map<string, Set<string>>>(new Map());

const columns = [
  {
    title: $t('permission.field.name'),
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: $t('permission.field.actions'),
    dataIndex: 'actions',
    key: 'actions',
  },
];

// Fetch permissions on mount
onMounted(async () => {
  loading.value = true;
  try {
    const data = await getPermissionListNoPaging({
      paging: false,
      sorts: [{ name: 'name', order: 'asc' }],
    });
    allPermissions.value = data;
  } finally {
    loading.value = false;
  }
});

// Sync from props.value to local state
watch(
  () => props.value,
  (newVal) => {
    const newMap = new Map<string, Set<string>>();
    if (newVal) {
      newVal.forEach((item: any) => {
        if (item.permission) {
          newMap.set(item.permission, new Set(item.actions || []));
        }
      });
    }
    selectedMap.value = newMap;
  },
  { immediate: true, deep: true },
);

// Emit changes
function emitValue() {
  const result: any[] = [];
  selectedMap.value.forEach((actions, permissionId) => {
    if (actions.size > 0) {
      result.push({
        permission: permissionId,
        actions: [...actions],
      });
    }
  });
  emit('update:value', result);
}

const filteredData = computed(() => {
  if (!searchText.value) {
    return allPermissions.value;
  }
  return allPermissions.value.filter(
    (item) =>
      item.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      item.id.toLowerCase().includes(searchText.value.toLowerCase()),
  );
});

// Helper to get permission checkbox state
function getPermissionState(
  record: Record<string, any> | SystemPermissionApi.Permission,
) {
  const selected = selectedMap.value.get(record.id);
  const allActions = record.actions || [];

  if (!selected || selected.size === 0) {
    return { checked: false, indeterminate: false };
  }

  if (
    allActions.length > 0 &&
    allActions.every((a: any) => selected.has(a.action))
  ) {
    return { checked: true, indeterminate: false };
  }

  return { checked: false, indeterminate: true };
}

function togglePermission(
  record: Record<string, any> | SystemPermissionApi.Permission,
  checked: boolean,
) {
  if (checked) {
    // Select all actions
    const allActions = (record.actions || []).map((a: any) => a.action);
    selectedMap.value.set(record.id, new Set(allActions));
  } else {
    // Deselect all
    selectedMap.value.delete(record.id);
  }
  emitValue();
}

function isActionSelected(
  record: Record<string, any> | SystemPermissionApi.Permission,
  action: string,
) {
  return selectedMap.value.get(record.id)?.has(action) ?? false;
}

function toggleAction(
  record: Record<string, any> | SystemPermissionApi.Permission,
  action: string,
  checked: boolean,
) {
  if (checked) {
    if (!selectedMap.value.has(record.id)) {
      selectedMap.value.set(record.id, new Set());
    }
    selectedMap.value.get(record.id)!.add(action);
  } else {
    selectedMap.value.get(record.id)?.delete(action);
    // If no actions left, typically we might leave the permission in map as "empty"
    // or remove it. The requirement implies partial selection is possible.
    // If set becomes empty, let's keep it (so permission is "selected" but no actions?
    // Wait, the state logic above handles empty set as unchecked.
    // So if 0 actions, it becomes unchecked.
    if (selectedMap.value.get(record.id)?.size === 0) {
      selectedMap.value.delete(record.id);
    }
  }
  emitValue();
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="mb-2 shrink-0">
      <Input.Search
        v-model:value="searchText"
        allow-clear
        :placeholder="$t('permission.placeholder.name')"
      />
    </div>
    <div class="min-h-0 flex-1 bg-white">
      <Spin :spinning="loading">
        <Table
          :columns="columns"
          :data-source="filteredData"
          :scroll="{
            y: 300,
          }"
          :pagination="false"
          row-key="id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <Checkbox
                :checked="getPermissionState(record).checked"
                :indeterminate="getPermissionState(record).indeterminate"
                @update:checked="(val) => togglePermission(record, val)"
              >
                {{ record.name }}
              </Checkbox>
            </template>
            <template v-else-if="column.key === 'actions'">
              <div class="flex flex-wrap gap-2">
                <Checkbox
                  v-for="action in record.actions"
                  :key="action.action"
                  :checked="isActionSelected(record, action.action)"
                  @update:checked="
                    (val) => toggleAction(record, action.action, val)
                  "
                >
                  {{ action.name || action.describe }}
                </Checkbox>
              </div>
            </template>
          </template>
        </Table>
      </Spin>
    </div>
  </div>
</template>
