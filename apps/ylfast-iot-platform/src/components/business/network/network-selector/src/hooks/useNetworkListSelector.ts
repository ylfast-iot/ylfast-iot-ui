import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import NetworkListSelector from '../components/NetworkListSelector.vue';

export function useNetworkListSelector(props: CommonSelectorProps = {}) {
  const listRef = ref();

  const methods = {
    clearSelection: () => {
      unref(listRef)?.clearSelection();
    },
    getSelection: () => {
      return unref(listRef)?.getSelection();
    },
    setSelection: (rows: any[]) => {
      unref(listRef)?.setSelection(rows);
    },
  };

  const ConnectedNetworkListSelector = defineComponent({
    name: 'ConnectedNetworkListSelector',
    setup(_, { slots }) {
      return () =>
        h(
          NetworkListSelector,
          {
            ref: listRef,
            ...props,
          },
          slots,
        );
    },
  });

  return [ConnectedNetworkListSelector, methods] as const;
}
