<script setup lang="ts">
import type {
  YlDcFormCondition,
  YlDcFormGroup,
  YlDcFormSchema,
} from '../types';

import { computed, ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { preferences } from '@vben/preferences';

import { useVModel } from '@vueuse/core';
import { Button, Select, Tag, Tooltip } from 'ant-design-vue';

import { $t } from '#/locales';

import ConditionItem from './ConditionItem.vue';

interface Props {
  group: YlDcFormGroup;
  index: number;
  schemas: YlDcFormSchema[];
  size?: 'large' | 'middle' | 'small';
  totalGroups: number;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:group', 'remove', 'addCondition']);

const DeleteOutlined = createIconifyIcon('ant-design:delete-outlined');
const PlusOutlined = createIconifyIcon('ant-design:plus-outlined');
const DownOutlined = createIconifyIcon('ant-design:down-outlined');
const RightOutlined = createIconifyIcon('ant-design:right-outlined');

const groupVM = useVModel(props, 'group', emit);

const collapsed = ref(true);

const logicTypes = computed(() => [
  { label: $t('ylDcForm.logic.and'), value: 'and' },
  { label: $t('ylDcForm.logic.or'), value: 'or' },
]);
const primaryColor = computed(() => {
  return preferences.theme.colorPrimary || '#1890ff';
});

// 结构化摘要列表
const conditionSummaryList = computed(() => {
  if (!groupVM.value.conditions || groupVM.value.conditions.length === 0) {
    return [];
  }

  const list: {
    content?: {
      fieldLabel: string;
      termTypeLabel: string;
      value: any;
    };
    text?: string;
    type: 'condition' | 'logic';
  }[] = [];

  groupVM.value.conditions.forEach((cond: YlDcFormCondition, idx: number) => {
    const schema = props.schemas.find((s) => s.field === cond.column);
    const label = schema?.label || cond.column;
    const termTypeLabel = $t(`ylDcForm.termType.${cond.termType}`);

    let value = cond.value;
    // Format special values
    if (Array.isArray(value)) {
      value = value.join(', ');
    } else if (
      schema?.component === 'Select' &&
      schema.componentProps?.options
    ) {
      // Try to find label for value in options
      const option = schema.componentProps.options.find(
        (opt: any) => opt.value === value,
      );
      if (option) value = option.label;
    }

    // Prepend logic operator if not the first condition
    if (idx > 0) {
      const logicLabel = $t(`ylDcForm.logic.${cond.type}`);
      list.push({ text: logicLabel, type: 'logic' });
    }

    // Push structured condition content
    list.push({
      content: {
        fieldLabel: label,
        termTypeLabel,
        value,
      },
      type: 'condition',
    });
  });

  return list;
});

const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
};

const removeCondition = (cIndex: number) => {
  groupVM.value.conditions.splice(cIndex, 1);
  if (groupVM.value.conditions.length === 0) {
    emit('remove');
  }
};
const addCondition = () => {
  emit('addCondition');
  if (collapsed.value) {
    collapsed.value = false; // Auto expand when adding
  }
};
const removeGroup = () => {
  emit('remove');
};
</script>

<template>
  <div class="group-wrapper">
    <div class="group-container" :class="{ 'is-collapsed': collapsed }">
      <div class="group-header">
        <div class="group-title">
          <Button
            type="text"
            size="small"
            class="collapse-btn"
            @click="toggleCollapse"
          >
            <RightOutlined v-if="collapsed" />
            <DownOutlined v-else />
          </Button>

          <Tag
            :style="{
              backgroundColor: primaryColor,
              borderColor: primaryColor,
              color: 'white',
            }"
          >
            {{ $t('ylDcForm.group', { index: index + 1 }) }}
          </Tag>
          <span v-if="index > 0" class="logic-label">{{
            $t('ylDcForm.groupRelation')
          }}</span>
          <Select
            v-if="index > 0"
            v-model:value="groupVM.type"
            style="width: 100px"
            :options="logicTypes"
            :size="size"
          />
        </div>
        <div class="group-actions">
          <Tooltip :title="$t('ylDcForm.addCondition')">
            <Button
              type="text"
              :size="size"
              class="action-btn add-condition-btn"
              @click="addCondition"
            >
              <PlusOutlined />
            </Button>
          </Tooltip>
          <Tooltip :title="$t('ylDcForm.deleteGroup')">
            <Button
              v-if="index > 0"
              type="text"
              :size="size"
              class="action-btn delete-group-btn"
              @click="removeGroup"
            >
              <DeleteOutlined />
            </Button>
          </Tooltip>
        </div>
      </div>

      <!-- Group Summary when collapsed -->
      <div v-show="collapsed" class="group-summary" @click="toggleCollapse">
        <template v-for="(item, idx) in conditionSummaryList" :key="idx">
          <!-- Logic Operator -->
          <span v-if="item.type === 'logic'" class="summary-item summary-logic">
            {{ item.text }}
          </span>

          <!-- Normal Condition (Structured) -->
          <span v-else class="summary-item summary-condition">
            <span class="cond-field">{{ item.content?.fieldLabel }}</span>
            <span class="cond-term">{{ item.content?.termTypeLabel }}</span>
            <span class="cond-value">{{ item.content?.value }}</span>
          </span>
        </template>
        <span v-if="conditionSummaryList.length === 0" class="summary-empty">
          {{ $t('ylDcForm.conditionManagement.noConditions') || '无条件' }}
        </span>
      </div>

      <!-- Conditions List when expanded -->
      <div v-show="!collapsed" class="conditions-list">
        <template
          v-for="(condition, cIndex) in group.conditions"
          :key="condition.key"
        >
          <ConditionItem
            v-if="groupVM.conditions[cIndex]"
            v-model:condition="groupVM.conditions[cIndex]"
            :can-delete="!(totalGroups === 1 && group.conditions.length === 1)"
            :index="cIndex"
            :is-last="cIndex === group.conditions.length - 1"
            :schemas="schemas"
            :size="size"
            @add-condition="addCondition"
            @remove="removeCondition(cIndex)"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.group-wrapper {
  position: relative;
}

