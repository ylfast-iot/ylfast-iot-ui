<script setup lang="ts">
import type {
  YlConfigMetadataDescActionType,
  YlConfigMetadataDescProps,
} from './types';

import type {
  ConfigMetadata,
  ConfigPropertyMetadata,
} from '#/types/config-metadata';
import type { Recordable } from '#/types/data-type';

import {
  computed,
  onBeforeUpdate,
  onMounted,
  reactive,
  ref,
  useSlots,
  watch,
} from 'vue';

import { $t } from '@vben/locales';

import { Button } from 'ant-design-vue';

import { renderConfigMetadataDescItems } from './renderConfigMetadataDescItems';

defineOptions({
  name: 'YlConfigMetadataDesc',
});

const props = withDefaults(defineProps<YlConfigMetadataDescProps>(), {
  editMode: false,
  showEditButton: true,
  bordered: true,
  layout: 'vertical',
  size: 'small',
  column: () => ({ xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }),
});

const emit = defineEmits([
  'register',
  'change',
  'update:model',
  'update:modelValue',
  'update:editMode',
  'save',
  'cancel',
]);

const slots = useSlots();

const formModel = reactive<Recordable>({});
const metadataRef = ref<ConfigMetadata | ConfigMetadata[] | undefined>(
  props.metadata,
);
const childRefs = ref<{ [key: string]: any }>({});
const innerProps = ref<Partial<YlConfigMetadataDescProps>>({});
const internalEditMode = ref(props.editMode);

onBeforeUpdate(() => {
  childRefs.value = {};
});

// 过滤 Descriptions 的 props
const getDescriptionsProps = computed(() => {
  // @ts-ignore
  const mergedProps: any = { ...props, ...innerProps.value };
  const {
    metadata: _metadata,
    model: _model,
    modelValue: _modelValue,
    editMode: _editMode,
    showEditButton: _showEditButton,
    editButtonText: _editButtonText,
    cancelButtonText: _cancelButtonText,
    saveButtonText: _saveButtonText,
    isNested: _isNested,
    hideRootHeader: _hideRootHeader,
    hideNestedHeader: _hideNestedHeader,
    ...rest
  } = mergedProps;

  return rest;
});

// 规范化元数据为数组
const groups = computed<ConfigMetadata[]>(() => {
  if (!metadataRef.value) return [];
  return Array.isArray(metadataRef.value)
    ? metadataRef.value
    : [metadataRef.value];
});

// 监听 model 变化
watch(
  () => props.model,
  (newVal) => {
    if (newVal) {
      Object.assign(formModel, newVal);
    }
  },
  { immediate: true, deep: true },
);

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      Object.assign(formModel, newVal);
    }
  },
  { immediate: true, deep: true },
);

// 监听 formModel 变化
watch(
  formModel,
  (newVal) => {
    emit('change', newVal);
    emit('update:model', newVal);
    emit('update:modelValue', newVal);
  },
  { deep: true },
);

// 监听 metadata 变化
watch(
  () => props.metadata,
  (newVal) => {
    metadataRef.value = newVal;
    const allProperties: ConfigPropertyMetadata[] = [];

    if (Array.isArray(newVal)) {
      newVal.forEach((meta) => allProperties.push(...meta.properties));
    } else if (newVal?.properties) {
      allProperties.push(...newVal.properties);
    }

    allProperties.forEach((prop) => {
      if (
        prop.type.type === 'OBJECT' &&
        prop.type.expands?.configMetadata &&
        formModel[prop.property] === undefined
      ) {
        formModel[prop.property] = {};
      } else if (
        prop.type.expands?.defaultValue !== undefined &&
        formModel[prop.property] === undefined
      ) {
        formModel[prop.property] = prop.type.expands.defaultValue;
      }
    });
  },
  { immediate: true },
);

// 监听 editMode 变化
watch(
  () => props.editMode,
  (newVal) => {
    internalEditMode.value = newVal;
  },
  { immediate: true },
);

