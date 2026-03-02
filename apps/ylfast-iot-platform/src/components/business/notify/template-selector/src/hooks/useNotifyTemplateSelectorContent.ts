import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import NotifyTemplateSelectorContent from '../components/NotifyTemplateSelectorContent.vue';

export function useNotifyTemplateSelectorContent(
  props: CommonSelectorProps = {},
) {
  const contentRef = ref();

  const methods = {
    getSelection: () => {
      return unref(contentRef)?.getSelection();
    },
    clearSelection: () => {
      unref(contentRef)?.clearSelection();
    },
    setSelection: (rows: any[]) => {
      unref(contentRef)?.setSelection(rows);
    },
    setMode: (mode: 'card' | 'table') => {
      unref(contentRef)?.setMode(mode);
    },
  };

  const ConnectedNotifyTemplateSelectorContent = defineComponent({
    name: 'ConnectedNotifyTemplateSelectorContent',
    setup() {
      return () =>
        h(NotifyTemplateSelectorContent, {
          ref: contentRef,
          ...props,
        });
    },
  });

  return [ConnectedNotifyTemplateSelectorContent, methods] as const;
}
