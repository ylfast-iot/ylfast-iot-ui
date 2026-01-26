<script setup lang="ts">
import { computed } from 'vue';

import YlApiSelect from '#/components/yl-api-select';

import { useNotifySelect } from './hooks/useNotifySelect';

interface Props {
  // eslint-disable-next-line vue/require-default-prop
  configId?: string;
  // eslint-disable-next-line vue/require-default-prop
  value?: any;
  // eslint-disable-next-line vue/require-default-prop
  formModel?: any;
  /**
   * 部门 ID (用于过滤用户)
   */
  // eslint-disable-next-line vue/require-default-prop
  departmentId?: string;
  /**
   * 获取所有用户的 API
   */
  fetchAllApi: (configId: string) => Promise<any>;
  /**
   * 获取某部门下用户的 API
   */
  fetchByDeptApi: (configId: string, departmentId: string) => Promise<any>;
  /**
   * 标签字段
   */
  labelField?: string;
  /**
   * 值字段
   */
  valueField?: string;
  /**
   * 是否允许搜索
   */
  allowSearch?: boolean;
  /**
   * 是否多选
   */
  multiple?: boolean;
  /**
   * 是否允许手动输入
   */
  allowInput?: boolean;
  /**
   * 占位符
   */
  // eslint-disable-next-line vue/require-default-prop
  placeholder?: string;
  /**
   * 多选时值的格式化分隔符 (如 ",")
   */
  // eslint-disable-next-line vue/require-default-prop
  arrayValueFormat?: string;
}

const props = withDefaults(defineProps<Props>(), {
  labelField: 'name',
  valueField: 'id',
  allowSearch: true,
  multiple: true,
  allowInput: false,
});

const emit = defineEmits(['update:value', 'change']);

const { useReactivePlaceholder } = useNotifySelect(props.formModel);

/**
 * 响应式解析属性 (带防抖)
 */
const resolvedConfigId = useReactivePlaceholder(() => props.configId);
const resolvedDeptId = useReactivePlaceholder(() => props.departmentId);

const internalValue = computed({
  get: () => props.value,
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

/**
 * 动态 API 适配
 */
const dynamicApi = async () => {
  const currentConfigId = resolvedConfigId.value;
  const currentDeptId = resolvedDeptId.value;

  if (!currentConfigId) return [];

  // 如果有部门 ID，则按部门查询
  if (currentDeptId) {
    return props.fetchByDeptApi(currentConfigId, currentDeptId);
  }

  // 否则查询所有用户
  return props.fetchAllApi(currentConfigId);
};

/**
 * 构造 params 对象以触发 YlApiSelect 重新加载
 */
const combinedParams = computed(() => {
  return {
    _configId: resolvedConfigId.value,
    _deptId: resolvedDeptId.value,
  };
});
</script>

<template>
  <YlApiSelect
    v-bind="props"
    v-model:value="internalValue"
    :api="dynamicApi"
    :params="combinedParams"
    :label-field="labelField"
    :value-field="valueField"
    class="w-full"
  />
</template>
