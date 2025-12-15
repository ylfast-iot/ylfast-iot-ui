import type { VxeGridProps } from '#/adapter/vxe-table';

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
    editConfig: {
      trigger: 'click',
      mode: 'row',
      showStatus: true,
      showAsterisk: true,
      autoFocus: true,
      autoClear: false,
      enabled: !props.disabled,
    },
  };
}
