import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import NetworkSelectorModal from '../components/NetworkSelectorModal.vue';

export function useNetworkModalSelector(props: CommonSelectorProps = {}) {
  const modalRef = ref();

  const methods = {
    clearSelection: () => {
      unref(modalRef)?.clearSelection();
    },
    close: () => {
      unref(modalRef)?.close();
    },
    open: (options: any = {}) => {
      unref(modalRef)?.open(options);
    },
    setSelection: (rows: any[]) => {
      unref(modalRef)?.setSelection(rows);
    },
  };

  const ConnectedNetworkSelectorModal = defineComponent({
    name: 'ConnectedNetworkSelectorModal',
    setup(_, { emit }) {
      return () =>
        h(NetworkSelectorModal, {
          ref: modalRef,
          ...props,
          onConfirm: (val: any, rows: any[]) => {
            emit('confirm', val, rows);
          },
        });
    },
  });

  return [ConnectedNetworkSelectorModal, methods] as const;
}
