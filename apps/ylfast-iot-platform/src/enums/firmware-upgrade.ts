import type { EnumDict } from '#/types/global';

export type SignMode = 'md5' | 'sha-1' | 'sha-256' | 'sha-512';
export type FileDownloadType = 0 | 1;
export type UpgradeMode = 0 | 1;
export type UpgradeTarget = 'device' | 'product';
export type UpgradeState =
  | 'canceled'
  | 'error'
  | 'processing'
  | 'stopped'
  | 'successful'
  | 'waiting';
export type SignModeOption = { [key in SignMode]: EnumDict<SignMode> };
export type UpgradeStateOption = {
  [key in UpgradeState]: EnumDict<UpgradeState>;
};
export type FileDownloadTypeOption = {
  [key in FileDownloadType]: EnumDict<FileDownloadType>;
};
export type UpgradeModeOption = { [key in UpgradeMode]: EnumDict<UpgradeMode> };
export type UpgradeTargetOption = {
  [key in UpgradeTarget]: EnumDict<UpgradeTarget>;
};

export const SIGN_MODE_ENUM: SignModeOption = {
  md5: {
    value: 'md5',
    label: 'md5',
    text: 'md5',
    color: 'red',
  },
  'sha-256': {
    value: 'sha-256',
    label: 'sha-256',
    text: 'sha-256',
    color: 'success',
  },
  'sha-1': {
    value: 'sha-1',
    label: 'sha-1',
    text: 'sha-1',
    color: 'blue',
  },
  'sha-512': {
    value: 'sha-512',
    label: 'sha-512',
    text: 'sha-512',
    color: 'grey',
  },
};
export const UPGRADE_TARGET_ENUM: UpgradeTargetOption = {
  product: {
    value: 'product',
    label: '产品下所有设备',
    text: '产品下所有设备',
    color: 'success',
  },
  device: {
    value: 'device',
    label: '指定设备',
    text: '指定设备',
    color: 'red',
  },
};

export const FILE_DOWNLOAD_TYPE_ENUM: FileDownloadTypeOption = {
  0: {
    value: 0,
    label: '客户端主动下载',
    text: '客户端主动下载',
  },
  1: {
    value: 1,
    label: '平台代理下载',
    text: '平台代理下载',
  },
};
export const UPGRADE_MODE_TYPE_ENUM: UpgradeModeOption = {
  0: {
    value: 0,
    label: '设备拉取',
    text: '设备拉取',
    color: 'red',
  },
  1: {
    value: 1,
    label: '平台推送',
    text: '平台推送',
    color: 'success',
  },
};

export const UPGRADE_STATE_ENUM: UpgradeStateOption = {
  waiting: {
    value: 'waiting',
    label: '待升级',
    text: '待升级',
    color: 'info',
  },
  processing: {
    value: 'processing',
    label: '升级中',
    text: '升级中',
    color: 'blue',
  },
  successful: {
    value: 'successful',
    label: '升级成功',
    text: '升级成功',
    color: 'success',
  },
  error: {
    value: 'error',
    label: '升级失败',
    text: '升级失败',
    color: 'red',
  },
  stopped: {
    value: 'stopped',
    label: '升级停止',
    text: '升级停止',
    color: 'yellow',
  },
  canceled: {
    value: 'canceled',
    label: '升级取消',
    text: '升级取消',
    color: 'red',
  },
};
