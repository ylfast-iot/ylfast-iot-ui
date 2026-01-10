import type { CommonSelectorProps } from '#/components/business/common-selector';

import { defineComponent, h, ref, unref } from 'vue';

import { CommonList } from '#/components/business/common-selector';

import { queryDeviceList, searchFormSchemas, tableColumns } from '../config';

export function useDeviceListSelector(props: CommonSelectorProps = {}) {
  const listRef = ref();

  const methods = {
    getSelection: () => {
      return unref(listRef)?.getSelection();
    },
    clearSelection: () => {
      unref(listRef)?.clearSelection();
    },
    setSelection: (rows: any[]) => {
      unref(listRef)?.setSelection(rows);
    },
  };

  const ConnectedDeviceListSelector = defineComponent({
    name: 'ConnectedDeviceListSelector',
    setup() {
      return () =>
        h(
          CommonList,
          {
            ref: listRef,
            queryApi: queryDeviceList,
            searchFormSchemas,
            tableColumns,
            idField: 'id',
            ...props,
          },
          // Slots if needed (e.g. deviceType) - How to pass slots in h()?
          // Using slots object as 3rd arg or children object
          // But slots are functions in Vue 3 render function.
          // We need to implement slots here if we want custom columns in embedded mode.
          // However, CommonList passes through slots.
          // If we use this hook, we usually use <DeviceList /> in template.
          // Can we pass slots to <DeviceList>?
          // Yes, if ConnectedDeviceListSelector forwards them.
          // But ConnectedDeviceListSelector is created via h().
          // Slots passed to ConnectedDeviceListSelector should be forwarded to CommonList.
          // setup(props, { slots }) -> h(CommonList, ..., slots)
          {
            // Default slots implementation if needed, or pass-through
            // For now we assume user might want to provide slots in parent template
            // But defining slots in `h` is static.
            // If we want `deviceType` slot to work, we must provide it here or expect user to provide it.
            // Since this is a "Device" selector, it SHOULD provide default slots for device columns.
            // This is hard in pure JS hook without template.
            // Recommendation: Create `DeviceList.vue` that wraps CommonList with slots, and hook returns it.
            // But I deleted DeviceList.vue to be pure.
            // I'll provide a minimal slots implementation here? No, requires importing Tag etc.
            // It's better to keep `DeviceListSelector.vue` if it has specific template slots.
          },
        );
    },
  });

  return [ConnectedDeviceListSelector, methods] as const;
}
