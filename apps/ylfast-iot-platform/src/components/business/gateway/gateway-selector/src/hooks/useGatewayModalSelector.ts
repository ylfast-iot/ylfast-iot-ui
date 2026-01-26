import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import GatewaySelectorModal from '../components/GatewaySelectorModal.vue';

export function useGatewayModalSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedGatewaySelectorModal = defineComponent({
    name: 'ConnectedGatewaySelectorModal',
    setup(_, { emit }) {
      return () =>
        h(GatewaySelectorModal, {
          ref: modalRef,
          ...props,
          onConfirm: (val: any, rows: any[]) => {
            emit('confirm', val, rows);
          },
        });
    },
  });

  return [ConnectedGatewaySelectorModal, methods] as const;
}
