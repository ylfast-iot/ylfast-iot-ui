import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import PluginSelectorContent from '../components/PluginSelectorContent.vue';

export function usePluginSelectorContent(props: CommonSelectorProps = {}) {
  const contentRef = ref();

  const methods = {
    getSelection: () => {
      return unref(contentRef)?.getSelection();
    },
    setMode: (mode: 'card' | 'table') => {
      unref(contentRef)?.setMode(mode);
    },
    clearSelection: () => {
      unref(contentRef)?.clearSelection();
    },
    setSelection: (rows: any[]) => {
      unref(contentRef)?.setSelection(rows);
    },
  };

  const ConnectedPluginSelectorContent = defineComponent({
    name: 'ConnectedPluginSelectorContent',
    setup() {
      return () =>
        h(PluginSelectorContent, {
          ref: contentRef,
          ...props,
        });
    },
  });

  return [ConnectedPluginSelectorContent, methods] as const;
}
