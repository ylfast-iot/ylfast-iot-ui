import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import NotifyTemplateListSelector from '../components/NotifyTemplateListSelector.vue';

export function useNotifyTemplateListSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedNotifyTemplateListSelector = defineComponent({
    name: 'ConnectedNotifyTemplateListSelector',
    setup() {
      return () =>
        h(NotifyTemplateListSelector, {
          ref: listRef,
          ...props,
        });
    },
  });

  return [ConnectedNotifyTemplateListSelector, methods] as const;
}
