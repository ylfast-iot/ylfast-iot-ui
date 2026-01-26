import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import MediaServerSelectorContent from '../components/MediaServerSelectorContent.vue';

export function useMediaServerSelectorContent(props: CommonSelectorProps = {}) {
  const contentRef = ref();

  const methods = {
    clearSelection: () => {
      unref(contentRef)?.clearSelection();
    },
    getSelection: () => {
      return unref(contentRef)?.getSelection();
    },
    setSelection: (rows: any[]) => {
      unref(contentRef)?.setSelection(rows);
    },
  };

  const ConnectedMediaServerSelectorContent = defineComponent({
    name: 'ConnectedMediaServerSelectorContent',
    setup(_, { slots }) {
      return () =>
        h(
          MediaServerSelectorContent,
          {
            ref: contentRef,
            ...props,
          },
          slots,
        );
    },
  });

  return [ConnectedMediaServerSelectorContent, methods] as const;
}
