import type { SSEClient } from '#/utils/sse-client';

import { onUnmounted, ref } from 'vue';

import { subscribeDebugLog } from '#/api/iot/device/transparent-codec';

/**
 * SSE调试日志Hook
 */
export function useDebugLog() {
  const logs = ref<string[]>([]);
  let sseClient: null | SSEClient = null;

  /**
   * 清空日志
   */
  function clearLog() {
    logs.value = [];
  }

  /**
   * 添加系统日志（带颜色和图标）
   */
  function addSystemLog(
    type: 'error' | 'info' | 'success' | 'warning',
    message: string,
  ) {
    const icons = {
      success: '✔',
      info: 'ℹ',
      warning: '⚠',
      error: '✖',
    };
    const colors = {
      success: '#67c23a',
      info: '#909399',
      warning: '#e6a23c',
      error: '#f56c6c',
    };
    const icon = icons[type];
    const color = colors[type];
    logs.value.push(`<span style="color: ${color};">${icon} ${message}</span>`);
  }

  /**
   * 订阅日志
   * @param scriptEngine 脚本引擎类型
   * @param codecId 编解码器ID
   */
  async function subscribe(scriptEngine: string, codecId: string) {
    // 关闭之前的连接
    if (sseClient) {
      sseClient.close();
      sseClient = null;
    }

    // 清空旧日志
    logs.value = [];
    addSystemLog('info', '正在建立SSE连接...');

    try {
      // 订阅新的日志流（使用API函数）
      sseClient = await subscribeDebugLog(
        scriptEngine,
        codecId,
        // onMessage: 收到数据消息
        (message: string) => {
          if (message) {
            logs.value.push(message);
          }
        },
        // onClose: 连接关闭
        (info) => {
          console.error('SSE连接已关闭:', info);
          const reason = info.reason || '未知原因';
          addSystemLog('info', `连接已关闭 (${reason})`);
        },
        // onError: 连接错误
        (error: Error) => {
          console.error('SSE连接错误:', error);
          addSystemLog('error', `连接错误: ${error.message}`);
        },
        // onOpen: 连接成功
        () => {
          console.warn('SSE连接已建立');
          addSystemLog('success', 'SSE连接已建立，等待调试日志...');
        },
        // onRetry: 重连尝试
        (retryInfo) => {
          console.warn('SSE正在重连:', retryInfo);
          addSystemLog(
            'warning',
            `正在重连... (第${retryInfo.attempt}次尝试，${retryInfo.delay}ms后重试，原因: ${retryInfo.reason})`,
          );
        },
      );
    } catch (error: any) {
      console.error('订阅调试日志失败:', error);
      addSystemLog('error', `订阅失败: ${error.message || '未知错误'}`);
    }
  }

  /**
   * 关闭连接
   */
  function close() {
    if (sseClient) {
      sseClient.close();
      sseClient = null;
    }
  }

  onUnmounted(() => {
    close();
  });

  return {
    logs,
    clearLog,
    subscribe,
    close,
  };
}
