import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import ProductCardSelector from '../components/ProductCardSelector.vue';

export function useProductCardSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedProductCardSelector = defineComponent({
    name: 'ConnectedProductCardSelector',
    setup() {
      return () =>
        h(ProductCardSelector, {
          ref: cardRef,
          ...props,
        });
    },
  });

  return [ConnectedProductCardSelector, methods] as const;
}
