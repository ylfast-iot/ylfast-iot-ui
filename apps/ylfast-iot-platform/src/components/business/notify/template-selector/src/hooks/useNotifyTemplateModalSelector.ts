import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import NotifyTemplateSelectorModal from '../components/NotifyTemplateSelectorModal.vue';

export function useNotifyTemplateModalSelector(
  props: CommonSelectorProps = {},
) {
  const modalRef = ref();

  const methods = {
    open: (options: any) => {
      unref(modalRef)?.open(options);
    },
    close: () => {
      unref(modalRef)?.close();
    },
  };

  const ConnectedNotifyTemplateModalSelector = defineComponent({
    name: 'ConnectedNotifyTemplateModalSelector',
    setup() {
      return () =>
        h(NotifyTemplateSelectorModal, {
          ref: modalRef,
          ...props,
        });
    },
  });

  return [ConnectedNotifyTemplateModalSelector, methods] as const;
}
