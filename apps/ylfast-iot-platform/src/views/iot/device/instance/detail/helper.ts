import type { DeviceMetadata } from '#/types/metadata';

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
