export type ProtocolFeatureType = 'firmwareUpgrade' | 'transparentCodec';

// 协议功能
export const ProtocolFeatures: {
  [key in ProtocolFeatureType]: ProtocolFeatureType;
} = {
  // 透传协议支持
  transparentCodec: 'transparentCodec',
  // 固件升级支持
  firmwareUpgrade: 'firmwareUpgrade',
};
