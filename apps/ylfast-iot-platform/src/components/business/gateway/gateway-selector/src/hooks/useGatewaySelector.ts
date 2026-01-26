import type { IotGatewayApi } from '#/api/iot/gateway';
import type { SelectorActionType } from '#/components/business/common-selector';
import type { BaseSelectorProps } from '#/components/business/common-selector/src/types';

import { defineComponent, h, ref } from 'vue';

import GatewaySelector from '../index.vue';

export function useGatewaySelector(
  props: BaseSelectorProps & {
    onSubmitAfter?: (val: any, records: any[]) => void;
  } = {},
) {
  const selectorRef = ref();
  let resolvePromise: ((val: any) => void) | null = null;

  const methods: SelectorActionType<IotGatewayApi.DeviceGateway> = {
    getSelection(): IotGatewayApi.DeviceGateway[] {
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

  const ConnectedGatewaySelector = defineComponent({
    name: 'ConnectedGatewaySelector',
    setup() {
      return () =>
        h(GatewaySelector, {
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

  return [ConnectedGatewaySelector, methods] as const;
}
