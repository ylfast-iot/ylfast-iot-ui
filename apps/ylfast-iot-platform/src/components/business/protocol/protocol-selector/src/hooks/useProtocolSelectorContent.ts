import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import ProtocolSelectorContent from '../components/ProtocolSelectorContent.vue';

export function useProtocolSelectorContent(props: CommonSelectorProps = {}) {
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

  const ConnectedProtocolSelectorContent = defineComponent({
    name: 'ConnectedProtocolSelectorContent',
    setup() {
      return () =>
        h(ProtocolSelectorContent, {
          ref: contentRef,
          ...props,
        });
    },
  });

  return [ConnectedProtocolSelectorContent, methods] as const;
}
