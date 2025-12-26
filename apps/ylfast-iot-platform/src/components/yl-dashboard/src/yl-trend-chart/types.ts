export interface TrendChartProps {
  /**
   * 标题
   */
  title: string;
  /**
   * API 函数，接收包含 startTime 和 endTime 的对象 (时间戳)
   */
  api?: (params: { endTime: number; startTime: number }) => Promise<any>;
  /**
   * 是否显示加载中
   */
  loading?: boolean;
  /**
   * 是否显示日期快捷方式
   * @default true
   */
  showDateShortcuts?: boolean;
  /**
   * 自定义图表配置 (ECharts option)
   * 如果提供了 optionGenerator，此属性将被忽略或合并(取决于实现)
   */
  chartOptions?: any;
  /**
   * 将 API 返回的数据转换为 ECharts Option 的函数
   */
  optionGenerator?: (data: any) => any;
  /**
   * 是否自动加载数据
   * @default true
   */
  immediate?: boolean;
}

export interface TrendChartEmits {
  (e: 'rangeChange', params: { endTime: number; startTime: number }): void;
}
