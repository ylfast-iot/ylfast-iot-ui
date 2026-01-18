import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import ProtocolCardSelector from '../components/ProtocolCardSelector.vue';

export function useProtocolCardSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedProtocolCardSelector = defineComponent({
    name: 'ConnectedProtocolCardSelector',
    setup() {
      return () =>
        h(ProtocolCardSelector, {
          ref: cardRef,
          ...props,
        });
    },
  });

  return [ConnectedProtocolCardSelector, methods] as const;
}
