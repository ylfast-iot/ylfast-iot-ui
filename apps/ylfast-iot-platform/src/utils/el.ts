import type { Ref } from 'vue';

import { onMounted, onUnmounted, ref } from 'vue';

/**
 * 监听目标 DOM 元素的高度变化。
 * @param targetRef 目标元素的 Vue 引用 (ref)。
 * @returns 包含当前高度和宽度以及启动/停止功能的响应式对象。
 */
export function useResizeObserver(targetRef: Ref<HTMLElement | null>) {
  // 响应式状态来存储尺寸
  const height = ref(0);
  const width = ref(0);
  let observer: null | ResizeObserver = null;

  /**
   * 启动观察者
   */
  const startObserving = () => {
    if (targetRef.value && !observer) {
      observer = new ResizeObserver((entries) => {
        // ResizeObserver 的回调会收到一个数组，通常我们只关心第一个 entry
        for (const entry of entries) {
          // 使用 contentRect 来获取最新的尺寸
          height.value = entry.contentRect.height;
          width.value = entry.contentRect.width;
          // console.log(`容器尺寸变化 -> 宽度: ${width.value}, 高度: ${height.value}`);
        }
      });
      observer.observe(targetRef.value);
    }
  };

  /**
   * 停止观察者
   */
  const stopObserving = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  // 组件挂载时开始监听
  onMounted(() => {
    startObserving();
  });

  // 组件卸载时停止监听，防止内存泄漏
  onUnmounted(() => {
    stopObserving();
  });

  return {
    height,
    width,
    startObserving,
    stopObserving,
  };
}
