import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref } from 'vue';

import ProductSelectorModal from '../components/ProductSelectorModal.vue';

export function useProductModalSelector(props: CommonSelectorProps = {}) {
  const modalRef = ref();
  let resolvePromise: ((val: any) => void) | null = null;

  const methods = {
    open: (options: any = {}) => {
      modalRef.value?.open(options);
      return new Promise<{ rows: any[]; value: string | string[] }>(
        (resolve) => {
          resolvePromise = resolve;
        },
      );
    },
    close: () => {
      modalRef.value?.close();
    },
  };

  const ConnectedProductModalSelector = defineComponent({
    name: 'ConnectedProductModalSelector',
    setup() {
      return () =>
        h(ProductSelectorModal, {
          ref: modalRef,
          ...props,
          onConfirm: (val: any, records: any[]) => {
            if (resolvePromise) {
              resolvePromise({ value: val, rows: records });
            }
          },
        });
    },
  });

  return [ConnectedProductModalSelector, methods] as const;
}
