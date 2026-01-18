import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import UserSelectorContent from '../components/UserSelectorContent.vue';

export function useUserSelectorContent(props: CommonSelectorProps = {}) {
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

  const ConnectedUserSelectorContent = defineComponent({
    name: 'ConnectedUserSelectorContent',
    setup(_, { slots }) {
      return () =>
        h(
          UserSelectorContent,
          {
            ref: contentRef,
            ...props,
          },
          slots,
        );
    },
  });

  return [ConnectedUserSelectorContent, methods] as const;
}
