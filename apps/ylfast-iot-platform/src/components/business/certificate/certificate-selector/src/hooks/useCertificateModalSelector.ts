import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref } from 'vue';

import CertificateSelectorModal from '../components/CertificateSelectorModal.vue';

export function useCertificateModalSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedCertificateModalSelector = defineComponent({
    name: 'ConnectedCertificateModalSelector',
    setup() {
      return () =>
        h(CertificateSelectorModal, {
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

  return [ConnectedCertificateModalSelector, methods] as const;
}
