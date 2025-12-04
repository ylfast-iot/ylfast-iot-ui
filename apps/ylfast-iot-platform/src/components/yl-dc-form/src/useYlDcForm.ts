import type {
  DynamicCondition,
  UseYlDcFormReturnType,
  YlDcFormActionType,
  YlDcFormProps,
} from './types';

import { defineComponent, h, onUnmounted, ref, unref } from 'vue';

import YlDcForm from './index.vue';

export function useYlDcForm(
  props?: Partial<YlDcFormProps>,
): UseYlDcFormReturnType {
  const formAction = ref<null | YlDcFormActionType>(null);
  const loadedRef = ref<boolean | null>(false);

  function register(instance: YlDcFormActionType) {
    if (unref(loadedRef) && instance === unref(formAction)) return;

    formAction.value = instance;
    loadedRef.value = true;

    if (props) {
      instance.setProps(props);
    }
  }

  const getInstance = () => {
    const instance = unref(formAction);
    if (!instance) {
      console.error(
        'The form instance has not been obtained, please make sure that the form has been rendered when performing the form operation!',
      );
    }
    return instance;
  };

  const methods: YlDcFormActionType = {
    deleteCondition(key: string): Promise<void> {
      console.warn('The deleteCondition method is not implemented yet!', key);
      // TODO
      return Promise.resolve(undefined);
    },
    getAllConditions(): Promise<DynamicCondition[]> {
      console.warn('The getAllConditions method is not implemented yet!');
      // TODO
      return Promise.resolve([]);
    },
    loadCondition(key: string): Promise<void> {
      console.warn('The loadCondition method is not implemented yet!', key);
      // TODO
      return Promise.resolve(undefined);
    },
    saveCondition(name: string): Promise<void> {
      console.warn('The saveCondition method is not implemented yet!', name);
      // TODO
      return Promise.resolve(undefined);
    },
    search: async () => {
      const instance = getInstance();
      await instance?.search();
    },
    save: async () => {
      const instance = getInstance();
      await instance?.save();
    },
    setFieldsValue: async <T>(values: T) => {
      const instance = getInstance();
      await instance?.setFieldsValue(values);
    },
    resetFields: async () => {
      const instance = getInstance();
      await instance?.resetFields();
    },
    getFieldsValue: () => {
      const instance = getInstance();
      return instance?.getFieldsValue() || {};
    },
    clearValidate: async (name?: string | string[]) => {
      const instance = getInstance();
      await instance?.clearValidate(name);
    },
    updateSchema: async (data: any) => {
      const instance = getInstance();
      await instance?.updateSchema(data);
    },
    resetSchema: async (data: any) => {
      const instance = getInstance();
      await instance?.resetSchema(data);
    },
    setProps: async (props: Partial<YlDcFormProps>) => {
      const instance = getInstance();
      await instance?.setProps(props);
    },
    removeSchemaByField: async (field: string | string[]) => {
      const instance = getInstance();
      await instance?.removeSchemaByField(field);
    },
    appendSchemaByField: async (
      schema: any,
      prefixField: string | undefined,
      first?: boolean,
    ) => {
      const instance = getInstance();
      await instance?.appendSchemaByField(schema, prefixField, first);
    },
  };

  onUnmounted(() => {
    formAction.value = null;
    loadedRef.value = null;
  });

  const FormComponent = defineComponent({
    name: 'UseYlDcForm',
    setup(_, { attrs, slots }) {
      return () =>
        h(YlDcForm, { ...props, ...attrs, onRegister: register } as any, slots);
    },
  });

  return [FormComponent, methods];
}
