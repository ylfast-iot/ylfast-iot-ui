import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import PluginCardSelector from '../components/PluginCardSelector.vue';

export function usePluginCardSelector(props: CommonSelectorProps = {}) {
  const cardRef = ref();

  const methods = {
    getSelection: () => {
      return unref(cardRef)?.getSelection();
    },
    clearSelection: () => {
      unref(cardRef)?.clearSelection();
    },
    setSelection: (rows: any[]) => {
      unref(cardRef)?.setSelection(rows);
    },
  };

  const ConnectedPluginCardSelector = defineComponent({
    name: 'ConnectedPluginCardSelector',
    setup() {
      return () =>
        h(PluginCardSelector, {
          ref: cardRef,
          ...props,
        });
    },
  });

  return [ConnectedPluginCardSelector, methods] as const;
}
