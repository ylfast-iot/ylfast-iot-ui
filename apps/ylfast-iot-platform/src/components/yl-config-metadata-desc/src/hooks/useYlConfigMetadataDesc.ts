import type { Ref } from 'vue';

import type {
  YlConfigMetadataDescActionType,
  YlConfigMetadataDescProps,
} from '../types';

import { ref } from 'vue';

type Nullable<T> = null | T;

/**
 * 使用配置元数据描述列表组件的 Hook
 * @param props 初始属性
 * @returns [register, methods]
 */
export function useYlConfigMetadataDesc(props?: YlConfigMetadataDescProps) {
  const descRef = ref<Nullable<YlConfigMetadataDescActionType>>(null);
  const loadedRef = ref(false);

  /**
   * 注册组件实例
   */
  function register(instance: YlConfigMetadataDescActionType) {
    descRef.value = instance;
    loadedRef.value = true;

    if (props) {
      instance.setProps(props);
    }
  }

  /**
   * 获取组件实例
   */
  function getInstance(): YlConfigMetadataDescActionType {
    const instance = descRef.value;
    if (!instance) {
      throw new Error(
        'YlConfigMetadataDesc instance has not been registered yet!',
      );
    }
    return instance;
  }

  const methods: YlConfigMetadataDescActionType = {
    submit: () => {
      return getInstance().submit();
    },
    setProps: (newProps: Partial<YlConfigMetadataDescProps>) => {
      getInstance().setProps(newProps);
    },
    toggleEditMode: () => {
      getInstance().toggleEditMode();
    },
    setEditMode: (mode: boolean) => {
      getInstance().setEditMode(mode);
    },
    validate: async () => {
      return await getInstance().validate();
    },
    resetFields: async () => {
      await getInstance().resetFields();
    },
    setFieldsValue: (values) => {
      getInstance().setFieldsValue(values);
    },
    getFieldsValue: () => {
      return getInstance().getFieldsValue();
    },
  };

  return [register, methods, { loaded: loadedRef as Ref<boolean> }] as const;
}
