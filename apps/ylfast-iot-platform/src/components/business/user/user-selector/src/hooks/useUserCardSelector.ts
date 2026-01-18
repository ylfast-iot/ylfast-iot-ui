import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import UserCardSelector from '../components/UserCardSelector.vue';

export function useUserCardSelector(props: CommonSelectorProps = {}) {
  const cardRef = ref();

  const methods = {
    clearSelection: () => {
      unref(cardRef)?.clearSelection();
    },
    getSelection: () => {
      return unref(cardRef)?.getSelection();
    },
    setSelection: (rows: any[]) => {
      unref(cardRef)?.setSelection(rows);
    },
  };

  const ConnectedUserCardSelector = defineComponent({
    name: 'ConnectedUserCardSelector',
    setup(_, { slots }) {
      return () =>
        h(
          UserCardSelector,
          {
            ref: cardRef,
            ...props,
          },
          slots,
        );
    },
  });

  return [ConnectedUserCardSelector, methods] as const;
}
