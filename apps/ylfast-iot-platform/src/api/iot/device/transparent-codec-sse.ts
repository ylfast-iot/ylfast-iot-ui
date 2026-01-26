import type { SSEClient } from '#/utils/sse-client';

import { createSSEClient } from '#/utils/sse-client';

/**
 * 订阅调试日志（SSE）
 * @param scriptEngine 脚本引擎类型
 * @param codecId 编解码器ID
 * @param onMessage 消息回调
 * @param onEnd 结束回调
 * @param onError 错误回调
 * @param onOpen 连接成功回调
 * @returns SSEClient实例，调用方需要管理连接生命周期
 */
export async function subscribeDebugLog(
  scriptEngine: string,
  codecId: string,
  onMessage?: (message: string) => void,
  onEnd?: () => void,
  onError?: (error: Error) => void,
  onOpen?: () => void,
): Promise<SSEClient> {
  const client = createSSEClient(
    `/iot/device/transparent/codec/debug/log/${scriptEngine}/${codecId}`,
    {
      onOpen: () => {
        onOpen?.();
      },
      onMessage: (msg) => {
        // 只处理data字段
        if (msg.data) {
          onMessage?.(msg.data);
        }
      },
      onError: (err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        onError?.(error);
      },
      onClose: (info) => {
        console.error('SSE连接关闭:', info);
        onEnd?.();
      },
    },
    {
      method: 'GET',
      withToken: true,
      autoReconnect: false, // 不自动重连，由用户手动控制
    },
  );

  // 启动连接
  client.start();

  // 返回客户端实例，调用方需要调用 client.close() 来关闭连接
  return client;
}
