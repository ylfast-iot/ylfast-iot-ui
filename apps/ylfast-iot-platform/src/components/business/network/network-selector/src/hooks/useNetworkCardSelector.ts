import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import NetworkCardSelector from '../components/NetworkCardSelector.vue';

export function useNetworkCardSelector(props: CommonSelectorProps = {}) {
  const cardRef = ref();

  const methods = {
    clearSelection: () => {
      unref(cardRef)?.clearSelection();
    },
    getSelection: () => {
      return unref(cardRef)?.getSelection();
    },
    setSelection: (rows: any[]) => {
      unref(cardRef)?.setSelection(rows);
    },
  };

  const ConnectedNetworkCardSelector = defineComponent({
    name: 'ConnectedNetworkCardSelector',
    setup(_, { slots }) {
      return () =>
        h(
          NetworkCardSelector,
          {
            ref: cardRef,
            ...props,
          },
          slots,
        );
    },
  });

  return [ConnectedNetworkCardSelector, methods] as const;
}
