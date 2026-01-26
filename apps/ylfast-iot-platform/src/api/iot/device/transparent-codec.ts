import { requestClient } from '#/api/request';

/**
 * 透传消息编解码器配置
 */
export interface IotTransparentCodecModel {
  /**
   * ID
   */
  id?: string;
  /**
   * 名称
   */
  name?: string;
  /**
   * 编码器提供者（固定为 'script'）
   */
  provider: string;
  /**
   * 产品ID
   */
  productId: string;
  /**
   * 设备ID（可选，为空表示产品级配置）
   */
  deviceId?: null | string;
  /**
   * 编解码器配置
   */
  configuration: {
    /**
     * 调试用的ID（可选）
     */
    id?: string;
    /**
     * 脚本内容
     */
    script: string;
    /**
     * 脚本引擎类型（如 'nashorn', 'graaljs'）
     */
    scriptEngineType: string;
    /**
     * 脚本类型（如 'javascript'）
     */
    scriptType: string;
  };
}

/**
 * 保存透传消息编解码器的请求参数
 */
export interface TransparentMessageCodecRequest {
  /**
   * 编码器提供者
   */
  provider: string;
  /**
   * 配置
   */
  configuration: Record<string, any>;
}

/**
 * 调试解码的请求参数
 */
export interface TransparentMessageDecodeRequest {
  /**
   * 编码器提供者
   */
  provider: string;
  /**
   * 配置
   */
  configuration: Record<string, any>;
  /**
   * 头部信息（如 topic, url）
   */
  headers?: Record<string, any>;
  /**
   * 原始报文（0x开头为16进制，否则为字符串）
   */
  payload: string;
}

/**
 * 调试解码的响应结果
 */
export interface TransparentMessageDecodeResponse {
  /**
   * 是否成功
   */
  success: boolean;
  /**
   * 失败原因
   */
  reason?: string;
  /**
   * 输出结果（平台消息列表）
   */
  outputs?: any[];
}

/**
 * 获取产品的透传解析规则
 * @param productId 产品ID
 */
export function getProductTransparentCodec(productId: string) {
  return requestClient.get<IotTransparentCodecModel>(
    `/iot/device/transparent/codec/${productId}`,
  );
}

/**
 * 获取设备的透传解析规则（如果设备没有则返回产品的）
 * @param productId 产品ID
 * @param deviceId 设备ID
 */
export function getDeviceTransparentCodec(productId: string, deviceId: string) {
  return requestClient.get<IotTransparentCodecModel>(
    `/iot/device/transparent/codec/${productId}/${deviceId}`,
  );
}

/**
 * 保存产品的透传解析规则
 * @param productId 产品ID
 * @param data 配置数据
 */
export function saveProductTransparentCodec(
  productId: string,
  data: TransparentMessageCodecRequest,
) {
  return requestClient.post(`/iot/device/transparent/codec/${productId}`, data);
}

/**
 * 保存设备的透传解析规则
 * @param productId 产品ID
 * @param deviceId 设备ID
 * @param data 配置数据
 */
export function saveDeviceTransparentCodec(
  productId: string,
  deviceId: string,
  data: TransparentMessageCodecRequest,
) {
  return requestClient.post(
    `/iot/device/transparent/codec/${productId}/${deviceId}`,
    data,
  );
}

/**
 * 重置产品的透传解析规则
 * @param productId 产品ID
 */
export function removeProductCodec(productId: string) {
  return requestClient.delete(`/iot/device/transparent/codec/${productId}`);
}

/**
 * 重置设备的透传解析规则
 * @param productId 产品ID
 * @param deviceId 设备ID
 */
export function removeDeviceCodec(productId: string, deviceId: string) {
  return requestClient.delete(
    `/iot/device/transparent/codec/${productId}/${deviceId}`,
  );
}

/**
 * 测试解码
 * @param request 解码请求
 */
export function decodeDebug(request: TransparentMessageDecodeRequest) {
  return requestClient.post<TransparentMessageDecodeResponse>(
    '/iot/device/transparent/codec/decode-test',
    request,
  );
}

/**
 * 获取产品的TypeScript类型定义
 * @param productId 产品ID
 */
export function getProductTypescriptDeclares(productId: string) {
  return requestClient.get<string>(
    `/iot/device/transparent/codec/${productId}.d.ts`,
  );
}

/**
 * 获取设备的TypeScript类型定义
 * @param productId 产品ID
 * @param deviceId 设备ID
 */
export function getDeviceTypescriptDeclares(
  productId: string,
  deviceId: string,
) {
  return requestClient.get<string>(
    `/iot/device/transparent/codec/${productId}/${deviceId}.d.ts`,
  );
}

/**
 * 订阅调试日志（SSE）
 * @param scriptEngine 脚本引擎类型
 * @param codecId 编解码器ID
 * @param onMessage 消息回调
 * @param onClose 关闭回调
 * @param onError 错误回调
 * @param onOpen 连接成功回调
 * @param onRetry 重连回调
 * @returns SSEClient实例，调用方需要管理连接生命周期
 */
export async function subscribeDebugLog(
  scriptEngine: string,
  codecId: string,
  onMessage?: (message: string) => void,
  onClose?: (info: { code?: string; reason: string }) => void,
  onError?: (error: Error) => void,
  onOpen?: () => void,
  onRetry?: (info: { attempt: number; delay: number; reason: string }) => void,
) {
  const { createSSEClient } = await import('#/utils/sse-client');

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
        onClose?.(info);
      },
      onRetry: (info) => {
        console.error('SSE重连尝试:', info);
        onRetry?.(info);
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
