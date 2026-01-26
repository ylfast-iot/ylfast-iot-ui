import type { DeviceMetadata } from '#/types/metadata';

/**
 * 合并策略类型
 */
export type MergeStrategy = 'ignore' | 'intersect' | 'merge' | 'overwrite';

/**
 * TSL 合并步骤配置
 */
export interface TslMergeStepConfig {
  /** 步骤顺序 */
  order: number;
  /** 步骤名称（界面显示） */
  name: string;
  /** 步骤描述（界面显示） */
  description: string;
  /** 待合并的物模型 */
  metadata: DeviceMetadata;
  /** 可用的合并策略（不填则支持所有策略） */
  mergeStrategy?: MergeStrategy[];
}

/**
 * TslMergeModal 组件 Props
 */
export interface TslMergeModalProps {
  /** 显示/隐藏 */
  visible: boolean;
  /** 合并步骤配置（按 order 排序） */
  steps: TslMergeStepConfig[];
  /** 现有物模型（基准） */
  existingTsl?: DeviceMetadata;
  /** 确认回调 */
  onConfirm: (mergedTsl: DeviceMetadata) => void;
  /** 取消回调 */
  onCancel: () => void;
}
