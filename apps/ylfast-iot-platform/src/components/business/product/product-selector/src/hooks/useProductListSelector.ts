import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import ProductListSelector from '../components/ProductListSelector.vue';

export function useProductListSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedProductListSelector = defineComponent({
    name: 'ConnectedProductListSelector',
    setup() {
      return () =>
        h(ProductListSelector, {
          ref: listRef,
          ...props,
        });
    },
  });

  return [ConnectedProductListSelector, methods] as const;
}
