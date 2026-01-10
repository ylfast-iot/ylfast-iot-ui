import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import DeviceSelectorContent from '../components/DeviceSelectorContent.vue';

export function useDeviceSelectorContent(props: CommonSelectorProps = {}) {
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

  const ConnectedDeviceSelectorContent = defineComponent({
    name: 'ConnectedDeviceSelectorContent',
    setup() {
      return () =>
        h(DeviceSelectorContent, {
          ref: contentRef,
          ...props,
        });
    },
  });

  return [ConnectedDeviceSelectorContent, methods] as const;
}
