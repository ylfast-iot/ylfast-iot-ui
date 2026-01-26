import { getTransportDetail } from '#/api/iot/gateway';

/**
 * 判断指定的协议是否具备某项功能
 * @param protocolId 消息协议ID
 * @param transportId 传输协议ID（如 MQTT, HTTP 等）
 * @param featureId 功能点ID（见 ProtocolFeatures）
 * @returns 是否具备该功能
 */
export async function hasProtocolFeature(
  protocolId: string | undefined,
  transportId: string | undefined,
  featureId: string,
): Promise<boolean> {
  if (!protocolId || !transportId) return false;

  try {
    const detail = await getTransportDetail(protocolId, transportId);
    if (!detail || !detail.features) return false;

    // 检查 features 数组中是否包含指定的功能 ID
    return detail.features.some((f) => f.id === featureId);
  } catch (error) {
    console.error('Failed to check protocol feature:', error);
    return false;
  }
}
