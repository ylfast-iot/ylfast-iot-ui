<script setup lang="ts">
import type {
  Validator,
  YlConfigMetadataFormActionType,
  YlConfigMetadataFormProps,
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

import { Button as AButton, Form as AForm } from 'ant-design-vue';

import { renderConfigMetadataFormItems } from './renderConfigMetadataFormItems';

defineOptions({
  name: 'YlConfigMetadataForm',
});

const props = defineProps<YlConfigMetadataFormProps>();

const emit = defineEmits([
  'register',
  'change',
  'update:model',
  'update:modelValue',
  'submit',
  'reset',
]);

function getDefaultValues(prop: ConfigPropertyMetadata): any {
  const expands = prop.type.expands;
  if (expands?.defaultValue !== undefined) {
    return expands.defaultValue;
  }

  if (prop.type.type === 'OBJECT') {
    const obj: any = {};
    const subProps = (prop.type as any).properties; // For ObjectDef style
    if (Array.isArray(subProps)) {
      subProps.forEach((sub) => {
        const subDefault = getDefaultValues({
          property: sub.id,
          type: sub.valueType,
          name: sub.name,
          expands: sub.expands,
        } as any);
        if (subDefault !== undefined) {
          obj[sub.id] = subDefault;
        }
      });
    }
    return Object.keys(obj).length > 0 ? obj : undefined;
  }
  return undefined;
}

function initFormModelWithDefaults(
  metadata: ConfigMetadata | ConfigMetadata[] | undefined,
  model: Recordable,
) {
  if (!metadata) return;

  const allProperties: ConfigPropertyMetadata[] = [];
  if (Array.isArray(metadata)) {
    metadata.forEach((meta) => allProperties.push(...meta.properties));
  } else if ((metadata as any).properties) {
    allProperties.push(...(metadata as any).properties);
  }

  allProperties.forEach((prop) => {
    if (
      prop.type.type === 'OBJECT' &&
      prop.type.expands?.configMetadata &&
      model[prop.property] === undefined
    ) {
      model[prop.property] = {};
    } else if (model[prop.property] === undefined) {
      const defaultVal = getDefaultValues(prop);
      if (defaultVal !== undefined) {
        model[prop.property] = defaultVal;
      }
    }
  });
}

const slots = useSlots();

const formRef = ref();
const formModel = reactive<Recordable>({});
const metadataRef = ref<ConfigMetadata | ConfigMetadata[] | undefined>(
  props.metadata,
);
const childRefs = ref<{ [key: string]: Validator }>({});
const innerProps = ref<Partial<YlConfigMetadataFormProps>>({});

onBeforeUpdate(() => {
  childRefs.value = {};
});

// Filter props for Form to avoid passing component-specific props
const getFormProps = computed(() => {
  // @ts-ignore
  const mergedProps = { ...props, ...innerProps.value };
  const {
    metadata: _metadata,
    model: _model,
    modelValue: _modelValue,
    isNested: _isNested,
    hideRootHeader: _hideRootHeader,
    hideNestedHeader: _hideNestedHeader,
    showAction: _showAction,
    showSubmitButton: _showSubmitButton,
    showResetButton: _showResetButton,
    submitButtonText: _submitButtonText,
    resetButtonText: _resetButtonText,
    ...rest
  } = mergedProps;
  return rest;
});

// Normalize metadata to array
const groups = computed<ConfigMetadata[]>(() => {
  if (!metadataRef.value) return [];
  return Array.isArray(metadataRef.value)
    ? metadataRef.value
    : [metadataRef.value];
});

watch(
  () => props.model,
  (newVal) => {
    if (newVal) {
      Object.assign(formModel, newVal);
      initFormModelWithDefaults(metadataRef.value, formModel);
    }
  },
  { immediate: true, deep: true },
);

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      Object.assign(formModel, newVal);
      initFormModelWithDefaults(metadataRef.value, formModel);
    }
  },
  { immediate: true, deep: true },
);

watch(
  formModel,
  (newVal) => {
    emit('change', newVal);
    emit('update:model', newVal);
    emit('update:modelValue', newVal);
  },
  { deep: true },
);

