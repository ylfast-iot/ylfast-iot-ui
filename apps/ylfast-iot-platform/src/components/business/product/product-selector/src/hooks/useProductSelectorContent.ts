import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import ProductSelectorContent from '../components/ProductSelectorContent.vue';

export function useProductSelectorContent(props: CommonSelectorProps = {}) {
  const contentRef = ref();

  const methods = {
    getSelection: () => {
      return unref(contentRef)?.getSelection();
    },
    setMode: (mode: 'card' | 'table') => {
      unref(contentRef)?.setMode(mode);
    },
    clearSelection: () => {
      unref(contentRef)?.clearSelection();
    },
    setSelection: (rows: any[]) => {
      unref(contentRef)?.setSelection(rows);
    },
  };

  const ConnectedProductSelectorContent = defineComponent({
    name: 'ConnectedProductSelectorContent',
    setup() {
      return () =>
        h(ProductSelectorContent, {
          ref: contentRef,
          ...props,
        });
    },
  });

  return [ConnectedProductSelectorContent, methods] as const;
}
