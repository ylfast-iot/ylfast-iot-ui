import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import DeviceCardSelector from '../components/DeviceCardSelector.vue';

export function useDeviceCardSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedDeviceCardSelector = defineComponent({
    name: 'ConnectedDeviceCardSelector',
    setup() {
      return () =>
        h(DeviceCardSelector, {
          ref: cardRef,
          ...props,
        });
    },
  });

  return [ConnectedDeviceCardSelector, methods] as const;
}
