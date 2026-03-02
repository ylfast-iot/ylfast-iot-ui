import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import NotifyConfigCardSelector from '../components/NotifyConfigCardSelector.vue';

export function useNotifyConfigCardSelector(props: CommonSelectorProps = {}) {
  const cardRef = ref();

  const methods = {
    getSelection: () => {
      return unref(cardRef)?.getSelection();
    },
    clearSelection: () => {
      unref(cardRef)?.clearSelection();
    },
    setSelection: (rows: any[]) => {
      unref(cardRef)?.setSelection(rows);
    },
  };

  const ConnectedNotifyConfigCardSelector = defineComponent({
    name: 'ConnectedNotifyConfigCardSelector',
    setup() {
      return () =>
        h(NotifyConfigCardSelector, {
          ref: cardRef,
          ...props,
        });
    },
  });

  return [ConnectedNotifyConfigCardSelector, methods] as const;
}
