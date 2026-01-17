import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref } from 'vue';

import CertificateListSelector from '../components/CertificateListSelector.vue';

export function useCertificateListSelector(props: CommonSelectorProps = {}) {
  const listRef = ref();

  const methods = {
    reload: () => {
      listRef.value?.reload();
    },
    clearSelection: () => {
      listRef.value?.clearSelection();
    },
    getSelection: () => {
      return listRef.value?.getSelection();
    },
    setSelection: (rows: any[]) => {
      listRef.value?.setSelection(rows);
    },
  };

  const ConnectedCertificateListSelector = defineComponent({
    name: 'ConnectedCertificateListSelector',
    setup() {
      return () =>
        h(CertificateListSelector, {
          ref: listRef,
          ...props,
        });
    },
  });

  return [ConnectedCertificateListSelector, methods] as const;
}
