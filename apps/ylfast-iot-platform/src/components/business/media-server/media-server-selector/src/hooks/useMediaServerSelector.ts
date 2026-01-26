import type { IotMediaServerApi } from '#/api/iot/media-server';
import type { SelectorActionType } from '#/components/business/common-selector';
import type { BaseSelectorProps } from '#/components/business/common-selector/src/types';

import { defineComponent, h, ref } from 'vue';

import MediaServerSelector from '../index.vue';

export function useMediaServerSelector(
  props: BaseSelectorProps & {
    onSubmitAfter?: (val: any, records: any[]) => void;
  } = {},
) {
  const selectorRef = ref();
  let resolvePromise: ((val: any) => void) | null = null;

  const methods: SelectorActionType<IotMediaServerApi.IotMediaServerConfig> = {
    getSelection(): IotMediaServerApi.IotMediaServerConfig[] {
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

  const ConnectedMediaServerSelector = defineComponent({
    name: 'ConnectedMediaServerSelector',
    setup() {
      return () =>
        h(MediaServerSelector, {
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

  return [ConnectedMediaServerSelector, methods] as const;
}
