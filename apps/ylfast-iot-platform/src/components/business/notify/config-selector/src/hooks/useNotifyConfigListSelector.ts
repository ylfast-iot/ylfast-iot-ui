import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import NotifyConfigListSelector from '../components/NotifyConfigListSelector.vue';

export function useNotifyConfigListSelector(props: CommonSelectorProps = {}) {
  const listRef = ref();

  const methods = {
    getSelection: () => {
      return unref(listRef)?.getSelection();
    },
    clearSelection: () => {
      unref(listRef)?.clearSelection();
    },
    setSelection: (rows: any[]) => {
      unref(listRef)?.setSelection(rows);
    },
  };

  const ConnectedNotifyConfigListSelector = defineComponent({
    name: 'ConnectedNotifyConfigListSelector',
    setup() {
      return () =>
        h(NotifyConfigListSelector, {
          ref: listRef,
          ...props,
        });
    },
  });

  return [ConnectedNotifyConfigListSelector, methods] as const;
}
