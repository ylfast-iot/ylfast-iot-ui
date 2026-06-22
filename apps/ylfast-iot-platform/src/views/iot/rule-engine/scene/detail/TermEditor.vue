<script setup lang="ts">
import type { Term } from '#/adapter';
import type { TermColumn } from '#/api/iot/rule-engine/types';
import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { DataType, DataTypeDef } from '#/types/data-type';

import { computed, h, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import {
  Button,
  Empty,
  Input,
  Modal,
  Popover,
  Select,
  Tabs,
  Tooltip,
  TreeSelect,
} from 'ant-design-vue';

import { getFormItemComponent } from '#/components/yl-data-type-strategies/value-input';

import { createTerm } from './utils';

const props = defineProps<{
  columns: TermColumn[];
  terms: Term[];
}>();

const emit = defineEmits<{
  changed: [];
  'update:terms': [value: Term[]];
}>();

const CloseIcon = createIconifyIcon('lucide:x');
const PlusIcon = createIconifyIcon('lucide:plus');

type ValueSource = 'manual' | 'metric';

interface TermValue {
  metric?: any;
  source: ValueSource;
  value: any;
}

interface ColumnOption {
  children?: ColumnOption[];
  disabled?: boolean;
  label: any;
  raw: TermColumn;
  selectedLabel?: any;
  title: any;
  value: string;
}

const fallbackTermTypes = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'not' },
  { label: '大于', value: 'gt' },
  { label: '大于等于', value: 'gte' },
  { label: '小于', value: 'lt' },
  { label: '小于等于', value: 'lte' },
  { label: '包含', value: 'like' },
  { label: '不为空', value: 'notnull' },
  { label: '为空', value: 'isnull' },
];

const relationOptions = [
  { label: '并且', value: 'and' },
  { label: '或者', value: 'or' },
];

const groups = computed<Term[]>(() => {
  if (!props.terms?.length) return [];
  if (props.terms.some((item) => Array.isArray(item.terms))) return props.terms;
  return [{ type: 'and', terms: props.terms } as Term];
});

const columnMap = computed(() => {
  const map = new Map<string, TermColumn>();
  const walk = (columns: TermColumn[] = []) => {
    for (const column of columns) {
      if (column.column) map.set(column.column, column);
      if (column.children?.length) walk(column.children);
    }
  };
  walk(props.columns);
  return map;
});

const treeData = computed<ColumnOption[]>(() => toColumnTree(props.columns));

const internalParamTree = computed<ColumnOption[]>(() =>
  toColumnTree(props.columns),
);

const onlyOneConditionLeft = computed(() => {
  if (groups.value.length !== 1) return false;
  return (groups.value[0]?.terms?.length || 0) <= 1;
});

function toColumnTree(
  columns: TermColumn[] = [],
  parent?: TermColumn,
): ColumnOption[] {
  return columns
    .map((column) => {
      const value = column.column || column.code || column.name;
      const childOptions = toColumnTree(column.children || [], column);
      const title = parent
        ? renderChildColumnTitle(column)
        : renderColumnTitle(column);
      const option: ColumnOption = {
        children: childOptions,
        disabled: childOptions.length > 0 || !value,
        label: title,
        raw: column,
        selectedLabel: parent
          ? renderSelectedColumnTitle(parent, column)
          : title,
        title,
        value: childOptions.length > 0 ? createGroupValue(value) : value,
      };
      if (childOptions.length === 0) delete option.children;
      return option;
    })
    .filter((item) => item.value || item.children?.length);
}

function createGroupValue(value: string) {
  return `__group__:${value}`;
}

function _createCurrentValueOption(
  column: TermColumn,
  value: string,
): ColumnOption {
  return {
    label: renderChildTextTitle('当前值', '当前值'),
    raw: column,
    selectedLabel: renderSelectedTextTitle(column, '当前值'),
    title: renderChildTextTitle('当前值', '当前值'),
    value,
  };
}

function renderColumnTitle(column: TermColumn) {
  const name = column.name || column.fullName || column.column;
  const desc = column.description || column.fullName || column.column;
  return h('div', { class: 'param-tree-title' }, [
    h('span', { class: 'param-tree-name' }, name),
    desc && desc !== name
      ? h('span', { class: 'param-tree-desc' }, desc)
      : undefined,
  ]);
}

