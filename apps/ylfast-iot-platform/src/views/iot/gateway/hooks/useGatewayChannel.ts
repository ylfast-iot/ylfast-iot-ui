import type { Ref } from 'vue';

import { unref } from 'vue';

import { CHANNEL_TYPE } from '#/enums/channel-type';

export function useGatewayChannel(channelRef: Ref<string | undefined>) {
  function isNetwork() {
    return unref(channelRef) === CHANNEL_TYPE.CHANNEL_NETWORK;
  }

  function isPlugin() {
    return unref(channelRef) === CHANNEL_TYPE.CHANNEL_PLUGIN;
  }

  function isSub() {
    return unref(channelRef) === CHANNEL_TYPE.CHANNEL_SUB;
  }

  return {
    isNetwork,
    isPlugin,
    isSub,
  };
}
