import type { IotNetCompApi } from '#/api/iot/network-config';
import type { SelectorActionType } from '#/components/business/common-selector';
import type { BaseSelectorProps } from '#/components/business/common-selector/src/types';

import { defineComponent, h, ref } from 'vue';

import NetworkSelector from '../index.vue';

export function useNetworkSelector(
  props: BaseSelectorProps & {
    onSubmitAfter?: (val: any, records: any[]) => void;
  } = {},
) {
  const selectorRef = ref();
  let resolvePromise: ((val: any) => void) | null = null;

  const methods: SelectorActionType<IotNetCompApi.IotNetComp> = {
    getSelection(): IotNetCompApi.IotNetComp[] {
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

  const ConnectedNetworkSelector = defineComponent({
    name: 'ConnectedNetworkSelector',
    setup() {
      return () =>
        h(NetworkSelector, {
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

  return [ConnectedNetworkSelector, methods] as const;
}
