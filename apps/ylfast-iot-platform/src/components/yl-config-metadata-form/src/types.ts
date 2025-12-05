import type { FormProps } from 'ant-design-vue';

import type { ConfigMetadata } from '#/types/config-metadata';
import type { Recordable } from '#/types/data-type';

export interface YlConfigMetadataFormActionType {
  setProps: (props: Partial<YlConfigMetadataFormProps>) => void;
  validate: () => Promise<any>;
  resetFields: () => Promise<void>;
  setFieldsValue: (values: Recordable) => void;
  getFieldsValue: () => Recordable;
}

export interface Validator {
  validate: () => Promise<any>;
  resetFields: () => Promise<void>;
}

export interface YlConfigMetadataFormProps extends FormProps {
  metadata?: ConfigMetadata | ConfigMetadata[];
  // Initial values for the form
  model?: Recordable;
  // Vben Form / v-model support
  modelValue?: Recordable;

  // Explicitly define layout to ensure it's captured as a prop
  layout?: 'horizontal' | 'inline' | 'vertical';

  // Whether the form is nested inside another form
  isNested?: boolean;

  // Whether to hide the root header
  hideRootHeader?: boolean;
  // Whether to hide the nested header
  hideNestedHeader?: boolean;

  // Action Footer Configuration
  showAction?: boolean;
  showSubmitButton?: boolean;
  showResetButton?: boolean;
  submitButtonText?: string;
  resetButtonText?: string;
}
