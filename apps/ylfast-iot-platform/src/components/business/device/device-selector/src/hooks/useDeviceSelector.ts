import type {
  CommonSelectorProps,
  SelectorActionType,
} from '#/components/business/common-selector';

import { defineComponent, h, ref } from 'vue';

import { IotDeviceInstanceApi } from '#/api';

import DeviceSelector from '../index.vue';

export function useDeviceSelector(
  props: CommonSelectorProps & {
    onSubmitAfter?: (val: any, records: any[]) => void;
  } = {},
) {
  const selectorRef = ref();
  let resolvePromise: ((val: any) => void) | null = null;

  const methods: SelectorActionType<IotDeviceInstanceApi.DeviceInstance> = {
    getSelection(): IotDeviceInstanceApi.DeviceInstance[] {
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
      selectorRef.value?.setSelectedRows(rows);
    },
    // index.vue doesn't expose setMode/clearSelection directly yet, need to update index.vue
  };

  const ConnectedDeviceSelector = defineComponent({
    name: 'ConnectedDeviceSelector',
    setup() {
      return () =>
        h(DeviceSelector, {
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

  return [ConnectedDeviceSelector, methods] as const;
}
