import type { MergeStrategy, TslMergeModalProps } from './types';

import type { DeviceMetadata } from '#/types/metadata';

import { computed, defineComponent, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Modal, Step, Steps } from 'ant-design-vue';

import { DeviceMetadataDiff } from './components';
import { applyStrategy } from './utils';

// 策略图标
const MergeIcon = createIconifyIcon('lucide:git-merge');
const IntersectIcon = createIconifyIcon('lucide:circle-dot');
const OverwriteIcon = createIconifyIcon('lucide:arrow-down-to-line');
const IgnoreIcon = createIconifyIcon('lucide:ban');
const CheckIcon = createIconifyIcon('lucide:check');
const EditIcon = createIconifyIcon('lucide:edit');

// 策略配置映射
const STRATEGY_CONFIG: Record<
  MergeStrategy,
  { bgColor: string; color: string; icon: any; iconBg: string }
> = {
  merge: {
    icon: MergeIcon,
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconBg: 'text-blue-600 dark:text-blue-400',
  },
  intersect: {
    icon: IntersectIcon,
    color: 'purple',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    iconBg: 'text-purple-600 dark:text-purple-400',
  },
  overwrite: {
    icon: OverwriteIcon,
    color: 'orange',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    iconBg: 'text-orange-600 dark:text-orange-400',
  },
  ignore: {
    icon: IgnoreIcon,
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    iconBg: 'text-gray-600 dark:text-gray-400',
  },
};

// 所有可用的策略
const ALL_STRATEGIES: MergeStrategy[] = [
  'merge',
  'intersect',
  'overwrite',
  'ignore',
];

