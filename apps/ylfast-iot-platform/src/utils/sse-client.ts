/**
 * 通用SSE客户端
 * 支持GET/POST请求、Token认证、自动重连、心跳检测
 * @author yaolonga
 * @email 1638538651@qq.com
 */

import { useAccessStore } from '@vben/stores';

export type SSEMethod = 'GET' | 'POST';

export type SSEClientOptions = {
  autoReconnect?: boolean; // 默认 true
  body?: any; // POST body（对象会自动 JSON.stringify）
  fetchImpl?: typeof fetch; // 方便注入（测试/Node polyfill）
  headers?: Record<string, string>;
  heartbeatTimeout?: number; // 心跳/无数据超时（ms），超时会断开并重连；0/undefined 关闭
  lastEventId?: string; // 断线重连用
  maxReconnectAttempts?: number; // 最大重连次数，默认 Infinity
  method?: SSEMethod; // GET/POST
  retry?: number; // 默认重连间隔 ms（服务端也可用 retry: 覆盖）
  signal?: AbortSignal; // 外部可传入 signal
  url: string;
  withCredentials?: boolean; // 浏览器里想带 cookie 可用（需要服务端允许）
  withToken?: boolean; // 是否自动添加Token到Authorization头
};

export type SSEMessage = {
  data: string; // 原始 data（多行拼接后）
  event: string; // 默认 "message"
  id?: string;
  raw: string; // 本条消息的原始 block 文本（便于调试）
  retry?: number;
};

export type SSEHandlers = {
  onClose?: (info: { code?: string; reason: string }) => void;
  onError?: (err: any) => void;
  onMessage?: (msg: SSEMessage) => void;
  onOpen?: (res: Response) => void;
  onRetry?: (info: { attempt: number; delay: number; reason: string }) => void;
};

export class SSEClient {
  private closed = false;

  private controller: AbortController | null = null;
  private currentRetry = 0;
  private handlers: SSEHandlers;
  private heartbeatTimer: any = null;
  private lastChunkAt = 0;
  private lastEventId: string | undefined;

  private opts: Omit<
    SSEClientOptions,
    'autoReconnect' | 'maxReconnectAttempts' | 'method' | 'retry' | 'withToken'
  > &
    Required<
      Pick<
        SSEClientOptions,
        | 'autoReconnect'
        | 'maxReconnectAttempts'
        | 'method'
        | 'retry'
        | 'withToken'
      >
    >;
  private reconnectAttempts = 0;

  constructor(options: SSEClientOptions, handlers: SSEHandlers = {}) {
    // 如果URL是相对路径，自动添加baseUrl
    let url = options.url;
    if (url.startsWith('/')) {
      const baseUrl = import.meta.env.VITE_GLOB_API_URL || '';
      url = `${baseUrl}${url}`;
    }

    this.opts = {
      method: options.method ?? 'GET',
      retry: options.retry ?? 3000,
      autoReconnect: options.autoReconnect ?? false, // 默认不自动重连
      maxReconnectAttempts: options.maxReconnectAttempts ?? Infinity,
      withToken: options.withToken ?? true,
      ...options,
      url, // 使用处理后的URL
    };
    this.handlers = handlers;
    this.currentRetry = this.opts.retry;
    this.lastEventId = options.lastEventId;
  }

  /** 仅取消本次请求（如果 autoReconnect=true 可能会重连） */
  public abort(reason = 'abort') {
    this.clearHeartbeat();
    this.controller?.abort(reason);
  }

  /** 主动关闭（不再重连） */
  public close(reason = 'manual_close') {
    this.closed = true;
    this.clearHeartbeat();
    if (this.controller) this.controller.abort(reason);
    this.handlers.onClose?.({ reason });
  }

  /** 获取当前 lastEventId（便于你自己持久化） */
  public getLastEventId() {
    return this.lastEventId;
  }

  /** 开始连接 */
  public start() {
    this.closed = false;
    this.connect('start');
  }

  private clearHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  private async connect(_triggerReason: string) {
    if (this.closed) return;

    // 外部 signal + 内部 AbortController 合并：用内部 controller，外部 signal 触发时也 abort
    const controller = new AbortController();
    this.controller = controller;

    if (this.opts.signal) {
      if (this.opts.signal.aborted) controller.abort(this.opts.signal.reason);
      else {
        const onAbort = () => controller.abort(this.opts.signal?.reason);
        this.opts.signal.addEventListener('abort', onAbort, { once: true });
      }
    }

    const fetchImpl = this.opts.fetchImpl ?? fetch;

    // 组装 headers
    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...this.opts.headers,
    };

