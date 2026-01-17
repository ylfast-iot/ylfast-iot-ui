import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref } from 'vue';

import CertificateSelectorContent from '../components/CertificateSelectorContent.vue';

export function useCertificateSelectorContent(props: CommonSelectorProps = {}) {
  const contentRef = ref();

  const methods = {
    reload: () => {
      contentRef.value?.reload();
    },
    clearSelection: () => {
      contentRef.value?.clearSelection();
    },
    getSelection: () => {
      return contentRef.value?.getSelection();
    },
    setSelection: (rows: any[]) => {
      contentRef.value?.setSelection(rows);
    },
    setMode: (mode: 'card' | 'table') => {
      contentRef.value?.setMode(mode);
    },
  };

  const ConnectedCertificateSelectorContent = defineComponent({
    name: 'ConnectedCertificateSelectorContent',
    setup() {
      return () =>
        h(CertificateSelectorContent, {
          ref: contentRef,
          ...props,
        });
    },
  });

  return [ConnectedCertificateSelectorContent, methods] as const;
}
