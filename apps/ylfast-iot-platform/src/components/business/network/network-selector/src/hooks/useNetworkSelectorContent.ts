import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import NetworkSelectorContent from '../components/NetworkSelectorContent.vue';

export function useNetworkSelectorContent(props: CommonSelectorProps = {}) {
  const contentRef = ref();

  const methods = {
    clearSelection: () => {
      unref(contentRef)?.clearSelection();
    },
    getSelection: () => {
      return unref(contentRef)?.getSelection();
    },
    setMode: (mode: 'card' | 'table') => {
      unref(contentRef)?.setMode(mode);
    },
    setSelection: (rows: any[]) => {
      unref(contentRef)?.setSelection(rows);
    },
  };

  const ConnectedNetworkSelectorContent = defineComponent({
    name: 'ConnectedNetworkSelectorContent',
    setup(_, { slots }) {
      return () =>
        h(
          NetworkSelectorContent,
          {
            ref: contentRef,
            ...props,
          },
          slots,
        );
    },
  });

  return [ConnectedNetworkSelectorContent, methods] as const;
}
