<script setup lang="ts">
import type { QueryParamEntity } from '#/adapter';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Empty } from 'ant-design-vue';

import {
  getTemplateDetail,
  queryTemplatesDetailByConfigId,
} from '#/api/iot/notify/template';
import { CommonCard } from '#/components/business/common-selector';
import { useNotifyTemplateSelectorConfig } from '#/components/business/notify/template-selector/src/config';
import { NOTIFY_PROVIDER_ENUMS, NOTIFY_TYPE_ENUMS } from '#/enums/notify';

const props = defineProps<{
  notifierId: string;
  notifyType: string;
  value?: any;
}>();

const emit = defineEmits<{
  detail: [value: any];
  select: [value: any];
  'update:value': [value: any];
}>();

const { searchFormSchemas } = useNotifyTemplateSelectorConfig();
const colorMap: Record<string, { background: string; color: string }> = {
  blue: { background: '#eef4ff', color: '#1677ff' },
  green: { background: '#edf9ee', color: '#2f9b45' },
  orange: { background: '#fff6eb', color: '#fa8c16' },
  purple: { background: '#f6f0ff', color: '#722ed1' },
  gray: { background: '#f5f5f5', color: '#595959' },
};

const selectedRows = computed(() => (props.value ? [props.value] : []));

const queryApi = async (params: QueryParamEntity) => {
  if (!props.notifierId) {
    return { data: [], total: 0 };
  }
  const result = await queryTemplatesDetailByConfigId(props.notifierId, params);
  const data = Array.isArray(result) ? result : [];
  return { data, total: data.length };
};

function resolveCardStyle(item: any) {
  const typeInfo =
    (NOTIFY_PROVIDER_ENUMS as any)[item.provider] ||
    (NOTIFY_TYPE_ENUMS as any)[props.notifyType] ||
    {};
  return colorMap[typeInfo.color] || colorMap.blue;
}

function resolveIcon(item: any) {
  return (
    (NOTIFY_PROVIDER_ENUMS as any)[item.provider]?.icon ||
    (NOTIFY_TYPE_ENUMS as any)[props.notifyType]?.icon ||
    'lucide:bell'
  );
}

async function handleSelectionChange(rows: any[]) {
  const row = rows?.[0];
  emit('update:value', row);
  if (!row?.id) {
    emit('detail', undefined);
    return;
  }
  const detail = await getTemplateDetail(row.id);
  emit('detail', detail);
  emit('select', detail);
}
</script>

<template>
  <Empty v-if="!notifierId" description="请先选择通知配置" class="py-10" />
  <CommonCard
    v-else
    :default-selected-rows="selectedRows"
    id-field="id"
    :multiple="false"
    :query-api="queryApi"
    :search-form-schemas="searchFormSchemas"
    :show-more-button="false"
    :show-pager="true"
    :show-search-form="true"
    @selection-change="handleSelectionChange"
  >
    <template #card-item="{ item, isSelected }">
      <div class="select-card" :class="{ active: isSelected }">
        <div class="select-card-head">
          <div class="select-card-icon" :style="resolveCardStyle(item)">
            <IconifyIcon :icon="resolveIcon(item)" class="size-7" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate text-base font-semibold text-slate-800">
              {{ item.name }}
            </div>
            <div class="mt-2 text-xs text-slate-500">
              通知方式：{{ item.type || '-' }}
            </div>
            <div class="text-xs text-slate-500">
              模板变量：{{ item.varDefs?.length || 0 }} 个
            </div>
          </div>
        </div>
        <div class="select-card-foot">
          <span class="truncate">{{ item.description || '暂无说明' }}</span>
        </div>
      </div>
    </template>
  </CommonCard>
</template>

<style scoped>
.select-card {
  min-height: 120px;
  padding: 16px;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 14px;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.select-card:hover {
  border-color: #d0dbe8;
  transform: translateY(-1px);
}

.select-card.active {
  background: #f7fbff;
  border-color: #1677ff;
}

.select-card-head {
  display: flex;
  gap: 14px;
  align-items: center;
}

.select-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
}

.select-card-foot {
  margin-top: 14px;
  font-size: 12px;
  color: #8c8c8c;
}
</style>
