import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import NotifyTemplateCardSelector from '../components/NotifyTemplateCardSelector.vue';

export function useNotifyTemplateCardSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedNotifyTemplateCardSelector = defineComponent({
    name: 'ConnectedNotifyTemplateCardSelector',
    setup() {
      return () =>
        h(NotifyTemplateCardSelector, {
          ref: cardRef,
          ...props,
        });
    },
  });

  return [ConnectedNotifyTemplateCardSelector, methods] as const;
}
