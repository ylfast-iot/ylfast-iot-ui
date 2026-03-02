<script setup lang="ts">
import type { IotNotifyTemplateApi } from '#/api/iot/notify/template';
import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { PropertyMetadata } from '#/types/metadata';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import {
  Empty,
  Input,
  RadioButton,
  RadioGroup,
  Select,
  Spin,
  Table,
  Tag,
} from 'ant-design-vue';

import { getFormItemComponent } from '#/components/yl-data-type-strategies/value-input';

/**
 * 后端预期的变量源结构
 */
interface VariableSource {
  source: 'fixed' | 'relation' | 'upper';
  value?: any;
  upperKey?: string;
  [key: string]: any;
}

interface Props {
  varDefs: IotNotifyTemplateApi.VarDef[];
  /**
   * 现在的变量存储是 Record<string, VariableSource>
   */
  variables: Record<string, VariableSource>;
  builtinVars: PropertyMetadata[];
  selectedProvider: string;
  loading?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:variables']);

/**
 * 过滤后的变量定义列表 (UI 只展示非业务关联变量)
 * 逻辑对齐老版本: !['user', 'org', 'tag'].includes(_type)
 */
const filteredVarDefs = computed(() => {
  return props.varDefs.filter((v) => {
    const bizType = v.type?.expands?.businessType || v.type?.type || '';
    return !['org', 'tag', 'user'].includes(bizType as string);
  });
});

const varColumns = [
  {
    title: $t('subscription.wizard.varName'),
    dataIndex: 'name',
    key: 'name',
    width: '20%',
  },
  {
    title: $t('subscription.wizard.varId'),
    dataIndex: 'id',
    key: 'id',
    width: '15%',
  },
  {
    title: $t('subscription.wizard.varSource'),
    dataIndex: 'source',
    key: 'source',
    width: '20%',
  },
  {
    title: $t('subscription.wizard.varValue'),
    dataIndex: 'value',
    key: 'value',
  },
];

/**
 * 内置变量选项列表
 */
const builtinVarOptions = computed(() =>
  props.builtinVars.map((v) => ({
    label: `${v.name} (${v.id})`,
    value: v.id, // 这里存储原始 ID，显示和操作方便
  })),
);

function getVarDefProp(v: IotNotifyTemplateApi.VarDef): ConfigPropertyMetadata {
  return {
    property: v.id,
    name: v.name,
    type: v.type,
    expands: v.expands,
  } as ConfigPropertyMetadata;
}

/**
 * 更新变量源
 */
function updateVarSource(id: string, partial: Partial<VariableSource>) {
  const current = props.variables[id] || { source: 'fixed' };
  const nextVariables = {
    ...props.variables,
    [id]: { ...current, ...partial },
  };
  emit('update:variables', nextVariables);
}

/**
 * 切换来源处理
 */
function handleSourceTypeChange(id: string, sourceType: 'builtin' | 'manual') {
  if (sourceType === 'manual') {
    updateVarSource(id, {
      source: 'fixed',
      value: '',
      upperKey: undefined,
    });
  } else {
    updateVarSource(id, {
      source: 'upper',
      value: undefined,
      upperKey: '',
    });
  }
}

/**
 * 处理内置变量选择 (需要加 detail. 前缀)
 */
function handleBuiltinSelect(id: string, rawKey: string) {
  const upperKey = rawKey ? `detail.${rawKey}` : '';
  updateVarSource(id, { upperKey });
}

/**
 * 获取显示的内置变量值 (去掉 detail. 前缀)
 */
function getDisplayUpperKey(upperKey?: string) {
  if (!upperKey) return undefined;
  return upperKey.startsWith('detail.')
    ? upperKey.replace('detail.', '')
    : upperKey;
}

/**
 * 处理手动输入值变更
 */
function handleValueChange(id: string, val: any) {
  updateVarSource(id, { value: val });
}
</script>

<template>
  <div>
    <p class="mb-4 text-sm text-muted-foreground">
      {{ $t('subscription.wizard.configVarsTip') }}
    </p>
    <Spin :spinning="loading">
      <Table
        v-if="filteredVarDefs.length > 0"
        :columns="varColumns"
        :data-source="filteredVarDefs"
        :pagination="false"
        size="small"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <span class="font-medium">{{ record.name || record.id }}</span>
            <span v-if="record.required" class="ml-1 text-rose-500">*</span>
          </template>
          <template v-else-if="column.key === 'id'">
            <Tag color="blue" class="font-mono text-[10px]">
              {{ record.id }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'source'">
            <RadioGroup
              :value="
                variables[record.id]?.source === 'upper' ? 'builtin' : 'manual'
              "
              size="small"
              @update:value="
                (val: any) => handleSourceTypeChange(record.id, val)
              "
            >
              <RadioButton value="manual">
                {{ $t('subscription.wizard.manualInput') }}
              </RadioButton>
              <RadioButton value="builtin">
                {{ $t('subscription.wizard.builtinVar') }}
              </RadioButton>
            </RadioGroup>
          </template>
          <template v-else-if="column.key === 'value'">
            <!-- 内置变量选择器 -->
            <Select
              v-if="variables[record.id]?.source === 'upper'"
              :value="getDisplayUpperKey(variables[record.id]?.upperKey)"
              :options="builtinVarOptions"
              :placeholder="$t('subscription.wizard.selectBuiltinVar')"
              allow-clear
              show-search
              class="w-full"
              size="small"
              @update:value="(val: any) => handleBuiltinSelect(record.id, val)"
            />
            <!-- 手动输入组件 -->
            <component
              v-else
              :is="getFormItemComponent(record.type.type as any) || Input"
              :prop="getVarDefProp(record as any)"
              :value="variables[record.id]?.value"
              class="w-full"
              size="small"
              @update:value="(val: any) => handleValueChange(record.id, val)"
            />
          </template>
        </template>
      </Table>
      <div v-else class="flex flex-col items-center justify-center py-12">
        <Empty
          :description="$t('subscription.wizard.noVars')"
          :image="Empty.PRESENTED_IMAGE_SIMPLE"
        />
      </div>
    </Spin>
  </div>
</template>
