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
   * 是否以树形展示
   */
  isTree?: boolean | string;
  /**
   * 获取树形结构的 API
   */
  fetchTreeApi: (configId: string) => Promise<any>;
  /**
   * 获取列表结构的 API
   */
  fetchListApi: (configId: string) => Promise<any>;
  /**
   * 标签字段
   */
  labelField?: string;
  /**
   * 值字段
   */
  valueField?: string;
  /**
   * 子节点字段
   */
  childrenField?: string;
  /**
   * 是否允许搜索
   */
  allowSearch?: boolean;
  /**
   * 是否多选
   */
  multiple?: boolean;
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
  childrenField: 'children',
  isTree: false,
  allowSearch: true,
  multiple: false,
});

const emit = defineEmits(['update:value', 'change']);

const { useReactivePlaceholder } = useNotifySelect(props.formModel);

/**
 * 响应式解析属性 (带防抖)
 */
const resolvedConfigId = useReactivePlaceholder(() => props.configId);
const internalIsTree = useReactivePlaceholder(() => props.isTree);

const internalValue = computed({
  get: () => props.value,
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

/**
 * 解析后的 isTree (响应式结果)
 */
const resolvedIsTree = computed(() => {
  const val = internalIsTree.value;
  return val === 'true' || val === true;
});

/**
 * 动态 API 适配
 */
const dynamicApi = async () => {
  const currentConfigId = resolvedConfigId.value;
  if (!currentConfigId) return [];

  if (resolvedIsTree.value) {
    return props.fetchTreeApi(currentConfigId);
  }

  return props.fetchListApi(currentConfigId);
};

/**
 * 构造 params 对象以触发 YlApiSelect 重新加载
 */
const combinedParams = computed(() => {
  return {
    _configId: resolvedConfigId.value,
    _isTree: internalIsTree.value,
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
    :is-tree="resolvedIsTree"
    class="w-full"
  />
</template>
