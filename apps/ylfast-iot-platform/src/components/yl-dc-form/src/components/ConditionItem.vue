<script setup lang="ts">
import type {
  ConditionType,
  YlDcFormCondition,
  YlDcFormSchema,
} from '../types';

// Fallbacks
import { computed, unref, watch } from 'vue';

import { globalShareState } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import { useVModel } from '@vueuse/core';
import { Button, Input, Select, Tooltip } from 'ant-design-vue';

import { $t } from '#/locales';

const props = defineProps<Props>();
const emit = defineEmits(['update:condition', 'remove', 'add']);
const DeleteOutlined = createIconifyIcon('ant-design:delete-outlined');

interface Props {
  condition: YlDcFormCondition; // Internal condition object
  schemas: YlDcFormSchema[];
  index: number;
  isLast: boolean;
  canDelete: boolean;
  hideLogic?: boolean; // Hide logic operator (for collapsed view)
  size?: 'large' | 'middle' | 'small';
}

const logicTypes = computed(() => [
  { label: $t('ylDcForm.logic.and'), value: 'and' },
  { label: $t('ylDcForm.logic.or'), value: 'or' },
]);

const termTypes = computed(() => [
  { label: $t('ylDcForm.termType.eq'), value: 'eq' },
  { label: $t('ylDcForm.termType.not'), value: 'not' },
  { label: $t('ylDcForm.termType.like'), value: 'like' },
  { label: $t('ylDcForm.termType.nlike'), value: 'nlike' },
  { label: $t('ylDcForm.termType.gt'), value: 'gt' },
  { label: $t('ylDcForm.termType.lt'), value: 'lt' },
  { label: $t('ylDcForm.termType.gte'), value: 'gte' },
  { label: $t('ylDcForm.termType.lte'), value: 'lte' },
  { label: $t('ylDcForm.termType.in'), value: 'in' },
  { label: $t('ylDcForm.termType.nin'), value: 'nin' },
  { label: $t('ylDcForm.termType.empty'), value: 'empty' },
  { label: $t('ylDcForm.termType.nempty'), value: 'nempty' },
  { label: $t('ylDcForm.termType.btw'), value: 'btw' },
  { label: $t('ylDcForm.termType.nbtw'), value: 'nbtw' },
  { label: $t('ylDcForm.termType.isnull'), value: 'isnull' },
  { label: $t('ylDcForm.termType.notnull'), value: 'notnull' },
]);

const currentSchema = computed(() => {
  return props.schemas.find((s) => s.field === props.condition.column);
});

const availableTermTypes = computed(() => {
  const schema = unref(currentSchema);
  if (schema?.termTypes) {
    return termTypes.value.filter((t) =>
      schema.termTypes!.includes(t.value as any),
    );
  }
  return termTypes.value;
});

const valueComponent = computed(() => {
  const schema = unref(currentSchema);
  const termType = props.condition.termType as ConditionType;

  if (!schema) return Input;

  // 1. Check termTypeComponents
  if (schema.termTypeComponents && schema.termTypeComponents[termType]) {
    const compName = schema.termTypeComponents[termType]!.component;
    const comp = globalShareState.getComponents()[compName];
    return comp || Input;
  }

  // 2. Check component
  if (schema.component) {
    let componentName = schema.component;
    // 如果组件是DatePicker 组件,且termType是btw或者nbtw，则使用RangePicker
    if (componentName === 'DatePicker' && ['btw', 'nbtw'].includes(termType)) {
      componentName = 'RangePicker' as any;
    }
    const comp = globalShareState.getComponents()[componentName];

    return comp || Input;
  }

  // 3. Default based on some logic (e.g. if options present, use Select)
  if (schema.componentProps?.options) {
    return Select;
  }

  return Input;
});

const valueComponentProps = computed(() => {
  const schema = unref(currentSchema);
  const termType = props.condition.termType as ConditionType;
  const propsData: Record<string, any> = {
    style: { width: '100%' },
    placeholder: $t('ylDcForm.placeholder.input'),
    size: props.size,
  };

  if (!schema) return propsData;

  // Merge common component props
  if (schema.componentProps) {
    Object.assign(propsData, schema.componentProps);
  }

  // Merge term specific props
  if (
    schema.termTypeComponents &&
    schema.termTypeComponents[termType]?.componentProps
  ) {
    Object.assign(
      propsData,
      schema.termTypeComponents[termType]!.componentProps,
    );
  }

  // Special handling for 'in'/'nin'
  if (['in', 'nin'].includes(termType)) {
    propsData.mode = 'tags';
  }
  // Special handling for 'btw'/'nbtw' of Date Component
  if (
    ['btw', 'nbtw'].includes(termType) &&
    (schema.component === 'DatePicker' || schema.component === 'RangePicker')
  ) {
    propsData.placeholder = [
      $t('ylDcForm.placeholder.inputStartDate'),
      $t('ylDcForm.placeholder.inputEndDate'),
    ];
  }
  return propsData;
});

