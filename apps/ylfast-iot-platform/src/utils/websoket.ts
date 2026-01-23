import type { Recordable } from '#/adapter';

import { useAccessStore } from '@vben/stores';
import { cloneDeep } from '@vben/utils';

import { Observable } from 'rxjs';

export type WebSocketMessage<T = any> = {
  message: string;
  payload: T;
  requestId: string;
  topic: string;
  type: 'authError' | 'complete' | 'error' | 'ping' | 'pong' | 'result';
};

// socket选项
type SocketOptions = {
  socketUrl?: string; // socket地址
  urlSuffix?: string; // socketUrl后缀
};

let ws: null | WebSocket = null;
let count = 0; // 重连计数
let timer: NodeJS.Timeout | null = null;
let lockReconnect = false; // 避免重复连接
const total = 100; // 重连总次数
const subs: Recordable = {};
const timeout = 5000;
const tempQueue: any[] = []; // websocket未连接上时，缓存消息列
export const initWebSocket = (options: SocketOptions = {}) => {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;
  if (!token) return;
  if (ws) {
    return ws;
  }
  const _socketOptions = {
    urlSuffix: '',
    socketUrl: import.meta.env.VITE_GLOB_WS_URL,
    ...options,
  };
  const url = `${_socketOptions.socketUrl}${_socketOptions.urlSuffix}`;

  // 如果存在X_Access_Token | token | accessToken | access_token | Authorization 的查询参数则不设置否则设置

  const urlObj = new URL(convertUrl(url));
  const params = urlObj.searchParams;
  if (
    !params.has('X_Access_Token') &&
    !params.has('token') &&
    !params.has('accessToken') &&
    !params.has('access_token') &&
    !params.has('Authorization')
  ) {
    params.set('X_Access_Token', token);
  }

  if (count < total) {
    count += 1;
    ws = new WebSocket(urlObj.toString());
    ws.addEventListener('open', () => {
      count = 0;
      timer = setInterval(heartCheck, 2000);
      if (tempQueue.length > 0) {
        for (let i = tempQueue.length - 1; i >= 0; i--) {
          ws?.send(tempQueue[i]);
          tempQueue.splice(i, 1);
        }
      }
    });
    ws.addEventListener('close', () => {
      ws = null;
      reconnect(_socketOptions);
    });
    // eslint-disable-next-line unicorn/prefer-add-event-listener
    ws.onmessage = (msg: Record<string, any>) => {
      const data: WebSocketMessage<string> = JSON.parse(msg.data);
      if (data.type === 'error') {
        console.error({ key: 'error', message: data.message });
      }
      if (data.type === 'authError') {
        console.error({ key: 'authError', message: data.message });
      }
      if (subs[data.requestId]) {
        if (data.type === 'complete') {
          subs[data.requestId].forEach((item: Record<string, any>) => {
            item.complete();
          });
        } else if (data.type === 'result') {
          subs[data.requestId].forEach((element: Record<string, any>) => {
            element.next(cloneDeep(data));
          });
        }
      }
    };
    // eslint-disable-next-line unicorn/prefer-add-event-listener
    ws.onerror = () => {
      console.error('onerror', count);
      ws = null;
      reconnect(_socketOptions);
    };

    return ws;
  }
};

export const getWebSocket = <T = any>(
  id: string,
  topic: string,
  parameter: Record<string, any>,
  socketOptions: SocketOptions = {},
) => {
  return new Observable<WebSocketMessage<T>>((subscriber: any) => {
    if (!subs[id]) {
      subs[id] = [];
    }

    subs[id].push({
      next(val: Record<string, any>) {
        subscriber.next(val);
      },
      complete() {
        subscriber.complete();
      },
    });

    const msg = JSON.stringify({ id, topic, parameter, type: 'sub' });
    const thisWs = initWebSocket(socketOptions);
    if (thisWs) {
      if (thisWs.readyState === WebSocket.OPEN) {
        thisWs.send(msg);
      } else {
        tempQueue.push(msg);
      }
    }

    return () => {
      const unsub = JSON.stringify({ id, type: 'unsub' });
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete subs[id];
      if (thisWs) {
        thisWs.send(unsub);
      }
    };
  });
};

export const closeWs = () => {
  if (ws) {
    ws.close();
    timer && clearInterval(timer);
  }
};

/**
 * 重连
 */
function reconnect(options: SocketOptions) {
  timer && clearInterval(timer);
  if (lockReconnect) {
    return;
  }
  lockReconnect = true;
  timer = setTimeout(() => {
    initWebSocket(options);
    lockReconnect = false;
  }, timeout * count);
}

/**
 * 心跳检测
 */
function heartCheck() {
  if (ws) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}

function convertUrl(url: string) {
  if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
    if (!url.startsWith('/')) {
      url = `/${url}`;
    }
    url =
      window.location.protocol === 'https:'
        ? `wss://${window.location.host}${url}`
        : `ws://${window.location.host}${url}`;
  }
  return url;
}
