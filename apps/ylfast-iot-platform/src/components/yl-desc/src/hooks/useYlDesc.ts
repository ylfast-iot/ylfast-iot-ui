import type {
  UseYlDescReturnType,
  YlDescActionType,
  YlDescProps,
  YlDescSchema,
} from '../types';

import { defineComponent, h, onUnmounted, ref, unref } from 'vue';

import YlDesc from '../index.vue';

export function useYlDesc(props?: Partial<YlDescProps>): UseYlDescReturnType {
  const descAction = ref<null | YlDescActionType>(null);
  const loadedRef = ref<boolean | null>(false);

  function register(instance: YlDescActionType) {
    if (unref(loadedRef) && instance === unref(descAction)) return;

    descAction.value = instance;
    loadedRef.value = true;

    if (props) {
      instance.setProps(props);
    }
  }

  const getInstance = () => {
    const instance = unref(descAction);
    if (!instance) {
      console.error(
        'The desc instance has not been obtained, please make sure that the desc has been rendered!',
      );
    }
    return instance;
  };

  const methods: YlDescActionType = {
    setProps: async (props: Partial<YlDescProps>) => {
      const instance = getInstance();
      await instance?.setProps(props);
    },
    setDescProps: (props: Partial<YlDescProps>) => {
      const instance = getInstance();
      instance?.setDescProps(props);
    },
    updateSchema: async (
      data: Partial<YlDescSchema> | Partial<YlDescSchema>[],
    ) => {
      const instance = getInstance();
      await instance?.updateSchema(data);
    },
    resetSchema: async (
      data: Partial<YlDescSchema> | Partial<YlDescSchema>[],
    ) => {
      const instance = getInstance();
      await instance?.resetSchema(data);
    },
    getFieldsValue: () => {
      const instance = getInstance();
      return instance?.getFieldsValue() || {};
    },
  };

  onUnmounted(() => {
    descAction.value = null;
    loadedRef.value = null;
  });

  const DescComponent = defineComponent({
    name: 'UseYlDesc',
    setup(_, { attrs, slots }) {
      return () =>
        h(YlDesc, { ...props, ...attrs, onRegister: register } as any, slots);
    },
  });

  return [DescComponent, methods];
}
