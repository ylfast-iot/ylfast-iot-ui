import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import ProtocolListSelector from '../components/ProtocolListSelector.vue';

export function useProtocolListSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedProtocolListSelector = defineComponent({
    name: 'ConnectedProtocolListSelector',
    setup() {
      return () =>
        h(ProtocolListSelector, {
          ref: listRef,
          ...props,
        });
    },
  });

  return [ConnectedProtocolListSelector, methods] as const;
}
