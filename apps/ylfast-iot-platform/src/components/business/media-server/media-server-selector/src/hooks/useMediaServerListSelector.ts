import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import MediaServerListSelector from '../components/MediaServerListSelector.vue';

export function useMediaServerListSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedMediaServerListSelector = defineComponent({
    name: 'ConnectedMediaServerListSelector',
    setup(_, { slots }) {
      return () =>
        h(
          MediaServerListSelector,
          {
            ref: listRef,
            ...props,
          },
          slots,
        );
    },
  });

  return [ConnectedMediaServerListSelector, methods] as const;
}
