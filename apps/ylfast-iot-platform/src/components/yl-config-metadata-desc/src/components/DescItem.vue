<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';

import { computed } from 'vue';

import { getFormItemComponent } from '#/components/yl-data-type-strategies/value-input';
import { formatValue } from '#/utils/config-metadata';

const props = defineProps<{
  editMode: boolean;
  prop: ConfigPropertyMetadata;
  value: any;
}>();

const emit = defineEmits(['update:value']);

// 当前值
const currentValue = computed({
  get: () => props.value,
  set: (val) => {
    emit('update:value', val);
  },
});

// 格式化显示值
const displayValue = computed(() => {
  return formatValue(props.value, props.prop);
});

// 获取对应的值输入组件
const ValueInputComponent = computed(() => {
  return getFormItemComponent(props.prop.type.type);
});
</script>

<template>
  <div class="yl-config-metadata-desc-item">
    <!-- 预览模式 -->
    <div v-if="!props.editMode" class="preview-mode">
      <span v-if="displayValue" class="text-foreground">{{
        displayValue
      }}</span>
      <span v-else class="text-muted-foreground">-</span>
    </div>

    <!-- 编辑模式 -->
    <div v-else class="edit-mode">
      <!-- 使用策略值输入组件 -->
      <component
        :is="ValueInputComponent"
        v-if="ValueInputComponent"
        v-model:value="currentValue"
        :prop="props.prop"
      />
      <!-- 不支持的类型 -->
      <span v-else class="text-muted-foreground">
        不支持的类型: {{ props.prop.type.type }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.yl-config-metadata-desc-item {
  width: 100%;
}

.preview-mode {
  display: flex;
  align-items: center;
  min-height: 32px;
}

.edit-mode {
  width: 100%;
}
</style>
