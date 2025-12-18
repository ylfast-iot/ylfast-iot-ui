<script setup lang="ts">
import type {
  DynamicCondition,
  YlDcFormActionType,
  YlDcFormGroup,
  YlDcFormProps,
  YlDcFormSchema,
} from './types';

import type { Term } from '#/adapter/hsweb/QueryParams';

import { computed, onMounted, onUnmounted, ref, toRaw, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { cloneDeep } from '@vben/utils';

import { useResizeObserver } from '@vueuse/core';
import {
  Button,
  Dropdown,
  Grid,
  Input,
  Menu,
  MenuItem,
  message,
  Popover,
} from 'ant-design-vue';

import { $t } from '#/locales';

import ConditionGroup from './components/ConditionGroup.vue';
import ConditionItem from './components/ConditionItem.vue';
import { ConditionStorageManager } from './conditionStorage';

const props = defineProps<YlDcFormProps>();
const emit = defineEmits([
  'register',
  'search',
  'save',
  'reset',
  'update:terms',
  'resize',
]);
const DownOutlined = createIconifyIcon('ant-design:down-outlined');
const UpOutlined = createIconifyIcon('ant-design:up-outlined');
const DeleteOutlined = createIconifyIcon('ant-design:delete-outlined');

// 初始化存储管理器
const storageManager = new ConditionStorageManager(props.storeOption);

// 条件管理状态
const savedConditions = ref<DynamicCondition[]>([]);
const currentConditionKey = ref<string>('');
const currentConditionName = ref<string>('');
const savePopoverVisible = ref(false);
const conditionName = ref('');

const { useBreakpoint } = Grid;
const screens = useBreakpoint();

const dcFormContainerRefEl = ref<HTMLDivElement | null>();

const res = useResizeObserver(dcFormContainerRefEl, (res) => {
  emit('resize', res);
});
onUnmounted(() => {
  res.stop();
});

// 处理 Popover 显示状态变化
const handlePopoverOpenChange = (visible: boolean) => {
  if (visible) {
    // 如果是编辑模式，回显条件名称
    conditionName.value =
      currentConditionKey.value && currentConditionName.value
        ? currentConditionName.value
        : '';
  }
  savePopoverVisible.value = visible;
};

// 保存条件
const handleSaveCondition = async () => {
  if (!conditionName.value.trim()) {
    message.warning($t('ylDcForm.conditionManagement.inputName'));
    return;
  }

  const condition: DynamicCondition = {
    groups: groups.value,
    key: currentConditionKey.value || Date.now().toString(),
    name: conditionName.value.trim(),
  };

  await storageManager.saveCondition(condition);
  message.success($t('ylDcForm.conditionManagement.saveSuccess'));
  savePopoverVisible.value = false;
  currentConditionKey.value = condition.key;
  currentConditionName.value = condition.name;
  await loadSavedConditions();
};

// 是否显示"更多筛选"按钮，默认为 true
const shouldShowMoreButton = computed(() => {
  return getProps.value.showMoreButton !== false;
});

// fix: 这里是一个 ts bug dropdownButton按钮的Size 没有middle，导致和当前button的size冲突，所以这里直接使用心得变量
const dropdownButtonSize = computed(() => getProps.value.size as any);

const groups = ref<YlDcFormGroup[]>([
  {
    conditions: [
      {
        column: '',
        key: `${Date.now().toString()}_0`,
        termType: 'eq',
        type: 'and',
        value: '',
      },
    ],
    key: Date.now().toString(),
    type: 'and',
  },
]);

const innerProps = ref<Partial<YlDcFormProps>>({
  showMoreButton: true,
});

const getProps = computed(() => {
  return { ...props, ...innerProps.value };
});

const gridCols = computed(() => {
  const layout = getProps.value.layoutOption;
  if (!layout) return 1;

  if (layout.breakpoints) {
    if (screens.value.xxl && layout.breakpoints.xxl)
      return layout.breakpoints.xxl;
    if (screens.value.xl && layout.breakpoints.xl) return layout.breakpoints.xl;
    if (screens.value.lg && layout.breakpoints.lg) return layout.breakpoints.lg;
    if (screens.value.md && layout.breakpoints.md) return layout.breakpoints.md;
    if (screens.value.sm && layout.breakpoints.sm) return layout.breakpoints.sm;
    if (screens.value.xs && layout.breakpoints.xs) return layout.breakpoints.xs;
  }

  return layout.cols || 1;
});

const schemas = ref<YlDcFormSchema[]>([]);
const findSchemaByField = (field: string): undefined | YlDcFormSchema => {
  return schemas.value.find((s) => s.field === field);
};
// 根据字段获取默认值
const getDefaultValueForField = (field: string): any => {
  const schema = findSchemaByField(field);
  return schema?.defaultValue === undefined ? '' : schema.defaultValue;
};

const formatValueForField = (field: string, val: any): any => {
  const schema = findSchemaByField(field);
  return schema?.valueFormatter ? schema.valueFormatter(val) : val;
};

function initFormSchemas(
  newSchemas: undefined | YlDcFormSchema[],
  first = false,
) {
  if (newSchemas) {
    schemas.value = [...newSchemas];
    // Set default column and value for existing empty conditions
    if (schemas.value.length > 0) {
      const defaultField = schemas.value[0]?.field || '';
      const defaultValue = getDefaultValueForField(defaultField);

      groups.value.forEach((group) => {
        group.conditions.forEach((cond) => {
          if (!cond.column) {
            cond.column = defaultField;
            cond.value = defaultValue;
          }
        });
      });
      if (first) {
        emit('update:terms', buildTerms());
      }
    }
  }
}
initFormSchemas(getProps.value.formSchemas, true);

watch(
  () => getProps.value.formSchemas,
  (newSchemas) => {
    initFormSchemas(newSchemas);
  },
  { deep: true },
);

const addGroup = () => {
  const defaultField =
    schemas.value.length > 0 ? schemas.value[0]?.field || '' : '';
  const defaultValue = getDefaultValueForField(defaultField);

  groups.value.push({
    conditions: [
      {
        column: defaultField,
        key: `${Date.now().toString()}_0`,
        termType: 'eq',
        type: 'and',
        value: defaultValue,
      },
    ],
    key: Date.now().toString(),
    type: 'and',
  });
};

const removeGroup = (index: number) => {
  groups.value.splice(index, 1);
};

const removeCondition = (groupIndex: number, conditionIndex: number) => {
  if (!groups.value[groupIndex]) return;
  groups.value[groupIndex].conditions.splice(conditionIndex, 1);
  if (groups.value[groupIndex].conditions.length === 0) {
    removeGroup(groupIndex);
  }
};

const addCondition = (groupIndex: number) => {
  if (!groups.value[groupIndex]) return;
  const defaultField =
    schemas.value.length > 0 ? schemas.value[0]?.field || '' : '';
  const defaultValue = getDefaultValueForField(defaultField);

  groups.value[groupIndex].conditions.push({
    column: defaultField,
    key: Date.now().toString(),
    termType: 'eq',
    type: 'or',
    value: defaultValue,
  });
};

function buildTerms() {
  return cloneDeep(toRaw(groups.value))
    .map((group) => {
      const groupTerms: Term[] = group.conditions
        .filter((cond) => {
          // 忽略 value 为空的情况，除非 termType 是 empty 或 nempty
          if (['empty', 'nempty'].includes(cond.termType)) {
            return true;
          }
          if (Array.isArray(cond.value)) {
            return cond.value.length > 0;
          }
          return (
            cond.value !== '' && cond.value !== null && cond.value !== undefined
          );
        })
        .map((cond) => {
          let rawValue = cond.value;
          if (['like', 'nlike'].includes(cond.termType)) {
            rawValue = `%${rawValue}%`;
          }
          return {
            column: cond.column,
            termType: cond.termType as any,
            value: formatValueForField(cond.column, rawValue),
            type: cond.type,
          };
        });

      return {
        terms: groupTerms,
        type: group.type,
      };
    })
    .filter((group) => group.terms.length > 0);
}

const handleSearch = async () => {
  const terms = buildTerms();
  emit('update:terms', terms);
  emit('search', terms);
};

const handleSave = async () => {
  const terms = buildTerms();
  emit('save', terms);
};

const reset = async () => {
  const defaultField =
    schemas.value.length > 0 ? schemas.value[0]?.field || '' : '';
  const defaultValue = getDefaultValueForField(defaultField);
  groups.value = [
    {
      conditions: [
        {
          column: defaultField,
          key: `${Date.now().toString()}_0`,
          termType: 'eq',
          type: 'and',
          value: defaultValue,
        },
      ],
      key: Date.now().toString(),
      type: 'and',
    },
  ];
  // 重置时清除当前选中的条件
  currentConditionKey.value = '';
  currentConditionName.value = '';
  const terms = buildTerms();
  emit('update:terms', terms);
  emit('reset', terms);
};

// Action implementation
const formAction: YlDcFormActionType = {
  appendSchemaByField: async (
    schema: YlDcFormSchema,
    prefixField?: string,
    first?: boolean,
  ) => {
    if (first) {
      schemas.value.unshift(schema);
    } else if (prefixField) {
      const index = schemas.value.findIndex((s) => s.field === prefixField);
      if (index === -1) {
        schemas.value.push(schema);
      } else {
        schemas.value.splice(index + 1, 0, schema);
      }
    } else {
      schemas.value.push(schema);
    }
  },
  clearValidate: async () => {
    // No validation yet
  },
  deleteCondition: async (key: string) => {
    await storageManager.deleteCondition(key);
  },
  getAllConditions: async (): Promise<DynamicCondition[]> => {
    return await storageManager.getAllConditions();
  },
  getFieldsValue: () => {
    return buildTerms();
  },
  // 条件管理方法
  loadCondition: async (key: string) => {
    const condition = await storageManager.loadCondition(key);
    if (condition && condition.groups) {
      groups.value = condition.groups;
    }
  },
  removeSchemaByField: async (field: string | string[]) => {
    const fields = Array.isArray(field) ? field : [field];
    schemas.value = schemas.value.filter((s) => !fields.includes(s.field));
  },
  resetFields: reset,
  resetSchema: async (data) => {
    // Reset schema to initial props or provided data
    if (props.formSchemas) {
      schemas.value = [...props.formSchemas];
    }
    if (data) {
      await formAction.updateSchema(data);
    }
  },
  save: handleSave,
  saveCondition: async (name: string) => {
    const condition: DynamicCondition = {
      groups: groups.value,
      key: Date.now().toString(),
      name,
    };
    await storageManager.saveCondition(condition);
  },
  search: handleSearch,
  setFieldsValue: async () => {
    // TODO: Implement parsing values (Term[]) back to groups
    console.warn('setFieldsValue not fully implemented yet');
  },
  setProps: async (newProps: Partial<YlDcFormProps>) => {
    innerProps.value = { ...innerProps.value, ...newProps };
  },
  updateSchema: async (
    data: Partial<YlDcFormSchema> | Partial<YlDcFormSchema>[],
  ) => {
    let updateData: Partial<YlDcFormSchema>[] = [];
    updateData = Array.isArray(data) ? data : [data];

    updateData.forEach((item) => {
      const index = schemas.value.findIndex((s) => s.field === item.field);
      if (index !== -1) {
        schemas.value[index] = {
          ...schemas.value[index],
          ...item,
        } as YlDcFormSchema;
      }
    });
  },
};

const expanded = ref(false);

const toggleExpand = () => {
  if (expanded.value) {
    // Collapsing: reset to initial state
    reset();
  } else {
    // Expanding: Add missing fields from schema to the first group
    if (schemas.value.length > 0) {
      // Ensure groups is initialized if empty (should not happen usually due to reset)
      if (groups.value.length === 0) {
        const defaultField = schemas.value[0]?.field || '';
        const defaultValue = getDefaultValueForField(defaultField);
        groups.value = [
          {
            conditions: [
              {
                column: defaultField,
                key: `${Date.now().toString()}_0`,
                termType: 'eq',
                type: 'and',
                value: defaultValue,
              },
            ],
            key: Date.now().toString(),
            type: 'and',
          },
        ];
      }

      const firstGroup = groups.value[0];
      if (firstGroup) {
        const existingFields = new Set(
          firstGroup.conditions.map((c) => c.column),
        );

        // Find fields that are not present in the current conditions
        const missingSchemas = schemas.value.filter(
          (s) => !existingFields.has(s.field),
        );

        // Append missing fields
        missingSchemas.forEach((schema, idx) => {
          firstGroup.conditions.push({
            column: schema.field,
            key: `${Date.now().toString()}_${schema.field}_${idx}`, // Ensure unique key
            termType: 'eq' as any,
            type: 'and',
            value: schema.defaultValue === undefined ? '' : schema.defaultValue,
          });
        });
      }
    }
  }
  expanded.value = !expanded.value;
};

// 加载已保存的条件列表
const loadSavedConditions = async () => {
  savedConditions.value = await formAction.getAllConditions();
};

// 加载条件
const handleLoadCondition = async (condition: DynamicCondition) => {
  groups.value = condition.groups;
  currentConditionKey.value = condition.key;
  currentConditionName.value = condition.name;
  expanded.value = true;
  message.success($t('ylDcForm.conditionManagement.loadSuccess'));
};

// 删除条件
const handleDeleteCondition = async (key: string, event: Event) => {
  event.stopPropagation();
  await storageManager.deleteCondition(key);
  message.success($t('ylDcForm.conditionManagement.deleteSuccess'));
  if (currentConditionKey.value === key) {
    currentConditionKey.value = '';
    currentConditionName.value = '';
  }
  await loadSavedConditions();
};

onMounted(() => {
  emit('register', formAction);
  loadSavedConditions();
});

defineExpose(formAction);
</script>

<template>
  <div class="yl-dc-form-container" ref="dcFormContainerRefEl">
    <!-- Collapsed view: single line with conditions and buttons -->
    <div v-if="!expanded" class="collapsed-view">
      <div class="collapsed-conditions">
        <template v-for="(group, gIndex) in groups" :key="group.key">
          <template
            v-for="(condition, cIndex) in group.conditions"
            :key="condition.key"
          >
            <ConditionItem
              v-if="group.conditions[cIndex]"
              v-model:condition="group.conditions[cIndex]"
              :can-delete="
                !(groups.length === 1 && group.conditions.length === 1)
              "
              :hide-logic="true"
              :index="cIndex"
              :is-last="false"
              :schemas="schemas"
              :size="getProps.size"
              @add="addCondition(gIndex)"
              @remove="removeCondition(gIndex, cIndex)"
            />
          </template>
        </template>
      </div>

      <div class="collapsed-actions">
        <Button :size="getProps.size" @click="reset">
          {{ $t('ylDcForm.action.reset') }}
        </Button>
        <Popover
          v-model:open="savePopoverVisible"
          placement="bottom"
          trigger="click"
          @open-change="handlePopoverOpenChange"
        >
          <template #content>
            <div class="save-popover-content">
              <div class="popover-title">
                {{ $t('ylDcForm.conditionManagement.inputName') }}
              </div>
              <Input
                v-model:value="conditionName"
                :placeholder="$t('ylDcForm.conditionManagement.inputName')"
                :size="getProps.size"
                class="popover-input"
                @press-enter="handleSaveCondition"
              />
              <Button
                :size="getProps.size"
                block
                type="primary"
                @click="handleSaveCondition"
              >
                {{ $t('ylDcForm.conditionManagement.save') }}
              </Button>
            </div>
          </template>
          <Button :size="getProps.size">
            {{
              currentConditionKey
                ? $t('ylDcForm.conditionManagement.edit')
                : $t('ylDcForm.conditionManagement.save')
            }}
          </Button>
        </Popover>
        <Dropdown.Button
          :size="dropdownButtonSize"
          :trigger="['click']"
          type="primary"
          @click="handleSearch"
        >
          {{ $t('ylDcForm.action.search') }}
          <template #overlay>
            <Menu :selected-keys="[currentConditionKey]">
              <MenuItem v-if="savedConditions.length === 0" disabled>
                <div class="empty-conditions">
                  {{ $t('ylDcForm.conditionManagement.noConditions') }}
                </div>
              </MenuItem>
              <MenuItem
                v-for="item in savedConditions"
                :key="item.key"
                @click="handleLoadCondition(item)"
              >
                <div class="condition-menu-item-content">
                  <span class="condition-name">{{ item.name }}</span>
                  <Button
                    class="delete-btn"
                    danger
                    size="small"
                    type="text"
                    @click.stop="(e) => handleDeleteCondition(item.key, e)"
                  >
                    <DeleteOutlined />
                  </Button>
                </div>
              </MenuItem>
            </Menu>
          </template>
        </Dropdown.Button>
        <Button
          v-if="shouldShowMoreButton"
          :size="getProps.size"
          class="more-filters-btn"
          type="link"
          @click="toggleExpand"
        >
          {{ $t('ylDcForm.moreFilters') }}
          <DownOutlined class="icon-spacing" />
        </Button>
      </div>
    </div>

    <!-- Expanded view: full layout with groups -->
    <div v-else class="expanded-view">
      <div
        :style="{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        }"
        class="groups-wrapper"
      >
        <ConditionGroup
          v-for="(group, gIndex) in groups"
          :key="group.key"
          :group="group"
          :index="gIndex"
          :schemas="schemas"
          :size="getProps.size"
          :total-groups="groups.length"
          @add-condition="addCondition(gIndex)"
          @remove="removeGroup(gIndex)"
        />
      </div>

      <div class="form-actions">
        <Button :size="getProps.size" @click="reset">
          {{ $t('ylDcForm.action.reset') }}
        </Button>
        <Popover
          v-model:open="savePopoverVisible"
          placement="bottom"
          trigger="click"
          @open-change="handlePopoverOpenChange"
        >
          <template #content>
            <div class="save-popover-content">
              <div class="popover-title">
                {{ $t('ylDcForm.conditionManagement.inputName') }}
              </div>
              <Input
                v-model:value="conditionName"
                :placeholder="$t('ylDcForm.conditionManagement.inputName')"
                :size="getProps.size"
                class="popover-input"
                @press-enter="handleSaveCondition"
              />
              <Button
                :size="getProps.size"
                block
                type="primary"
                @click="handleSaveCondition"
              >
                {{ $t('ylDcForm.conditionManagement.save') }}
              </Button>
            </div>
          </template>
          <Button :size="getProps.size">
            {{
              currentConditionKey
                ? $t('ylDcForm.conditionManagement.edit')
                : $t('ylDcForm.conditionManagement.save')
            }}
          </Button>
        </Popover>
        <Dropdown.Button
          :size="dropdownButtonSize"
          :trigger="['click']"
          type="primary"
          @click="handleSearch"
        >
          {{ $t('ylDcForm.action.search') }}
          <template #overlay>
            <Menu :selected-keys="[currentConditionKey]">
              <MenuItem v-if="savedConditions.length === 0" disabled>
                <div class="empty-conditions">
                  {{ $t('ylDcForm.conditionManagement.noConditions') }}
                </div>
              </MenuItem>
              <MenuItem
                v-for="item in savedConditions"
                :key="item.key"
                @click="handleLoadCondition(item)"
              >
                <div class="condition-menu-item-content">
                  <span class="condition-name">{{ item.name }}</span>
                  <Button
                    class="delete-btn"
                    danger
                    size="small"
                    type="text"
                    @click.stop="(e) => handleDeleteCondition(item.key, e)"
                  >
                    <DeleteOutlined />
                  </Button>
                </div>
              </MenuItem>
            </Menu>
          </template>
        </Dropdown.Button>
        <Button :size="getProps.size" ghost type="primary" @click="addGroup">
          {{ $t('ylDcForm.addGroup') }}
        </Button>
        <Button
          :size="getProps.size"
          class="more-filters-btn"
          style="margin-left: auto"
          type="link"
          @click="toggleExpand"
        >
          {{ $t('ylDcForm.collapse') }}
          <UpOutlined class="icon-spacing" />
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Mobile Responsive: Force 1 column on small screens */
@media (max-width: 576px) {
  .groups-wrapper {
    grid-template-columns: 1fr !important;
  }

  /* Collapsed view mobile styles */
  .collapsed-view {
    flex-direction: column;
    align-items: stretch;
  }

  .collapsed-conditions {
    flex-direction: column;
    width: 100%;
  }

  .collapsed-actions {
    justify-content: flex-end; /* Or space-between */
    width: 100%;
    margin-top: 8px;
  }
}

.yl-dc-form-container {
  padding: 16px;
  background-color: hsl(var(--card));
  border-radius: 4px;
  box-shadow: 0 1px 3px hsl(var(--foreground) / 10%);
}

/* Collapsed view styles */
.collapsed-view {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.collapsed-conditions {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.collapsed-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.more-filters-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding-left: 16px;
  margin-left: 8px;
}

.more-filters-btn::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 1px;
  height: 16px;
  content: '';
  background-color: hsl(var(--border));
  transform: translateY(-50%);
}

.icon-spacing {
  margin-left: 6px;
}

/* Expanded view styles */
.expanded-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.groups-wrapper {
  display: grid;
  gap: 16px;
  min-height: 100px;
  max-height: 450px;
  padding: 2px; /* Prevent shadows/borders from being cut off */
  overflow-y: auto;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

/* 条件下拉菜单样式 */
.empty-conditions {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  text-align: center;
}

.condition-menu-item-content {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-width: 200px;
}

.condition-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  white-space: nowrap;
}

.delete-btn {
  height: auto;
  padding: 4px 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.ant-dropdown-menu-item:hover .delete-btn {
  opacity: 1;
}

/* 保存条件 Popover 样式 */
.save-popover-content {
  width: 240px;
  padding: 4px 0;
}

.popover-title {
  margin-bottom: 8px;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.popover-input {
  margin-bottom: 12px;
}
</style>