function renderChildColumnTitle(column: TermColumn) {
  return renderChildTextTitle(
    column.name || column.fullName || column.column,
    column.description || column.fullName || column.column,
  );
}

function renderChildTextTitle(name: string, desc?: string) {
  return h('div', { class: 'param-tree-title' }, [
    h('span', { class: 'param-tree-name' }, name),
    desc && desc !== name
      ? h('span', { class: 'param-tree-desc' }, desc)
      : undefined,
  ]);
}

function renderSelectedColumnTitle(_parent: TermColumn, column: TermColumn) {
  return renderSelectedLeafTitle(
    column.name || column.fullName || column.column,
    column.description || column.fullName || column.column,
  );
}

function renderSelectedTextTitle(parent: TermColumn, childName: string) {
  const parentName = parent.name || parent.fullName || parent.column;
  return h('span', { class: 'param-selected-title' }, [
    h('span', { class: 'param-selected-parent' }, parentName),
    h('span', { class: 'param-selected-child' }, childName),
  ]);
}

function renderSelectedLeafTitle(name: string, desc?: string) {
  return h('span', { class: 'param-selected-title' }, [
    h('span', { class: 'param-selected-parent' }, name),
    desc && desc !== name
      ? h('span', { class: 'param-selected-child' }, desc)
      : undefined,
  ]);
}

