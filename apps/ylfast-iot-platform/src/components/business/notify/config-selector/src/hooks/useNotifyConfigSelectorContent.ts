import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import NotifyConfigSelectorContent from '../components/NotifyConfigSelectorContent.vue';

export function useNotifyConfigSelectorContent(
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

  const ConnectedNotifyConfigSelectorContent = defineComponent({
    name: 'ConnectedNotifyConfigSelectorContent',
    setup() {
      return () =>
        h(NotifyConfigSelectorContent, {
          ref: contentRef,
          ...props,
        });
    },
  });

  return [ConnectedNotifyConfigSelectorContent, methods] as const;
}
