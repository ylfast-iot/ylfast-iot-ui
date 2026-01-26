import type { DeviceMetadata, DeviceMetadataType } from '#/types/metadata';

import { computed, defineComponent, ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Tabs } from 'ant-design-vue';

// 图标
const PlusIcon = createIconifyIcon('lucide:plus-circle');
const MinusIcon = createIconifyIcon('lucide:minus-circle');
const CheckIcon = createIconifyIcon('lucide:check-circle');

interface DeviceMetadataDiffProps {
  sourceTsl: DeviceMetadata | Record<string, any>;
  targetTsl: DeviceMetadata | Record<string, any>;
  mergedTsl: DeviceMetadata | Record<string, any>;
}

// 所有的元数据类型
const METADATA_TYPES: DeviceMetadataType[] = [
  'properties',
  'functions',
  'events',
  'tags',
  'expands',
];

export default defineComponent({
  name: 'DeviceMetadataDiff',
  props: {
    sourceTsl: {
      type: Object as () => DeviceMetadataDiffProps['sourceTsl'],
      required: true,
    },
    targetTsl: {
      type: Object as () => DeviceMetadataDiffProps['targetTsl'],
      required: true,
    },
    mergedTsl: {
      type: Object as () => DeviceMetadataDiffProps['mergedTsl'],
      required: true,
    },
  },
  setup(props) {
    const activeTab = ref<DeviceMetadataType>('properties');

    /**
     * 计算指定类型的三栏对比数据
     */
    const getThreeWayComparison = (type: DeviceMetadataType) => {
      const sourceItems = getItemsByType(props.sourceTsl, type);
      const targetItems = getItemsByType(props.targetTsl, type);
      const mergedItems = getItemsByType(props.mergedTsl, type);

      // 收集所有唯一的 ID
      const allIds = new Set<string>();
      [...sourceItems, ...targetItems, ...mergedItems].forEach((item) => {
        allIds.add(item.id);
      });

      // 为每个 ID 生成三栏对比数据
      return [...allIds].map((id) => {
        const sourceItem = sourceItems.find((item) => item.id === id);
        const targetItem = targetItems.find((item) => item.id === id);
        const mergedItem = mergedItems.find((item) => item.id === id);

        return {
          id,
          name: sourceItem?.name || targetItem?.name || mergedItem?.name || id,
          description:
            sourceItem?.description ||
            targetItem?.description ||
            mergedItem?.description,
          inSource: !!sourceItem,
          inTarget: !!targetItem,
          inMerged: !!mergedItem,
        };
      });
    };

    /**
     * 根据类型获取元数据项列表
     */
    function getItemsByType(
      tsl: DeviceMetadata | Record<string, any>,
      type: DeviceMetadataType,
    ): any[] {
      if (type === 'expands') {
        const expands = tsl?.expands || {};
        return Object.keys(expands).map((key) => ({
          id: key,
          name: key,
          description: typeof expands[key] === 'string' ? expands[key] : '',
        }));
      }
      return (tsl?.[type] as any[]) || [];
    }

    /**
     * 计算每个类型的统计信息
     */
    const getTabStats = (type: DeviceMetadataType) => {
      const comparison = getThreeWayComparison(type);
      const added = comparison.filter(
        (item) => item.inSource && !item.inTarget,
      ).length;
      const removed = comparison.filter(
        (item) => !item.inMerged && item.inTarget,
      ).length;
      const unchanged = comparison.filter(
        (item) => item.inMerged && item.inTarget,
      ).length;
      return { added, removed, total: comparison.length, unchanged };
    };

    // 为每个 Tab 准备数据
    const tabsData = computed(() => {
      return METADATA_TYPES.map((type) => {
        const stats = getTabStats(type);
        const comparison = getThreeWayComparison(type);
        return {
          comparison,
          key: type,
          label: $t(`gateway.deviceAccess.tsl.comparison.${type}`),
          stats,
        };
      });
    });

    return {
      activeTab,
      CheckIcon,
      MinusIcon,
      PlusIcon,
      tabsData,
    };
  },
  render() {
    const { activeTab, CheckIcon, MinusIcon, PlusIcon, tabsData } = this;

    return (
      <div class="device-metadata-diff rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <Tabs
          activeKey={activeTab}
          class="[&_.ant-tabs-ink-bar]:bg-primary [&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav]:border-b [&_.ant-tabs-nav]:border-slate-200 [&_.ant-tabs-nav]:px-6 [&_.ant-tabs-nav]:dark:border-slate-700 [&_.ant-tabs-tab-active]:text-primary [&_.ant-tabs-tab-active]:dark:text-primary [&_.ant-tabs-tab:hover]:text-primary [&_.ant-tabs-tab]:px-4 [&_.ant-tabs-tab]:py-3 [&_.ant-tabs-tab]:text-sm [&_.ant-tabs-tab]:font-medium [&_.ant-tabs-tab]:text-slate-600 [&_.ant-tabs-tab]:transition-colors [&_.ant-tabs-tab]:dark:text-slate-400"
          onChange={(key) =>
            (this.activeTab = String(key) as DeviceMetadataType)
          }
        >
          {tabsData.map((tab) => (
            <Tabs.TabPane
              key={tab.key}
              tab={
                <span class="inline-flex items-center gap-2">
                  <span>{tab.label}</span>
                  {tab.stats.total > 0 && (
                    <span class="inline-flex min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                      {tab.stats.total}
                    </span>
                  )}
                </span>
              }
            >
              <div class="border-t border-slate-200 p-4 dark:border-slate-700">
                {/* 统计摘要 */}
                <div class="mb-4 flex flex-wrap gap-3 text-sm">
                  <div class="flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                    <PlusIcon class="size-4" />
                    <span>{$t('gateway.deviceAccess.tsl.diff.added')}</span>
                    <span class="font-semibold">{tab.stats.added}</span>
                  </div>
                  <div class="flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                    <MinusIcon class="size-4" />
                    <span>{$t('gateway.deviceAccess.tsl.diff.removed')}</span>
                    <span class="font-semibold">{tab.stats.removed}</span>
                  </div>
                  <div class="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <CheckIcon class="size-4" />
                    <span>{$t('gateway.deviceAccess.tsl.diff.unchanged')}</span>
                    <span class="font-semibold">{tab.stats.unchanged}</span>
                  </div>
                </div>

                {/* 三栏对比表格 */}
                {tab.comparison.length === 0 ? (
                  <div class="py-12 text-center text-sm text-slate-400">
                    {$t('common.noData')}
                  </div>
                ) : (
                  <div class="max-h-96 overflow-y-auto">
                    <table class="w-full border-collapse text-sm">
                      <thead class="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th class="border-b-2 border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                            {$t('gateway.deviceAccess.tsl.comparison.itemName')}
                          </th>
                          <th class="border-b-2 border-slate-200 px-3 py-2 text-center font-semibold text-orange-700 dark:border-slate-700 dark:text-orange-400">
                            {$t('gateway.deviceAccess.tsl.comparison.target')}
                          </th>
                          <th class="border-b-2 border-slate-200 px-3 py-2 text-center font-semibold text-blue-700 dark:border-slate-700 dark:text-blue-400">
                            {$t('gateway.deviceAccess.tsl.comparison.source')}
                          </th>
                          <th class="border-b-2 border-slate-200 px-3 py-2 text-center font-semibold text-primary dark:border-slate-700">
                            {$t('gateway.deviceAccess.tsl.comparison.preview')}
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                        {tab.comparison.map((item) => (
                          <tr
                            class="group hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            key={item.id}
                          >
                            {/* 项目名称 */}
                            <td class="px-3 py-3">
                              <div class="font-medium text-slate-700 dark:text-slate-300">
                                {item.name}
                              </div>
                              {item.description && (
                                <div class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                  {item.description}
                                </div>
                              )}
                              <div class="mt-0.5 font-mono text-xs text-slate-400 dark:text-slate-500">
                                {item.id}
                              </div>
                            </td>

                            {/* 基础物模型 */}
                            <td class="px-3 py-3 text-center">
                              {item.inTarget ? (
                                <div class="inline-flex size-6 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400">
                                  <CheckIcon class="size-4" />
                                </div>
                              ) : (
                                <span class="text-slate-300 dark:text-slate-600">
                                  —
                                </span>
                              )}
                            </td>

                            {/* 当前物模型 */}
                            <td class="px-3 py-3 text-center">
                              {item.inSource ? (
                                <div class="inline-flex size-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                                  <CheckIcon class="size-4" />
                                </div>
                              ) : (
                                <span class="text-slate-300 dark:text-slate-600">
                                  —
                                </span>
                              )}
                            </td>

                            {/* 合并后 */}
                            <td class="px-3 py-3 text-center">
                              {item.inMerged ? (
                                <div class="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <CheckIcon class="size-4" />
                                </div>
                              ) : (
                                <div class="inline-flex size-6 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
                                  <MinusIcon class="size-4" />
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Tabs.TabPane>
          ))}
        </Tabs>
      </div>
    );
  },
});
