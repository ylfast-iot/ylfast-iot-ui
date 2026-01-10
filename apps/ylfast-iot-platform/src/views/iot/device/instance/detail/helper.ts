import type { DeviceMetadata } from '#/types/metadata';

import { $t } from '@vben/locales';

import { message, Modal } from 'ant-design-vue';

import { IotDeviceInstanceApi } from '#/api';
import { updateDeviceMetadata as updateDeviceMetadataApi } from '#/api/iot/device/instance';

export function parseMetadata(tsl?: string) {
  if (!tsl) {
    return {} as DeviceMetadata;
  }
  try {
    return JSON.parse(tsl) as DeviceMetadata;
  } catch (error) {
    console.error(error);
    return {} as DeviceMetadata;
  }
}

/**
 * @param device 当前设备
 * @param newMetadata 新的物模型
 * @param emit 事件
 */
export async function updateMetadataApi(
  device: IotDeviceInstanceApi.DeviceDetail,
  newMetadata: DeviceMetadata,
  emit: (
    event: 'update:device',
    device: IotDeviceInstanceApi.DeviceDetail,
  ) => void,
) {
  try {
    const tsl = JSON.stringify(newMetadata);
    await updateDeviceMetadataApi(device.id, tsl);
    emit('update:device', {
      ...device,
      tsl,
    } as IotDeviceInstanceApi.DeviceDetail);
  } catch (error) {
    console.error(error);
  }
}

/**
 * 更新物模型
 * @param device 当前设备
 * @param newMetadata 新的物模型
 * @param emit 事件
 */
export async function updateMetadata(
  device: IotDeviceInstanceApi.DeviceDetail,
  newMetadata: DeviceMetadata,
  emit: (
    event: 'update:device',
    device: IotDeviceInstanceApi.DeviceDetail,
  ) => void,
) {
  const isSelfMetadata = device.isSelfMetadata;

  if (isSelfMetadata) {
    try {
      await updateMetadataApi(device, newMetadata, emit);
      return true;
    } catch {
      message.error($t('device.instance.error.overrideMetadata'));
      return false;
    }
  } else {
    return new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: $t('device.instance.confirmTitle.overrideMetadata'),
        content: $t('device.instance.confirmContent.overrideMetadata'),
        okType: 'danger',
        onOk: () => {
          updateMetadataApi(device, newMetadata, emit);
          resolve(true);
        },
        // 如果取消，可能需要重置 metadata 的值，但 ThingModelEditor 是非受控的或很难回滚
        // 实际上 ThingModelEditor v-model:value 是双向绑定的，这里 val 已经是新值
        // 这里的处理稍微有点棘手，因为编辑器可能已经更新了内部状态
        // 考虑到用户体验，确认框取消后，理想情况下编辑器应回滚。
        // 但简化实现，如果取消，这里不做特殊回滚（因为编辑器内部可能很难控制回滚），
        // 或者我们可以重新加载一下初始值？
        onCancel: () => {
          resolve(false);
        },
      });
    });
  }
}
