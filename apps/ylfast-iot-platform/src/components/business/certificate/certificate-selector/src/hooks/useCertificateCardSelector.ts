import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref } from 'vue';

import CertificateCardSelector from '../components/CertificateCardSelector.vue';

export function useCertificateCardSelector(props: CommonSelectorProps = {}) {
  const cardRef = ref();

  const methods = {
    reload: () => {
      cardRef.value?.reload();
    },
    clearSelection: () => {
      cardRef.value?.clearSelection();
    },
    getSelection: () => {
      return cardRef.value?.getSelection();
    },
    setSelection: (rows: any[]) => {
      cardRef.value?.setSelection(rows);
    },
  };

  const ConnectedCertificateCardSelector = defineComponent({
    name: 'ConnectedCertificateCardSelector',
    setup() {
      return () =>
        h(CertificateCardSelector, {
          ref: cardRef,
          ...props,
        });
    },
  });

  return [ConnectedCertificateCardSelector, methods] as const;
}
