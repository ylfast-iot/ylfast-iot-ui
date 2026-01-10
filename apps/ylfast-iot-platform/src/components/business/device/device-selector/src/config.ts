import type { QueryParamEntity } from '#/adapter';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { YlDcFormSchema } from '#/components/yl-dc-form';
import type { DeviceType } from '#/enums/device';

import { $t } from '@vben/locales';

import { IotDeviceInstanceApi as DeviceApi } from '#/api/iot/device/instance';
import { DEVICE_TYPE_ENUMS } from '#/enums/device';

export const searchFormSchemas: YlDcFormSchema[] = [
  {
    component: 'Input',
    field: 'id',
    label: $t('device.instance.id'),
    termTypes: ['eq', 'like'],
  },
  {
    component: 'Input',
    field: 'deviceName',
    label: $t('device.instance.name'),
    termTypes: ['eq', 'like'],
  },
  {
    component: 'Input',
    field: 'sn',
    label: $t('device.instance.sn'),
    termTypes: ['eq', 'like'],
  },
];

export const tableColumns: VxeGridProps['columns'] = [
  { field: 'id', title: $t('device.instance.id'), width: 180 },
  {
    field: 'sn',
    formatter: ({ row }) => row.sn || row.id,
    title: $t('device.instance.sn'),
    width: 180,
  },
  { field: 'deviceName', minWidth: 150, title: $t('device.instance.name') },
  {
    field: 'deviceType',
    slots: { default: 'deviceType' },
    title: $t('device.instance.type'),
    width: 100,
  },
  {
    field: 'deviceState',
    slots: { default: 'deviceState' },
    title: $t('device.instance.status'),
    width: 100,
  },
];

export async function queryDeviceList(params: QueryParamEntity) {
  return await DeviceApi.basicCrudApis.postQuery({
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sorts: [{ name: 'createTime', order: 'desc' }],
    terms: params.terms || [],
  });
}

export async function queryDeviceListNoPaging(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const res = await DeviceApi.basicCrudApis.postQueryNoPaging({
    terms: [
      {
        column: 'id',
        termType: 'in',
        value: ids.join(','),
      },
    ],
  });
  return res || [];
}

export function getDeviceTypeInfo(deviceType: any) {
  const typeValue = (deviceType?.value || deviceType) as DeviceType;
  return (
    DEVICE_TYPE_ENUMS[typeValue] || {
      color: 'default',
      label: typeValue,
    }
  );
}

export function getDeviceStateInfo(deviceState: any) {
  const stateValue = deviceState?.value || deviceState;

  if (stateValue === 'online') {
    return {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      cardBg:
        'from-emerald-50/40 via-white to-white dark:from-emerald-500/10 dark:via-[#1c1e23] dark:to-[#1c1e23]',
      dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
      iconColor: 'text-emerald-400',
      label: $t('device.state.online'),
      statusColor: 'success',
      value: stateValue,
    };
  } else if (stateValue === 'unActive') {
    return {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      cardBg:
        'from-rose-50/40 via-white to-white dark:from-rose-500/10 dark:via-[#1c1e23] dark:to-[#1c1e23]',
      dotClass: 'bg-rose-500',
      iconColor: 'text-rose-400',
      label: $t('common.disable'),
      statusColor: 'error',
      value: stateValue,
    };
  } else {
    // offline or other
    return {
      bg: 'bg-slate-500/10 dark:bg-slate-500/20',
      cardBg:
        'from-slate-50/40 via-white to-white dark:from-slate-500/10 dark:via-[#1c1e23] dark:to-[#1c1e23]',
      dotClass: 'bg-slate-400',
      iconColor: 'text-slate-400',
      label: $t('device.state.offline'),
      statusColor: 'default',
      value: stateValue,
    };
  }
}
