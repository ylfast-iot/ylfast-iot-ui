export type ChartType = 'statistic' | 'trend';

export interface TrendDataItem {
  /** 时间标签 */
  label: string;
  /** 数值 */
  value: number;
}

export interface StatisticCardProps {
  /**
   * 标题
   */
  title: string;
  /**
   * 数值
   */
  value: number | string;
  /**
   * 单位
   */
  unit?: string;
  /**
   * 图标 (Iconify string, e.g., 'lucide:activity')
   */
  icon?: string;
  /**
   * 图标颜色 (Tailwind class or hex)
   */
  iconColor?: string;
  /**
   * 图标背景色
   */
  iconBgColor?: string;
  /**
   * 趋势 ('up' | 'down' | 'flat')
   */
  trend?: 'down' | 'flat' | 'up';
  /**
   * 趋势值 (e.g., '12%')
   */
  trendValue?: string;
  /**
   * 底部标签文本
   */
  footerLabel?: string;
  /**
   * 底部数值
   */
  footerValue?: number | string;
  /**
   * 变体样式 ('default' | 'primary' | 'success' | 'warning' | 'error')
   * 影响背景色或边框
   */
  variant?: 'default' | 'error' | 'primary' | 'success' | 'warning';
  /**
   * 图表类型 ('statistic' | 'trend')
   * @default 'statistic'
   */
  chartType?: ChartType;
  /**
   * 图表数据 (统计图表 - 用于仪表盘)
   */
  chartData?: Array<{ name: string; value: number }>;
  /**
   * 趋势数据 (趋势图表 - 用于折线/面积图)
   */
  trendData?: TrendDataItem[];
  /**
   * 趋势图颜色
   */
  trendColor?: string;
  /**
   * 仪表盘阈值配置 (e.g. [{ value: 0.3, color: 'green' }, ...])
   * value 为 0-1 之间的小数
   */
  thresholds?: Array<{ color: string; value: number }>;
  /**
   * 最小值 (默认 0)
   */
  min?: number;
  /**
   * 最大值 (默认 100)
   */
  max?: number;
  /**
   * 是否加载中
   */
  loading?: boolean;
}
