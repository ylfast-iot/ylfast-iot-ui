import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref } from 'vue';

import ProductSelector from '../index.vue';

export function useProductSelector(props: CommonSelectorProps = {}) {
  const selectorRef = ref();
  let resolvePromise: ((val: any) => void) | null = null;

  const methods = {
    open: (options: any = {}) => {
      selectorRef.value?.open(options);
      return new Promise<{ rows: any[]; value: string | string[] }>(
        (resolve) => {
          resolvePromise = resolve;
        },
      );
    },
    close: () => {
      selectorRef.value?.close();
    },
  };

  const ConnectedProductSelector = defineComponent({
    name: 'ConnectedProductSelector',
    setup() {
      return () =>
        h(ProductSelector, {
          ref: selectorRef,
          ...props,
          onChange: (val: any, records: any[]) => {
            if (resolvePromise) {
              resolvePromise({ value: val, rows: records });
            }
          },
        });
    },
  });

  return [ConnectedProductSelector, methods] as const;
}
