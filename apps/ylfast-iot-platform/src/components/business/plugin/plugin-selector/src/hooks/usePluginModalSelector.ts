import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref } from 'vue';

import PluginSelectorModal from '../components/PluginSelectorModal.vue';

export function usePluginModalSelector(props: CommonSelectorProps = {}) {
  const modalRef = ref();
  let resolvePromise: ((val: any) => void) | null = null;

  const methods = {
    open: (options: any = {}) => {
      modalRef.value?.open(options);
      return new Promise<{ rows: any[]; value: string | string[] }>(
        (resolve) => {
          resolvePromise = resolve;
        },
      );
    },
    close: () => {
      modalRef.value?.close();
    },
  };

  const ConnectedPluginModalSelector = defineComponent({
    name: 'ConnectedPluginModalSelector',
    setup() {
      return () =>
        h(PluginSelectorModal, {
          ref: modalRef,
          ...props,
          onConfirm: (val: any, records: any[]) => {
            if (resolvePromise) {
              resolvePromise({ value: val, rows: records });
            }
          },
        });
    },
  });

  return [ConnectedPluginModalSelector, methods] as const;
}
