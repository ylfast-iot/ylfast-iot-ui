import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref } from 'vue';

import DeviceSelectorModal from '../components/DeviceSelectorModal.vue';

export function useDeviceModalSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedDeviceModalSelector = defineComponent({
    name: 'ConnectedDeviceModalSelector',
    setup() {
      return () =>
        h(DeviceSelectorModal, {
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

  return [ConnectedDeviceModalSelector, methods] as const;
}
