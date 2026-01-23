import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import PluginListSelector from '../components/PluginListSelector.vue';

export function usePluginListSelector(props: CommonSelectorProps = {}) {
  const listRef = ref();

  const methods = {
    getSelection: () => {
      return unref(listRef)?.getSelection();
    },
    clearSelection: () => {
      unref(listRef)?.clearSelection();
    },
    setSelection: (rows: any[]) => {
      unref(listRef)?.setSelection(rows);
    },
  };

  const ConnectedPluginListSelector = defineComponent({
    name: 'ConnectedPluginListSelector',
    setup() {
      return () =>
        h(PluginListSelector, {
          ref: listRef,
          ...props,
        });
    },
  });

  return [ConnectedPluginListSelector, methods] as const;
}
