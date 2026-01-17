import { requestClient } from '#/api/request';

/**
 * @description 获取传输协议列表
 */
export function getTransports() {
  return requestClient.get<{ id: string; name: string }[]>(
    '/iot/gateway/transports',
  );
}