watch(
  metadataRef,
  (newVal) => {
    initFormModelWithDefaults(newVal, formModel);
  },
  { immediate: true },
);

watch(
  () => props.metadata,
  (newVal) => {
    metadataRef.value = newVal;
  },
  { immediate: true },
);

// Functional Component Wrapper for Renderer
const ConfigItemsRenderer = (renderProps: any) => {
  return renderConfigMetadataFormItems({
    metadata: renderProps.metadata,
    model: renderProps.model,
    isNested: renderProps.isNested || renderProps['is-nested'],
    hideRootHeader:
      renderProps.hideRootHeader || renderProps['hide-root-header'],
    hideNestedHeader:
      renderProps.hideNestedHeader || renderProps['hide-nested-header'],
    slots,
    parentProps: getFormProps,
    registerRef: (property, el) => {
      if (el) {
        childRefs.value[property] = el;
      } else {
        delete childRefs.value[property];
      }
    },
  });
};

const action: YlConfigMetadataFormActionType = {
  setProps: (newProps) => {
    innerProps.value = { ...innerProps.value, ...newProps };

    if (newProps.metadata) {
      metadataRef.value = newProps.metadata;
    }
    if (newProps.model) {
      Object.assign(formModel, newProps.model);
    }
    // Ensure defaults are filled after setting props
    initFormModelWithDefaults(metadataRef.value, formModel);
  },
  validate: async () => {
    const selfValidation = formRef.value?.validate();
    const childrenValidations = Object.values(childRefs.value).map((child) => {
      if (child && typeof child.validate === 'function')
        return child.validate();
      return Promise.resolve();
    });

    await Promise.all([selfValidation, ...childrenValidations]);
    return formModel;
  },
  resetFields: async () => {
    formRef.value?.resetFields();
    Object.values(childRefs.value).forEach((child) => {
      if (child && typeof child.resetFields === 'function') child.resetFields();
    });

    // Clear and re-init with defaults
    const allProperties: ConfigPropertyMetadata[] = [];
    if (Array.isArray(metadataRef.value)) {
      metadataRef.value.forEach((meta) =>
        allProperties.push(...meta.properties),
      );
    } else if (metadataRef.value?.properties) {
      allProperties.push(...metadataRef.value.properties);
    }

    allProperties.forEach((prop) => {
      delete formModel[prop.property];
    });

    initFormModelWithDefaults(metadataRef.value, formModel);
  },
  setFieldsValue: (values) => {
    Object.assign(formModel, values);
  },
  getFieldsValue: () => {
    return { ...formModel };
  },
  setContextToConfigMetadataValues(ctx) {
    const _ctx = action.getFieldsValue()?._ctx || {};
    action.setFieldsValue({
      // 设置运行时上下文
      _ctx: {
        ..._ctx,
        ...ctx,
      },
    });
  },
};

async function handleSubmit() {
  try {
    await action.validate();
    emit('submit', { ...formModel });
  } catch {
    // validation failed
  }
}

function handleReset() {
  action.resetFields();
  emit('reset');
}

onMounted(() => {
  emit('register', action);
});

defineExpose(action);
</script>

<template>
  <div class="yl-config-metadata-form w-full">
    <AForm
      v-bind="getFormProps"
      ref="formRef"
      :model="formModel"
      :component="props.isNested ? 'div' : 'form'"
    >
      <ConfigItemsRenderer
        :metadata="groups"
        :model="formModel"
        :is-nested="props.isNested"
        :hide-root-header="props.hideRootHeader"
        :hide-nested-header="props.hideNestedHeader"
      />
    </AForm>

    <!-- Action Footer -->
    <div v-if="props.showAction" class="mt-4 w-full">
      <slot name="action" :submit="handleSubmit" :reset="handleReset">
        <div class="flex justify-end gap-2">
          <AButton v-if="props.showResetButton !== false" @click="handleReset">
            {{ props.resetButtonText || $t('ylConfigMetadataForm.reset') }}
          </AButton>
          <AButton
            v-if="props.showSubmitButton !== false"
            type="primary"
            @click="handleSubmit"
          >
            {{ props.submitButtonText || $t('ylConfigMetadataForm.submit') }}
          </AButton>
        </div>
      </slot>
    </div>
  </div>
</template>