function filterTreeNode(input: string, node: any) {
  const column = node.raw || columnMap.value.get(node.value);
  const text = [
    column?.name,
    column?.fullName,
    column?.description,
    column?.column,
    node.value,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes(input.toLowerCase());
}

function defaultTerm() {
  return {
    ...createTerm(''),
    type: 'and',
    value: { source: 'manual', value: undefined },
  } as Term;
}

function defaultGroup(type: 'and' | 'or' = 'and') {
  return { type, terms: [defaultTerm()] } as Term;
}

function updateTerms(next: Term[], triggerChanged = true) {
  emit('update:terms', next);
  if (triggerChanged) {
    emit('changed');
  }
}

function ensureGroups() {
  return groups.value.length > 0
    ? groups.value.map((item) => ({
        ...item,
        terms: (item.terms || []).map((term) => ({ ...term })),
      }))
    : [];
}

function addFirstGroup() {
  updateTerms([defaultGroup()]);
}

function addGroup() {
  updateTerms([...ensureGroups(), defaultGroup('and')]);
}

function doRemoveGroup(groupIndex: number) {
  if (onlyOneConditionLeft.value) return;
  updateTerms(ensureGroups().filter((_item, index) => index !== groupIndex));
}

function removeGroup(groupIndex: number) {
  if (onlyOneConditionLeft.value) return;
  Modal.confirm({
    title: '确认删除分组？',
    content: '删除后该分组下的所有条件都会被移除。',
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: () => doRemoveGroup(groupIndex),
  });
}

function doRemoveTerm(groupIndex: number, termIndex: number) {
  if (onlyOneConditionLeft.value) return;
  const next = ensureGroups();
  const group = next[groupIndex];
  if (!group?.terms?.length) return;
  if (group.terms.length === 1) {
    doRemoveGroup(groupIndex);
    return;
  }
  group.terms = group.terms.filter((_item, index) => index !== termIndex);
  next[groupIndex] = group;
  updateTerms(next);
}

function removeTerm(groupIndex: number, termIndex: number) {
  if (onlyOneConditionLeft.value) return;
  const group = ensureGroups()[groupIndex];
  const onlyOneTerm = (group?.terms?.length || 0) <= 1;
  Modal.confirm({
    title: onlyOneTerm ? '确认删除分组？' : '确认删除条件？',
    content: onlyOneTerm
      ? '当前分组只剩一个条件，删除后会一并删除该分组。'
      : '删除后该条件将从当前分组中移除。',
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: () => doRemoveTerm(groupIndex, termIndex),
  });
}

function addTerm(groupIndex: number) {
  const next = ensureGroups();
  const group = next[groupIndex] || defaultGroup();
  group.terms = [...(group.terms || []), defaultTerm()];
  next[groupIndex] = group;
  updateTerms(next);
}

function patchGroup(groupIndex: number, patch: Partial<Term>) {
  const next = ensureGroups();
  next[groupIndex] = { ...next[groupIndex], ...patch } as Term;
  updateTerms(next, false);
}

function patchTerm(
  groupIndex: number,
  termIndex: number,
  patch: Partial<Term>,
  triggerChanged = false,
) {
  const next = ensureGroups();
  const group = next[groupIndex] || defaultGroup();
  group.terms = (group.terms || []).map((item, index) =>
    index === termIndex ? ({ ...item, ...patch } as Term) : item,
  );
  next[groupIndex] = group;
  updateTerms(next, triggerChanged);
}

function selectedColumn(term: Term) {
  return columnMap.value.get(term.column || '');
}

function getTermTypeOptions(term: Term) {
  const column = selectedColumn(term);
  const options = column?.termTypes?.length
    ? column.termTypes.map((item) => ({ label: item.name, value: item.id }))
    : fallbackTermTypes;
  return options;
}

function getSelectedColumnTooltip(term: Term) {
  const column = selectedColumn(term);
  if (!column) return '';
  const parts = [
    column.fullName || column.name || column.column,
    column.description,
  ].filter(Boolean);
  return parts.join('\n');
}

function selectColumn(groupIndex: number, termIndex: number, column: string) {
  const nextColumn = columnMap.value.get(column);
  const firstTermType =
    nextColumn?.termTypes?.[0]?.id || fallbackTermTypes[0]?.value || 'eq';
  patchTerm(
    groupIndex,
    termIndex,
    {
      column,
      termType: firstTermType as any,
      value: { source: 'manual', value: undefined },
    },
    true,
  );
}

function normalizeValue(value: any): TermValue {
  if (value && typeof value === 'object' && 'source' in value) {
    if (value.source === 'metric') {
      const metric = value.metric ?? value.value;
      return {
        metric,
        source: 'metric',
        value: metric,
      };
    }
    return {
      source: 'manual',
      value: value.value,
    };
  }
  return { source: 'manual', value };
}

function patchValue(
  groupIndex: number,
  termIndex: number,
  term: Term,
  source: ValueSource,
  value: any,
) {
  const nextValue =
    source === 'metric' ? { source, metric: value, value } : { source, value };
  patchTerm(
    groupIndex,
    termIndex,
    {
      value: nextValue,
    },
    false,
  );
}

function getValueLabel(term: Term) {
  if (['isnull', 'notnull'].includes(term.termType || '')) return '';
  const value = normalizeValue(term.value);
  if (value.source === 'metric') {
    const column = columnMap.value.get(String(value.value));
    return column?.name || column?.fullName || value.value || '内置参数';
  }
  return value.value === undefined || value.value === '' || value.value === null
    ? '参数值'
    : String(value.value);
}

function getInputProp(term: Term): ConfigPropertyMetadata {
  const column = selectedColumn(term);
  const valueType = normalizeDataType(
    (column as any)?.valueType ||
      (column?.others as any)?.valueType ||
      (column?.others as any)?.dataType ||
      column?.dataType,
    column,
  );
  return {
    description: column?.description,
    name: column?.name || column?.fullName || '参数值',
    property: column?.column || term.column || 'value',
    type: valueType,
  };
}

function normalizeDataType(input: any, column?: TermColumn): DataTypeDef {
  if (input && typeof input === 'object') {
    return normalizeEnumOptions(input, column);
  }
  const type = String(input || 'STRING').toUpperCase() as DataType;
  if (type === 'ENUM') {
    return normalizeEnumOptions({ type }, column);
  }
  if (type === 'DATE') {
    return {
      date: {
        format: 'YYYY-MM-DD HH:mm:ss',
        isRange: false,
        mode: 'datetime',
        valueType: 'STRING',
      },
      type,
    } as any;
  }
  if (isKnownDataType(type)) return { type };
  return { type: 'STRING' };
}

function normalizeEnumOptions(input: any, column?: TermColumn): DataTypeDef {
  const rawType = String(input?.type || input?.id || 'STRING').toUpperCase();
  if (rawType !== 'ENUM')
    return { ...input, type: isKnownDataType(rawType) ? rawType : 'STRING' };
  const options =
    column?.options ||
    (input?.elements as any[]) ||
    (input?.enums as any[]) ||
    [];
  return {
    ...input,
    elementValueType: input?.elementValueType || { type: 'STRING' },
    enums: options.map((item: any) => ({
      label: item.name || item.label || item.text || item.value,
      propertyValueType: item.propertyValueType || { type: 'STRING' },
      value: item.id ?? item.value,
    })),
    multi: input?.multi === true,
    type: 'ENUM',
  } as any;
}

function isKnownDataType(type: string): type is DataType {
  return [
    'ARRAY',
    'BOOLEAN',
    'BYTE',
    'DATE',
    'DOUBLE',
    'ENUM',
    'FILE',
    'FLOAT',
    'GEO',
    'INTEGER',
    'LONG',
    'OBJECT',
    'PASSWORD',
    'SHORT',
    'STRING',
  ].includes(type);
}

function getInputComponent(term: Term) {
  return getFormItemComponent(getInputProp(term).type.type) || Input;
}

function shouldShowValue(term: Term) {
  return !['isnull', 'notnull'].includes(term.termType || '');
}

watch(
  () => [props.columns, props.terms],
  () => {
    if ((props.terms || []).length === 0 && (props.columns || []).length > 0) {
      updateTerms([defaultGroup()], false);
    }
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div class="term-editor">
    <Button
      v-if="groups.length === 0"
      class="term-empty"
      size="small"
      type="link"
      @click="addFirstGroup"
    >
      添加过滤条件
    </Button>

    <div v-else class="term-groups">
      <template v-for="(group, groupIndex) in groups" :key="groupIndex">
        <div v-if="groupIndex > 0" class="group-relation">
          <Select
            :options="relationOptions"
            :value="group.type || 'and'"
            size="small"
            @change="patchGroup(groupIndex, { type: String($event) as any })"
          />
        </div>

        <div class="term-group">
          <Button
            v-if="!onlyOneConditionLeft"
            class="group-delete"
            danger
            shape="circle"
            size="small"
            type="text"
            @click="removeGroup(groupIndex)"
          >
            <template #icon><CloseIcon class="size-3" /></template>
          </Button>

          <template
            v-for="(term, termIndex) in group.terms || []"
            :key="termIndex"
          >
            <Select
              v-if="termIndex > 0"
              class="term-relation"
              :options="relationOptions"
              :value="term.type || 'and'"
              size="small"
              @change="
                patchTerm(groupIndex, termIndex, {
                  type: String($event) as any,
                })
              "
            />
            <div class="condition-item">
              <Button
                v-if="!onlyOneConditionLeft"
                class="term-delete"
                danger
                shape="circle"
                size="small"
                type="text"
                @click="removeTerm(groupIndex, termIndex)"
              >
                <template #icon><CloseIcon class="size-3" /></template>
              </Button>
              <Tooltip :title="getSelectedColumnTooltip(term)">
                <TreeSelect
                  class="term-chip term-chip-field"
                  :dropdown-match-select-width="false"
                  :filter-tree-node="filterTreeNode"
                  :tree-data="treeData"
                  :tree-default-expand-all="false"
                  tree-node-label-prop="selectedLabel"
                  :value="term.column"
                  placeholder="请选择参数"
                  show-search
                  size="small"
                  tree-block-node
                  @change="selectColumn(groupIndex, termIndex, String($event))"
                />
              </Tooltip>
              <Select
                class="term-chip term-chip-operator"
                :dropdown-match-select-width="false"
                :options="getTermTypeOptions(term)"
                :value="term.termType || 'eq'"
                size="small"
                @change="
                  patchTerm(groupIndex, termIndex, {
                    termType: String($event) as any,
                  })
                "
              />
              <Popover
                v-if="shouldShowValue(term)"
                overlay-class-name="term-value-popover"
                placement="bottomLeft"
                trigger="click"
              >
                <Button class="term-chip-value" size="small">
                  {{ getValueLabel(term) }}
                </Button>
                <template #content>
                  <Tabs
                    :active-key="normalizeValue(term.value).source"
                    size="small"
                    @change="
                      patchValue(
                        groupIndex,
                        termIndex,
                        term,
                        String($event) as any,
                        normalizeValue(term.value).value,
                      )
                    "
                  >
                    <Tabs.TabPane key="manual" tab="手动输入">
                      <component
                        :is="getInputComponent(term)"
                        :prop="getInputProp(term)"
                        :value="normalizeValue(term.value).value"
                        class="term-value-input"
                        @update:value="
                          patchValue(
                            groupIndex,
                            termIndex,
                            term,
                            'manual',
                            $event,
                          )
                        "
                      />
                    </Tabs.TabPane>
                    <Tabs.TabPane key="metric" tab="内置参数">
                      <TreeSelect
                        class="term-value-input"
                        :dropdown-match-select-width="false"
                        :filter-tree-node="filterTreeNode"
                        :tree-data="internalParamTree"
                        tree-node-label-prop="selectedLabel"
                        :value="normalizeValue(term.value).value"
                        placeholder="请选择内置参数"
                        show-search
                        tree-block-node
                        @change="
                          patchValue(
                            groupIndex,
                            termIndex,
                            term,
                            'metric',
                            $event,
                          )
                        "
                      />
                      <Empty
                        v-if="internalParamTree.length === 0"
                        :image="Empty.PRESENTED_IMAGE_SIMPLE"
                      />
                    </Tabs.TabPane>
                  </Tabs>
                </template>
              </Popover>
            </div>
          </template>

          <Button class="term-round" size="small" @click="addTerm(groupIndex)">
            <template #icon><PlusIcon class="size-3" /></template>
          </Button>
        </div>
      </template>
      <Button
        class="term-group-add"
        size="small"
        type="dashed"
        @click="addGroup"
      >
        + 分组
      </Button>
    </div>
  </div>
</template>

<style scoped>
.term-editor {
  min-width: 0;
  min-height: 32px;
}

.term-empty {
  height: 28px;
  padding: 0 14px;
  font-size: 12px;
  border: 1px dashed #d9d9d9;
  border-radius: 16px;
}

.term-groups {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  padding: 12px 0 4px;
  overflow: auto visible;
}

.term-group {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  flex-wrap: nowrap;
  gap: 6px;
  align-items: center;
  min-height: 38px;
  padding: 6px 34px 6px 8px;
  background: #fff;
  border: 1px dashed #c9c9c9;
  border-radius: 2px;
}

.group-delete {
  position: absolute;
  top: -10px;
  right: -10px;
  z-index: 1;
  display: none;
  align-items: center;
  justify-content: center;
  width: 22px;
  min-width: 22px;
  height: 22px;
  padding: 0;
  color: #ff4d4f;
  background: #fff1f0;
}

.term-group:hover > .group-delete {
  display: inline-flex;
}

.condition-item {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  gap: 4px;
  align-items: center;
  padding: 2px 4px;
  background: #fafafa;
  border-radius: 4px;
}

.term-delete {
  position: absolute;
  top: -9px;
  right: -9px;
  z-index: 2;
  display: none;
  align-items: center;
  justify-content: center;
  width: 20px;
  min-width: 20px;
  height: 20px;
  padding: 0;
  color: #ff4d4f;
  background: #fff1f0;
}

.condition-item:hover > .term-delete {
  display: inline-flex;
}

.term-chip {
  min-width: 84px;
  max-width: 220px;
}

.term-chip-field :deep(.ant-select-selector) {
  color: #1677ff;
  background: #e6f4ff !important;
  border-color: #91caff !important;
}

.term-chip-operator :deep(.ant-select-selector) {
  color: #08979c;
  background: #e6fffb !important;
  border-color: #87e8de !important;
}

.term-chip-value {
  min-width: 92px;
  max-width: 180px;
  height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #722ed1;
  white-space: nowrap;
  background: #f9f0ff;
  border-color: #d3adf7;
}

.term-relation {
  width: 64px;
}

.term-round {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  min-width: 24px;
  height: 24px;
  padding: 0;
  color: #8c8c8c;
  border-style: dashed;
  border-radius: 50%;
}

.term-group-add {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 10px;
  font-size: 12px;
  color: #8c8c8c;
  border-radius: 12px;
}

.group-relation :deep(.ant-select-selector),
.term-relation :deep(.ant-select-selector) {
  height: 24px !important;
  font-size: 12px;
  border-radius: 3px;
}

:global(.param-tree-title) {
  display: flex;
  gap: 8px;
  align-items: baseline;
  min-width: 0;
}

:global(.param-tree-name) {
  font-weight: 500;
  color: #262626;
}

:global(.param-tree-desc) {
  font-size: 12px;
  color: #8c8c8c;
}

:global(.param-selected-title) {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  min-width: 0;
}

:global(.param-selected-parent) {
  color: #1677ff;
}

:global(.param-selected-child) {
  color: #595959;
}

:global(.term-value-popover) {
  width: 290px;
}

:global(.term-value-popover .ant-popover-inner-content) {
  padding: 8px 12px 12px;
}

:global(.term-value-input) {
  width: 100%;
}
</style>
