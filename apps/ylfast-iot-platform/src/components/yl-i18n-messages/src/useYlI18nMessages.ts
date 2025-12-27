import type {
  I18nMessage,
  I18nMessagesData,
  UseYlI18nMessagesReturnType,
  YlI18nMessagesActionType,
  YlI18nMessagesProps,
} from './types';

import { ref, unref } from 'vue';

type Nullable<T> = null | T;

/**
 * yl-i18n-messages 组件的 Hook
 * 用于外部控制组件
 *
 * @param props 组件初始属性
 * @returns [register, methods] register 用于注册组件实例，methods 包含所有控制方法
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useYlI18nMessages } from '@/components/yl-i18n-messages';
 *
 * const [register, { getValue, addKey }] = useYlI18nMessages();
 *
 * async function handleAdd() {
 *   await addKey('newKey');
 * }
 * </script>
 *
 * <template>
 *   <YlI18nMessages @register="register" />
 * </template>
 * ```
 */
export function useYlI18nMessages(
  props?: YlI18nMessagesProps,
): UseYlI18nMessagesReturnType {
  const i18nMessagesRef = ref<Nullable<YlI18nMessagesActionType>>(null);
  const loadedRef = ref(false);

  /**
   * 注册组件实例
   */
  function register(instance: YlI18nMessagesActionType) {
    i18nMessagesRef.value = instance;
    loadedRef.value = true;

    // 如果有初始 props，设置它们
    if (props) {
      instance.setProps(props);
    }
  }

  /**
   * 获取组件实例
   */
  function getInstance(): YlI18nMessagesActionType {
    const instance = unref(i18nMessagesRef);
    if (!instance) {
      throw new Error(
        'The i18n messages instance has not been obtained yet, please make sure that the component has been rendered!',
      );
    }
    return instance;
  }

  /**
   * 代理所有方法
   */
  const methods: YlI18nMessagesActionType = {
    setProps: async (props: Partial<YlI18nMessagesProps>) => {
      await getInstance().setProps(props);
    },

    getValue: () => {
      return getInstance().getValue();
    },

    setValue: async (value: I18nMessagesData) => {
      await getInstance().setValue(value);
    },

    addKey: async (key: string, translations?: I18nMessage) => {
      await getInstance().addKey(key, translations);
    },

    removeKey: async (key: string) => {
      await getInstance().removeKey(key);
    },

    updateKey: async (oldKey: string, newKey: string) => {
      await getInstance().updateKey(oldKey, newKey);
    },

    updateTranslation: async (key: string, language: string, value: string) => {
      await getInstance().updateTranslation(key, language, value);
    },

    addLanguage: async (language: string) => {
      await getInstance().addLanguage(language);
    },

    removeLanguage: async (language: string) => {
      await getInstance().removeLanguage(language);
    },

    importData: async (data: I18nMessagesData) => {
      await getInstance().importData(data);
    },

    exportData: () => {
      return getInstance().exportData();
    },

    clear: async () => {
      await getInstance().clear();
    },
  };

  return [register, methods];
}