// 功能组件包装器
const ConfigItemsRenderer = (renderProps: any) => {
  const editMode = renderProps.editMode || renderProps['edit-mode'];

  return renderConfigMetadataDescItems({
    metadata: renderProps.metadata,
    model: renderProps.model,
    editMode,
    isNested: renderProps.isNested || renderProps['is-nested'],
    hideRootHeader:
      renderProps.hideRootHeader || renderProps['hide-root-header'],
    hideNestedHeader:
      renderProps.hideNestedHeader || renderProps['hide-nested-header'],
    slots,
    parentProps: getDescriptionsProps,
    registerRef: (property, el) => {
      if (el) childRefs.value[property] = el;
    },
  });
};

// 切换编辑模式
function toggleEditMode() {
  internalEditMode.value = !internalEditMode.value;
  emit('update:editMode', internalEditMode.value);
}

// 设置编辑模式
function setEditMode(mode: boolean) {
  internalEditMode.value = mode;
  emit('update:editMode', mode);
}

// 保存
async function handleSave() {
  try {
    await action.validate();
    emit('save', { ...formModel });
    internalEditMode.value = false;
    emit('update:editMode', false);
  } catch {
    // 验证失败
  }
}

// 取消
function handleCancel() {
  internalEditMode.value = false;
  emit('update:editMode', false);
  emit('cancel');
}

// Action 接口
const action: YlConfigMetadataDescActionType = {
  setProps: (newProps) => {
    innerProps.value = { ...innerProps.value, ...newProps };

    if (newProps.metadata) {
      metadataRef.value = newProps.metadata;
    }
    if (newProps.model) {
      Object.assign(formModel, newProps.model);
    }
    if (newProps.editMode !== undefined) {
      internalEditMode.value = newProps.editMode;
    }
  },
  toggleEditMode,
  setEditMode,
  validate: async () => {
    // 验证所有子组件
    const childrenValidations = Object.values(childRefs.value).map((child) => {
      if (child && typeof child.validate === 'function')
        return child.validate();
      return Promise.resolve();
    });

    await Promise.all(childrenValidations);
    return formModel;
  },
  resetFields: async () => {
    Object.values(childRefs.value).forEach((child) => {
      if (child && typeof child.resetFields === 'function') child.resetFields();
    });

    const allProperties: ConfigPropertyMetadata[] = [];
    if (Array.isArray(metadataRef.value)) {
      metadataRef.value.forEach((meta) =>
        allProperties.push(...meta.properties),
      );
    } else if (metadataRef.value?.properties) {
      allProperties.push(...metadataRef.value.properties);
    }

    allProperties.forEach((prop) => {
      if (prop.type.type === 'OBJECT' && prop.type.expands?.configMetadata) {
        formModel[prop.property] = {};
      } else if (prop.type.expands?.defaultValue === undefined) {
        delete formModel[prop.property];
      } else {
        formModel[prop.property] = prop.type.expands.defaultValue;
      }
    });
  },
  setFieldsValue: (values) => {
    Object.assign(formModel, values);
  },
  getFieldsValue: () => {
    return { ...formModel };
  },
};

onMounted(() => {
  emit('register', action);
});

defineExpose(action);
</script>

<template>
  <div class="yl-config-metadata-desc w-full">
    <!-- 操作按钮 -->
    <div v-if="!isNested && showEditButton" class="mb-4 flex justify-end gap-2">
      <template v-if="!internalEditMode">
        <Button type="primary" @click="toggleEditMode">
          {{ editButtonText || $t('ylConfigMetadataDesc.edit') }}
        </Button>
      </template>
      <template v-else>
        <Button @click="handleCancel">
          {{ cancelButtonText || $t('ylConfigMetadataDesc.cancel') }}
        </Button>
        <Button type="primary" @click="handleSave">
          {{ saveButtonText || $t('ylConfigMetadataDesc.save') }}
        </Button>
      </template>
    </div>

    <!-- 描述列表 -->
    <ConfigItemsRenderer
      :edit-mode="internalEditMode"
      :hide-nested-header="props.hideNestedHeader"
      :hide-root-header="props.hideRootHeader"
      :is-nested="props.isNested"
      :metadata="groups"
      :model="formModel"
    />
  </div>
</template>

<style scoped>
.yl-config-metadata-desc {
  /* 组件样式 */
}
</style>
