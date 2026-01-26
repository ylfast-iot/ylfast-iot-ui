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
    }
  },
  { immediate: true, deep: true },
);

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      Object.assign(formModel, newVal);
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
      if (el) childRefs.value[property] = el;
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
    <AForm v-bind="getFormProps" ref="formRef" :model="formModel">
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
