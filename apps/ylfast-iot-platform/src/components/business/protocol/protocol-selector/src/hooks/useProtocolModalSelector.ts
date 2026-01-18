import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref } from 'vue';

import ProtocolSelectorModal from '../components/ProtocolSelectorModal.vue';

export function useProtocolModalSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedProtocolModalSelector = defineComponent({
    name: 'ConnectedProtocolModalSelector',
    setup() {
      return () =>
        h(ProtocolSelectorModal, {
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

  return [ConnectedProtocolModalSelector, methods] as const;
}
