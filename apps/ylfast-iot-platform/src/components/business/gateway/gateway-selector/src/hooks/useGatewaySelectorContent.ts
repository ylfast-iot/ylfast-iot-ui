import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import GatewaySelectorContent from '../components/GatewaySelectorContent.vue';

export function useGatewaySelectorContent(props: CommonSelectorProps = {}) {
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

  const ConnectedGatewaySelectorContent = defineComponent({
    name: 'ConnectedGatewaySelectorContent',
    setup(_, { slots }) {
      return () =>
        h(
          GatewaySelectorContent,
          {
            ref: contentRef,
            ...props,
          },
          slots,
        );
    },
  });

  return [ConnectedGatewaySelectorContent, methods] as const;
}