.group-container {
  padding: 16px;
  background-color: hsl(var(--background-deep));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  box-shadow: 0 2px 8px hsl(var(--foreground) / 3%);
  transition: all 0.3s ease;
}

.group-container:hover {
  box-shadow: 0 4px 12px hsl(var(--foreground) / 8%);
}

.group-container.is-collapsed {
  padding-bottom: 12px; /* Reduce padding when collapsed */
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px dashed hsl(var(--border));
  transition: margin-bottom 0.3s;
}

/* Hide border when collapsed */
.group-container.is-collapsed .group-header {
  padding-bottom: 4px;
  margin-bottom: 8px;
  border-bottom-color: transparent;
}

.group-title {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
}

.collapse-btn {
  margin-right: -4px;
  color: hsl(var(--muted-foreground));
}

.logic-label {
  margin-left: 8px;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}

/* New/Updated styles for smooth transitions */
.conditions-list,
.group-summary {
  overflow: hidden; /* Crucial for max-height transition */
  transition:
    max-height 0.3s ease-out,
    opacity 0.3s ease-out;
}

.conditions-list {
  display: flex; /* Maintain flex layout */
  flex-direction: column;
  gap: 8px;
  max-height: 1000px; /* Large enough to accommodate content when expanded */
  opacity: 1;
}

.group-summary {
  /* Summary Layout */
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  max-height: 1000px; /* Also needs a max-height when visible */
  padding: 8px 12px;
  cursor: pointer;
  background-color: hsl(var(--muted) / 30%);
  border: 1px solid hsl(var(--border) / 30%);
  border-radius: 6px;
  opacity: 1;
}

.group-summary:hover {
  background-color: hsl(var(--muted) / 50%);
  border-color: hsl(var(--border));
}

.summary-item {
  font-size: 13px;
  line-height: 1.5;
}

/* Logic Operator Style */
.summary-logic {
  padding: 1px 6px;
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--primary));
  background-color: hsl(var(--primary) / 10%);
  border-radius: 4px;
}

/* Normal Condition Style Container */
.summary-condition {
  display: inline-flex;
  gap: 4px; /* Gap between parts */
  align-items: center;
  padding: 2px 8px; /* Increased padding slightly */
  font-size: 12px;
  font-weight: 500;
  color: hsl(var(--foreground));
  background-color: hsl(var(--muted) / 30%); /* Subtle background */
  border-radius: 4px;
}

.cond-field {
  opacity: 0.85;
}

.cond-term {
  font-weight: 600;
  color: hsl(var(--warning)); /* Use a distinct color like warning/orange */
}

.cond-value {
  font-weight: 600;
}

.summary-empty {
  font-style: italic;
  color: hsl(var(--muted-foreground));
}

/* When collapsed, conditions-list hides */
.group-container.is-collapsed .conditions-list {
  max-height: 0;
  opacity: 0;
}

/* When expanded, group-summary hides */
.group-container:not(.is-collapsed) .group-summary {
  max-height: 0;
  padding: 0 12px; /* Collapse padding too */
  border: none;
  opacity: 0;
}

.group-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease-in-out;
}

.add-condition-btn {
  color: hsl(var(--primary));
  background-color: hsl(var(--primary) / 8%);
}

.add-condition-btn:hover {
  background-color: hsl(var(--primary) / 15%);
  transform: translateY(-1px);
}

.delete-group-btn {
  color: hsl(var(--muted-foreground));
  opacity: 0.7;
}

.delete-group-btn:hover {
  color: hsl(var(--destructive));
  background-color: hsl(var(--destructive) / 10%);
  opacity: 1;
}
</style>
