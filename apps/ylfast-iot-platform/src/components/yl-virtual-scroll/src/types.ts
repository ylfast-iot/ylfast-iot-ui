/**
 * YlVirtualScroll Props 定义
 */
export interface YlVirtualScrollProps {
  /**
   * 数据源数组
   */
  items: any[];
  /**
   * 每项的高度（px）
   */
  itemHeight?: number;
  /**
   * 容器高度
   */
  containerHeight?: string;
  /**
   * 缓冲区数量（上下额外渲染的项数）
   */
  buffer?: number;
  /**
   * 是否自动滚动到底部
   */
  autoScrollToBottom?: boolean;
}

/**
 * YlVirtualScroll 暴露的方法
 */
export interface YlVirtualScrollActionType {
  /**
   * 滚动到底部
   */
  scrollToBottom: () => void;
}
