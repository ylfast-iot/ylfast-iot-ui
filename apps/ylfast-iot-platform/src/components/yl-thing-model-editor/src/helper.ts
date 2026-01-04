import type { VxeGridProps } from '#/adapter/vxe-table';

export function isInherited(row: any): boolean {
  return !!row.expands?.inheritedProduct;
}

export function createBaseGridOptions(props: {
  disabled?: boolean;
}): VxeGridProps {
  return {
    border: true,
    pagerConfig: {
      enabled: false,
    },
    keepSource: true,
    showOverflow: true,
    align: 'center',
    height: '100%',
    virtualXConfig: {
      enabled: true,
      gt: 0,
    },
    columnConfig: { resizable: true },
    toolbarConfig: {
      custom: true,
      slots: { buttons: 'toolbar_buttons' },
    },
    checkboxConfig: {
      checkMethod: ({ row }) => !isInherited(row),
    },
    rowClassName: ({ row }) => {
      return isInherited(row) ? 'inherited-row' : '';
    },
    editConfig: {
      trigger: 'click',
      mode: 'row',
      showStatus: true,
      showAsterisk: true,
      autoFocus: true,
      autoClear: false,
      enabled: !props.disabled,
      beforeEditMethod: () => {
        return !props.disabled;
      },
    },
  };
}
