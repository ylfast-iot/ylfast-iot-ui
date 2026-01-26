import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import MediaServerCardSelector from '../components/MediaServerCardSelector.vue';

export function useMediaServerCardSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedMediaServerCardSelector = defineComponent({
    name: 'ConnectedMediaServerCardSelector',
    setup(_, { slots }) {
      return () =>
        h(
          MediaServerCardSelector,
          {
            ref: cardRef,
            ...props,
          },
          slots,
        );
    },
  });

  return [ConnectedMediaServerCardSelector, methods] as const;
}