export default defineComponent({
  name: 'TslMergeModal',
  props: {
    visible: { type: Boolean, required: true },
    steps: { type: Array as () => TslMergeModalProps['steps'], required: true },
    existingTsl: { type: Object as () => DeviceMetadata, default: () => ({}) },
    onConfirm: {
      type: Function as unknown as () => (tsl: DeviceMetadata) => void,
      required: true,
    },
    onCancel: { type: Function as unknown as () => () => void, required: true },
  },
  setup(props) {
    // 当前步骤索引 (0-based)
    const currentStepIndex = ref(0);
    // 当前选中的合并策略
    const selectedStrategy = ref<MergeStrategy>('merge');
    // 已合并的中间结果（每步合并后的累积结果）
    const intermediateResult = ref<DeviceMetadata | null>(null);
    // 策略选择历史（用于支持"上一步"）
    const strategyHistory = ref<MergeStrategy[]>([]);

    // 按 order 排序的步骤列表
    const sortedSteps = computed(() => {
      return [...props.steps].sort((a, b) => a.order - b.order);
    });

    // 当前步骤配置
    const currentStep = computed(() => {
      return sortedSteps.value[currentStepIndex.value];
    });

    // 当前步骤可用的策略列表
    const availableStrategies = computed<MergeStrategy[]>(() => {
      const stepStrategies = currentStep.value?.mergeStrategy;
      return stepStrategies && stepStrategies.length > 0
        ? stepStrategies
        : ALL_STRATEGIES;
    });

    // 是否是最后一步
    const isLastStep = computed(() => {
      return currentStepIndex.value === sortedSteps.value.length - 1;
    });

    // 是否是第一步
    const isFirstStep = computed(() => {
      return currentStepIndex.value === 0;
    });

    // 源物模型（当前步骤要合并的）
    const sourceTsl = computed(() => {
      return currentStep.value?.metadata || ({} as DeviceMetadata);
    });

    // 目标物模型（基准，第一步是 existing，后续是 intermediate）
    const targetTsl = computed(() => {
      return intermediateResult.value || props.existingTsl || {};
    });

    // 合并预览（根据当前选择的策略）
    const mergePreview = computed(() => {
      if (!currentStep.value) return {} as DeviceMetadata;
      return applyStrategy(
        selectedStrategy.value,
        targetTsl.value,
        sourceTsl.value,
      );
    });

    // 重置状态
    const resetState = () => {
      currentStepIndex.value = 0;
      selectedStrategy.value = 'merge';
      intermediateResult.value = null;
      strategyHistory.value = [];
    };

    // 当弹窗关闭时重置状态
    watch(
      () => props.visible,
      (newVal) => {
        if (newVal) {
          // 弹窗打开时，确保选中的策略在当前可用策略列表中
          if (!availableStrategies.value.includes(selectedStrategy.value)) {
            selectedStrategy.value = availableStrategies.value[0] || 'merge';
          }
        } else {
          resetState();
        }
      },
    );

    // 处理"下一步"或"确认"
    const handleConfirm = () => {
      if (!currentStep.value) return;

      // 保存当前策略到历史
      strategyHistory.value.push(selectedStrategy.value);

      // 获取当前要合并的物模型
      const currentMetadata = currentStep.value.metadata;
      // 获取基准物模型（第一步是 existing，后续步骤是 intermediate）
      const baseTsl = intermediateResult.value || props.existingTsl || {};

      // 应用合并策略
      const merged = applyStrategy(
        selectedStrategy.value,
        baseTsl,
        currentMetadata,
      );

      if (isLastStep.value) {
        // 最后一步：确认合并，关闭弹窗
        props.onConfirm(merged);
        resetState();
      } else {
        // 非最后一步：保存中间结果，进入下一步
        intermediateResult.value = merged;
        currentStepIndex.value += 1;
        // 重置策略选择
        const nextAvailableStrategies =
          sortedSteps.value[currentStepIndex.value]?.mergeStrategy ||
          ALL_STRATEGIES;
        selectedStrategy.value = nextAvailableStrategies[0] || 'merge';
      }
    };

    // 处理"上一步"
    const handlePrevious = () => {
      if (isFirstStep.value) return;

      // 回退步骤
      currentStepIndex.value -= 1;

      // 恢复上一步的策略选择
      const previousStrategy = strategyHistory.value.pop();
      if (previousStrategy) {
        selectedStrategy.value = previousStrategy;
      }

      // 如果回到第一步，清空中间结果
      if (currentStepIndex.value === 0) {
        intermediateResult.value = null;
      } else {
        // 重新计算到上一步为止的中间结果
        let tempResult = props.existingTsl || {};
        for (let i = 0; i < currentStepIndex.value; i++) {
          const step = sortedSteps.value[i];
          const strategy = strategyHistory.value[i];
          if (step && strategy) {
            tempResult = applyStrategy(strategy, tempResult, step.metadata);
          }
        }
        intermediateResult.value = tempResult;
      }
    };

    // 处理取消
    const handleCancel = () => {
      props.onCancel();
      resetState();
    };

    // 处理策略切换
    const handleStrategyChange = (strategy: MergeStrategy) => {
      selectedStrategy.value = strategy;
    };

    return {
      availableStrategies,
      currentStep,
      currentStepIndex,
      handleCancel,
      handleConfirm,
      handlePrevious,
      handleStrategyChange,
      isFirstStep,
      isLastStep,
      mergePreview,
      selectedStrategy,
      sortedSteps,
      sourceTsl,
      STRATEGY_CONFIG,
      targetTsl,
    };
  },
  render() {
    const {
      availableStrategies,
      currentStep,
      currentStepIndex,
      handleCancel,
      handleConfirm,
      handlePrevious,
      handleStrategyChange,
      isFirstStep,
      isLastStep,
      mergePreview,
      selectedStrategy,
      sortedSteps,
      sourceTsl,
      STRATEGY_CONFIG,
      targetTsl,
      visible,
    } = this;

    if (!currentStep) return null;

    return (
      <Modal
        footer={null}
        onCancel={handleCancel}
        open={visible}
        title={$t('gateway.deviceAccess.tsl.conflictTitle')}
        width="1220px"
      >
        {/* Steps Indicator */}
        {sortedSteps.length > 1 && (
          <Steps class="mb-6" current={currentStepIndex} size="small">
            {sortedSteps.map((step, index) => (
              <Step key={index} title={step.name} />
            ))}
          </Steps>
        )}

        {/* Merge Strategies */}
        <div class="flex flex-col gap-4">
          {/* Step Description */}
          <div class="mb-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
            <div class="flex items-start gap-2">
              <div class="mt-0.5 text-blue-500">
                <EditIcon class="size-4" />
              </div>
              <div class="flex-1">
                <div class="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {currentStep.name}
                </div>
                <div class="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  {currentStep.description}
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Cards */}
          <div class="grid grid-cols-4 gap-3">
            {availableStrategies.map((strategy) => {
              const config = STRATEGY_CONFIG[strategy];
              const IconComponent = config.icon;
              const isSelected = selectedStrategy === strategy;

              return (
                <div
                  class={[
                    'group relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                      : 'border-slate-200 bg-white hover:border-primary/50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800',
                  ]}
                  key={strategy}
                  onClick={() => handleStrategyChange(strategy)}
                >
                  <div class="flex items-start gap-3">
                    <div
                      class={[
                        'flex size-10 shrink-0 items-center justify-center rounded-lg',
                        isSelected
                          ? 'bg-primary text-white'
                          : `${config.bgColor} ${config.iconBg}`,
                      ]}
                    >
                      <IconComponent class="size-5" />
                    </div>
                    <div class="flex-1">
                      <div class="mb-1 font-bold">
                        {$t(`gateway.deviceAccess.tsl.${strategy}`)}
                      </div>
                      <div class="text-xs text-slate-500 dark:text-slate-400">
                        {$t(`gateway.deviceAccess.tsl.${strategy}Desc`)}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div class="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-primary text-white shadow-md ring-2 ring-white dark:ring-slate-900">
                      <CheckIcon class="size-3.5" stroke-width="3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* TSL Metadata Diff */}
          <div class="mt-6">
            <DeviceMetadataDiff
              mergedTsl={mergePreview}
              sourceTsl={sourceTsl}
              targetTsl={targetTsl}
            />
          </div>
        </div>

        {/* Custom Footer */}
        <div class="mt-6 flex justify-end gap-2">
          <Button onClick={handleCancel}>{$t('common.action.cancel')}</Button>
          {!isFirstStep && (
            <Button onClick={handlePrevious}>
              {$t('common.action.previous')}
            </Button>
          )}
          <Button onClick={handleConfirm} type="primary">
            {isLastStep
              ? $t('gateway.deviceAccess.tsl.confirmMerge')
              : $t('common.action.next')}
          </Button>
        </div>
      </Modal>
    );
  },
});
