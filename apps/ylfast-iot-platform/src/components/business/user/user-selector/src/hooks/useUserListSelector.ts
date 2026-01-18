import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import UserListSelector from '../components/UserListSelector.vue';

export function useUserListSelector(props: CommonSelectorProps = {}) {
  const listRef = ref();

  const methods = {
    clearSelection: () => {
      unref(listRef)?.clearSelection();
    },
    getSelection: () => {
      return unref(listRef)?.getSelection();
    },
    setSelection: (rows: any[]) => {
      unref(listRef)?.setSelection(rows);
    },
  };

  const ConnectedUserListSelector = defineComponent({
    name: 'ConnectedUserListSelector',
    setup(_, { slots }) {
      return () =>
        h(
          UserListSelector,
          {
            ref: listRef,
            ...props,
          },
          slots,
        );
    },
  });

  return [ConnectedUserListSelector, methods] as const;
}
