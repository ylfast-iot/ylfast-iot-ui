import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import NotifyConfigSelectorModal from '../components/NotifyConfigSelectorModal.vue';

export function useNotifyConfigModalSelector(props: CommonSelectorProps = {}) {
  const modalRef = ref();

  const methods = {
    open: (options: any) => {
      unref(modalRef)?.open(options);
    },
    close: () => {
      unref(modalRef)?.close();
    },
  };

  const ConnectedNotifyConfigModalSelector = defineComponent({
    name: 'ConnectedNotifyConfigModalSelector',
    setup() {
      return () =>
        h(NotifyConfigSelectorModal, {
          ref: modalRef,
          ...props,
        });
    },
  });

  return [ConnectedNotifyConfigModalSelector, methods] as const;
}