    // 添加Token认证
    if (this.opts.withToken) {
      const accessStore = useAccessStore();
      const token = accessStore.accessToken;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    // 断线续传：Last-Event-ID（也有人用 query param 自己实现）
    if (this.lastEventId) headers['Last-Event-ID'] = this.lastEventId;

    // 组装 body（仅 POST 使用）
    let body: any;
    if (this.opts.method === 'POST' && this.opts.body !== null) {
      if (
        typeof this.opts.body === 'string' ||
        this.opts.body instanceof FormData
      ) {
        body = this.opts.body;
      } else {
        body = JSON.stringify(this.opts.body);
        if (!headers['Content-Type'])
          headers['Content-Type'] = 'application/json';
      }
    }

    try {
      const res = await fetchImpl(this.opts.url, {
        method: this.opts.method,
        headers,
        body,
        signal: controller.signal,
        // 浏览器里想带 cookie：credentials: "include"
        credentials: this.opts.withCredentials ? 'include' : 'same-origin',
      });

      if (!res.ok) {
        throw new Error(`SSE HTTP error: ${res.status} ${res.statusText}`);
      }

      const ct = res.headers.get('content-type') || '';
      // 有些服务端不严格写 content-type，也允许继续
      if (!ct.includes('text/event-stream')) {
        console.warn(`Non-standard content-type for SSE: ${ct}`);
      }

      this.reconnectAttempts = 0;
      this.handlers.onOpen?.(res);

      this.lastChunkAt = Date.now();
      this.setupHeartbeat();

      await this.readStream(res, controller.signal);
      // 正常读完流（服务端关掉连接）
      if (!this.closed) {
        this.handlers.onClose?.({ reason: 'server_closed' });
        this.maybeReconnect('server_closed');
      }
    } catch (error: any) {
      if (this.closed) return;

      // fetch 被 abort：可能是 manual_close / abort / 外部 signal
      if (error?.name === 'AbortError') {
        const reason = (this.controller as any)?.signal?.reason || 'aborted';
        this.handlers.onClose?.({ reason: String(reason) });
        // abort() 可能仍希望重连（取决于你业务），这里遵循 autoReconnect
        this.maybeReconnect(String(reason));
        return;
      }

      this.handlers.onError?.(error);
      this.maybeReconnect(`error:${error?.message ?? 'unknown'}`);
    }
  }

  private maybeReconnect(reason: string) {
    if (!this.opts.autoReconnect || this.closed) return;

    if (this.reconnectAttempts >= this.opts.maxReconnectAttempts) {
      this.handlers.onClose?.({
        reason: 'max_reconnect_reached',
        code: reason,
      });
      return;
    }

    this.reconnectAttempts += 1;
    const delay = this.currentRetry;

    this.handlers.onRetry?.({
      attempt: this.reconnectAttempts,
      delay,
      reason,
    });

    setTimeout(() => {
      this.connect(`reconnect:${reason}`);
    }, delay);
  }

  private parseEventBlock(raw: string): null | SSEMessage {
    // 忽略纯注释心跳（":" 开头）
    const lines = raw.split(/\r?\n/);
    let event = 'message';
    let id: string | undefined;
    let retry: number | undefined;
    const dataLines: string[] = [];

    let hasField = false;

    for (const line of lines) {
      if (!line) continue;

      // 注释行（心跳），不算事件
      if (line.startsWith(':')) continue;

      const colonIdx = line.indexOf(':');
      let field = '';
      let value = '';

      if (colonIdx === -1) {
        field = line;
        value = '';
      } else {
        field = line.slice(0, colonIdx);
        value = line.slice(colonIdx + 1);
        if (value.startsWith(' ')) value = value.slice(1);
      }

      hasField = true;

      switch (field) {
        case 'data': {
          dataLines.push(value);
          break;
        }
        case 'event': {
          event = value || 'message';
          break;
        }
        case 'id': {
          id = value;
          break;
        }
        case 'retry': {
          const n = Number(value);
          if (Number.isFinite(n)) retry = n;

          break;
        }
        // No default
      }
    }

    if (!hasField) return null;
    return {
      event,
      data: dataLines.join('\n'),
      id,
      retry,
      raw,
    };
  }

  private async readStream(res: Response, signal: AbortSignal) {
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Response body is not a readable stream.');

    const decoder = new TextDecoder('utf8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      this.lastChunkAt = Date.now();
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // SSE 用空行分隔事件块：\n\n 或 \r\n\r\n
      let idx: number;
      // eslint-disable-next-line no-cond-assign
      while ((idx = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const rawBlock = buffer.slice(0, idx);
        buffer = buffer.slice(idx).replace(/^\r?\n\r?\n/, ''); // 去掉分隔空行

        const msg = this.parseEventBlock(rawBlock);
        if (!msg) continue;

        // 服务端可发送 retry: 来指示重连间隔
        if (typeof msg.retry === 'number' && !Number.isNaN(msg.retry)) {
          this.currentRetry = msg.retry;
        }
        if (msg.id) this.lastEventId = msg.id;

        this.handlers.onMessage?.(msg);
      }

      if (signal.aborted) break;
    }
  }

  private setupHeartbeat() {
    const t = this.opts.heartbeatTimeout;
    if (!t || t <= 0) return;

    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(
      () => {
        if (this.closed) return;
        const gap = Date.now() - this.lastChunkAt;
        if (gap > t) {
          // 超时：断开触发重连
          this.abort('heartbeat_timeout');
        }
      },
      Math.min(t / 2, 5000),
    );
  }
}

/**
 * 创建SSE连接的便捷函数
 */
export function createSSEClient(
  url: string,
  handlers: SSEHandlers = {},
  options: Omit<SSEClientOptions, 'url'> = {},
): SSEClient {
  return new SSEClient({ url, ...options }, handlers);
}
