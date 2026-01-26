import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import GatewayListSelector from '../components/GatewayListSelector.vue';

export function useGatewayListSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedGatewayListSelector = defineComponent({
    name: 'ConnectedGatewayListSelector',
    setup(_, { slots }) {
      return () =>
        h(
          GatewayListSelector,
          {
            ref: listRef,
            ...props,
          },
          slots,
        );
    },
  });

  return [ConnectedGatewayListSelector, methods] as const;
}
