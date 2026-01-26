import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import MediaServerSelectorModal from '../components/MediaServerSelectorModal.vue';

export function useMediaServerModalSelector(props: CommonSelectorProps = {}) {
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

  const ConnectedMediaServerSelectorModal = defineComponent({
    name: 'ConnectedMediaServerSelectorModal',
    setup(_, { emit }) {
      return () =>
        h(MediaServerSelectorModal, {
          ref: modalRef,
          ...props,
          onConfirm: (val: any, rows: any[]) => {
            emit('confirm', val, rows);
          },
        });
    },
  });

  return [ConnectedMediaServerSelectorModal, methods] as const;
}
