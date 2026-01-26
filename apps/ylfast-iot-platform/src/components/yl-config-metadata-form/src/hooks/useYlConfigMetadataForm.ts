import type { Recordable } from '@vben/types';

import type {
  YlConfigMetadataFormActionType,
  YlConfigMetadataFormProps,
} from '../types';

import { ref, unref } from 'vue';

/**
 * YlConfigMetadataForm 的 Hook
 * @param props 组件初始 Props
 */
export function useYlConfigMetadataForm(props?: YlConfigMetadataFormProps) {
  const ylConfigMetadataFormRef = ref<null | YlConfigMetadataFormActionType>(
    null,
  );

  /**
   * 注册实例
   * @param instance 组件实例
   */
  function register(instance: YlConfigMetadataFormActionType) {
    ylConfigMetadataFormRef.value = instance;
    if (props) {
      instance.setProps(props);
    }
  }

  /**
   * 获取 Action 实例
   */
  async function getAction() {
    const action = unref(ylConfigMetadataFormRef);
    if (!action) {
      throw new Error('组件未注册！');
    }
    return action;
  }

  async function setContextToConfigMetadataValues(ctx: Recordable<any>) {
    const action = await getAction();
    const _ctx = action.getFieldsValue()?._ctx || {};
    action.setFieldsValue({
      // 设置运行时上下文
      _ctx: {
        ..._ctx,
        ...ctx,
      },
    });
  }

  const methods: YlConfigMetadataFormActionType = {
    /**
     * 设置 Props
     */
    setProps: async (newProps: Partial<YlConfigMetadataFormProps>) => {
      const action = await getAction();
      action.setProps(newProps);
    },
    /**
     * 验证表单
     */
    validate: async () => {
      const action = await getAction();
      return action.validate();
    },
    /**
     * 重置表单
     */
    resetFields: async () => {
      const action = await getAction();
      return action.resetFields();
    },
    /**
     * 设置表单值
     */
    setFieldsValue: async (values: Recordable<any>) => {
      const action = await getAction();
      action.setFieldsValue(values);
    },
    /**
     * 获取表单值
     */
    getFieldsValue: () => {
      const action = unref(ylConfigMetadataFormRef);
      if (!action) {
        throw new Error('组件未注册！');
      }
      return action.getFieldsValue();
    },
    /**
     * 设置运行时上下文
     */
    setContextToConfigMetadataValues,
  };

  return [register, methods] as const;
}
