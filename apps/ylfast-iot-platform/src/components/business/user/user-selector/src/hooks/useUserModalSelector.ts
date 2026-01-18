import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import UserSelectorModal from '../components/UserSelectorModal.vue';

export function useUserModalSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedUserSelectorModal = defineComponent({
    name: 'ConnectedUserSelectorModal',
    setup(_, { emit }) {
      return () =>
        h(UserSelectorModal, {
          ref: modalRef,
          ...props,
          onConfirm: (val: any, rows: any[]) => {
            emit('confirm', val, rows);
          },
        });
    },
  });

  return [ConnectedUserSelectorModal, methods] as const;
}
