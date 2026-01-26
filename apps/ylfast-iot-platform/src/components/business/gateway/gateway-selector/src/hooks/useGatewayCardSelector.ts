import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import GatewayCardSelector from '../components/GatewayCardSelector.vue';

export function useGatewayCardSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedGatewayCardSelector = defineComponent({
    name: 'ConnectedGatewayCardSelector',
    setup(_, { slots }) {
      return () =>
        h(
          GatewayCardSelector,
          {
            ref: cardRef,
            ...props,
          },
          slots,
        );
    },
  });

  return [ConnectedGatewayCardSelector, methods] as const;
}
