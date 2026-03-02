import type {
  CommonSelectorProps,
  SelectorActionType,
} from '#/components/business/common-selector';

import { defineComponent, h, ref } from 'vue';

import { IotNotifyConfigApi } from '#/api/iot/notify/config';

import NotifyConfigSelector from '../index.vue';

export function useNotifyConfigSelector(
  props: CommonSelectorProps & {
    onSubmitAfter?: (val: any, records: any[]) => void;
  } = {},
) {
  const selectorRef = ref();
  let resolvePromise: ((val: any) => void) | null = null;

  const methods: SelectorActionType<IotNotifyConfigApi.NotifyConfig> = {
    getSelection(): IotNotifyConfigApi.NotifyConfig[] {
      return selectorRef.value?.getSelection();
    },
    open: (options: any = {}) => {
      selectorRef.value?.open(options);
      return new Promise<{ rows: any[]; value: string | string[] }>(
        (resolve) => {
          resolvePromise = resolve;
        },
      );
    },
    close: () => {
      selectorRef.value?.close();
    },
    setMode: (mode) => {
      selectorRef.value?.setMode(mode);
    },
    clearSelection: () => {
      selectorRef.value?.clearSelection();
    },
    setSelection: (rows) => {
      selectorRef.value?.setSelection(rows);
    },
  };

  const ConnectedNotifyConfigSelector = defineComponent({
    name: 'ConnectedNotifyConfigSelector',
    setup() {
      return () =>
        h(NotifyConfigSelector, {
          ref: selectorRef,
          hideTrigger: true,
          ...props,
          onChange: (val: any, records: any[]) => {
            if (props.onSubmitAfter) {
              props.onSubmitAfter(val, records);
            }
            if (resolvePromise) {
              resolvePromise({ value: val, rows: records });
            }
          },
        });
    },
  });

  return [ConnectedNotifyConfigSelector, methods] as const;
}