const handleRemove = () => {
  emit('remove');
};

const conditionVM = useVModel(props, 'condition', emit);

// Watch for column changes and clear value
watch(
  () => conditionVM.value.column,
  (newColumn, oldColumn) => {
    if (oldColumn && newColumn !== oldColumn) {
      // Set default value when column changes
      const schema = props.schemas.find((s) => s.field === newColumn);
      conditionVM.value.value = schema?.defaultValue;

      // Reset termType if not valid for new column
      if (
        schema?.termTypes &&
        schema.termTypes.length > 0 &&
        !schema.termTypes.includes(props.condition.termType as any)
      ) {
        conditionVM.value.termType = schema.termTypes[0]!;
      }
    }
  },
);
</script>

<template>
  <div class="condition-row">
    <!-- Logic Operator -->
    <div v-if="!hideLogic" class="condition-item logic-select">
      <Select
        v-if="index > 0"
        v-model:value="conditionVM.type"
        class="responsive-select-sm"
        :size="size"
        :options="logicTypes"
      />
      <span v-else class="placeholder-block"></span>
    </div>

    <!-- Column Select -->
    <div class="condition-item column-select">
      <Select
        v-model:value="conditionVM.column"
        class="responsive-select-md"
        :size="size"
        :placeholder="$t('ylDcForm.placeholder.selectField')"
        :options="schemas"
        :field-names="{ label: 'label', value: 'field' }"
      />
    </div>

    <!-- Term Type Select -->
    <div class="condition-item term-select">
      <Select
        v-model:value="conditionVM.termType"
        class="responsive-select-sm"
        :size="size"
        :options="availableTermTypes"
      />
    </div>

    <!-- Value Input -->
    <div class="condition-item value-input">
      <!-- Dynamic Component -->
      <component
        :is="valueComponent"
        v-bind="valueComponentProps"
        :model-value="conditionVM.value"
        :value="conditionVM.value"
        @update:model-value="(val: any) => (conditionVM.value = val)"
        @update:value="(val: any) => (conditionVM.value = val)"
      />
    </div>

    <!-- Actions -->
    <div class="condition-item actions">
      <Tooltip :title="$t('ylDcForm.deleteCondition')">
        <Button
          v-if="canDelete"
          type="text"
          :size="size"
          @click="handleRemove"
          class="action-btn delete-condition-btn"
        >
          <DeleteOutlined />
        </Button>
      </Tooltip>
    </div>
  </div>
</template>

<style scoped>
/* Medium screens and down: Allow items to wrap more gracefully */
@media (max-width: 992px) {
  .value-input {
    min-width: 100%; /* Force input to new line if space is tight */
    margin-top: 4px;
  }

  .condition-item {
    flex-grow: 1; /* Allow selects to grow to fill space */
  }

  .responsive-select-sm,
  .responsive-select-md,
  .placeholder-block {
    width: 100%;
  }
}

/* Mobile Responsive Styles */
@media (max-width: 576px) {
  .condition-row {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
    padding: 8px;
    background-color: hsl(var(--muted) / 30%);
    border-radius: 4px;
  }

  .condition-item {
    width: 100%;
  }

  .condition-item :deep(.ant-select),
  .condition-item :deep(.ant-input),
  .condition-item :deep(.ant-picker) {
    width: 100% !important;
  }

  .placeholder-block {
    display: none;
  }

  .logic-select {
    width: 100%;
  }

  .value-input {
    min-width: 0;
  }

  .actions {
    justify-content: flex-end;
  }
}

.condition-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.condition-item {
  display: flex;
  align-items: center;
}

.placeholder-block {
  display: inline-block;
  width: 100px; /* Match responsive-select-sm width */
  height: 1px; /* Ensure it takes up space */
}

.value-input {
  flex: 1;
  min-width: 150px; /* Allow shrinking slightly */
}

.responsive-select-sm {
  width: 100px; /* Increased slightly from 80px for better text fit */
}

.responsive-select-md {
  width: 150px;
}

/* Action Buttons Style */
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px; /* Softer corners */
  transition: all 0.2s ease-in-out;
}

.delete-condition-btn {
  color: hsl(var(--muted-foreground));
  opacity: 0.6;
}

.delete-condition-btn:hover {
  color: hsl(var(--destructive));
  background-color: hsl(var(--destructive) / 10%);
  opacity: 1;
  transform: scale(1.05); /* Subtle pop effect */
}

/* Previous styles */
</style>
