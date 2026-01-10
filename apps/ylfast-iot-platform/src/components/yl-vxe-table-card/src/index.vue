<script setup lang="ts">
import type { Component } from 'vue';

import type { TableCardSingleMode, YlVxeTableCardProps } from './types';

import type { ExtendedVxeGridApi } from '#/adapter/vxe-table';

import { computed, nextTick, ref, useAttrs, useSlots, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { useResizeObserver, useVirtualList } from '@vueuse/core';
import { Empty, Spin, Tooltip } from 'ant-design-vue';

import { $t } from '#/locales';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  gridApi: ExtendedVxeGridApi;
  gridComponent: Component;
  mode: 'card' | 'table';
  propsConfig: YlVxeTableCardProps;
}>();
const emit = defineEmits(['update:mode', 'resize']);
const attrs = useAttrs();
// 图标
const AppstoreOutlined = createIconifyIcon('ant-design:appstore-outlined');
const BarsOutlined = createIconifyIcon('ant-design:bars-outlined');

const slots = useSlots();
const filteredSlotNames = computed(() => {
  return Object.keys(slots).filter((key) => key !== 'toolbar-tools');
});

// 本地卡片数据状态 (独立于表格 DOM，但来源于同一数据流)
const cardData = ref<any[]>([]);
const loading = ref(false);

// 布局计算
const wrapperRef = ref<HTMLElement | null>(null);
const topOffset = ref(0);
const bottomOffset = ref(0);

// 虚拟滚动相关
const cols = ref(1);

// 根据容器宽度计算列数 (仿 Tailwind 逻辑)
const updateCols = (width: number) => {
  if (width >= 1536)
    cols.value = 5; // 2xl
  else if (width >= 1280)
    cols.value = 4; // xl
  else if (width >= 768)
    cols.value = 3; // md
  else if (width >= 640)
    cols.value = 2; // sm
  else cols.value = 1;
};

const updateLayout = () => {
  if (!wrapperRef.value) return;
  const el = wrapperRef.value;

  // 更新列数
  updateCols(el.offsetWidth);

  const form = el.querySelector('.vxe-grid--form-wrapper') as HTMLElement;
  const toolbar = el.querySelector('.vxe-grid--toolbar-wrapper') as HTMLElement;
  const pager = el.querySelector('.vxe-pager') as HTMLElement;

  let top = 0;
  if (form) top += form.offsetHeight;
  if (toolbar) top += toolbar.offsetHeight;

  let bottom = 0;
  if (pager) bottom += pager.offsetHeight;

  topOffset.value = top;
  bottomOffset.value = bottom;
};

// 将数据分块，适配 Grid 布局
const chunkedData = computed(() => {
  const result = [];
  const columnCount = cols.value;
  for (let i = 0; i < cardData.value.length; i += columnCount) {
    result.push(cardData.value.slice(i, i + columnCount));
  }
  return result;
});

// 虚拟列表
const { list, containerProps, wrapperProps } = useVirtualList(chunkedData, {
  // 预估高度，实际会自动测量
  itemHeight: 200,
});

// 监听容器大小变化，动态更新布局
useResizeObserver(wrapperRef, (data) => {
  updateLayout();
  emit('resize', data);
});

// 监听模式切换，重新计算布局
watch(
  () => props.mode,
  (newMode) => {
    if (newMode === 'card') {
      nextTick(() => updateLayout());
    }
  },
);

const handleGridReady = () => {
  const bindEvents = {
    dataChange: (p: { visibleColumn: any[]; visibleData: any[] }) => {
      if (props.mode === 'card') {
        cardData.value = p.visibleData;
      }
    },
    proxyQuery: () => {},
  };

  props.gridApi.setState((prev) => {
    const prevEvents = prev.gridEvents || {};
    const newEvents: any = { ...prevEvents };

    Object.keys(bindEvents).forEach((key) => {
      const original = newEvents[key];
      const mine = bindEvents[key as keyof typeof bindEvents];
      newEvents[key] = (...args: any[]) => {
        // @ts-ignore
        mine(...args);
        if (typeof original === 'function') {
          original(...args);
        }
      };
    });

    return { gridEvents: newEvents };
  });

  // 如果是静态数据模式
  if (props.propsConfig?.gridOptions?.data) {
    cardData.value = props.propsConfig.gridOptions.data;
  }

  // 初始化计算布局
  nextTick(() => updateLayout());
};

function changeMode() {
  props.gridApi.grid.commitProxy('reload');
}

const setMode = (m: TableCardSingleMode) => {
  if (props.mode !== m) {
    emit('update:mode', m);
  }
  changeMode();
};

defineExpose({
  changeMode,
  setMode,
  resize: () => {
    updateLayout();
  },
});
</script>

<template>
  <div class="yl-vxe-table-card relative flex h-full flex-col">
    <!-- 1. 表格层 (Driver) -->
    <!-- 当模式为 card 时，通过 CSS 隐藏主体，但保留 Toolbar -->
    <div
      ref="wrapperRef"
      :class="{ 'hide-table-body': mode === 'card' }"
      class="relative flex-1 overflow-hidden"
    >
      <component
        :is="gridComponent"
        v-bind="attrs"
        @vue:mounted="handleGridReady"
      >
        <!-- 透传 Slot -->
        <template v-for="name in filteredSlotNames" :key="name" #[name]="data">
          <slot :name="name" v-bind="data"></slot>
        </template>

        <!-- 注入切换按钮 -->
        <template
          v-if="propsConfig.mode !== 'table' && propsConfig.mode !== 'card'"
          #toolbar-tools
        >
          <slot name="toolbar-tools"></slot>
          <div
            class="ml-2 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-[#262626]"
          >
            <Tooltip :title="$t('ylVxeTableCard.viewMode.list')">
              <component
                :is="BarsOutlined"
                class="cursor-pointer rounded-md p-1 text-2xl outline-none transition-all duration-200"
                :class="[
                  mode === 'table'
                    ? 'bg-white text-primary shadow-sm dark:bg-[#1f1f1f]'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                ]"
                @click="setMode('table')"
              />
            </Tooltip>
            <Tooltip :title="$t('ylVxeTableCard.viewMode.card')">
              <component
                :is="AppstoreOutlined"
                class="cursor-pointer rounded-md p-1 text-2xl outline-none transition-all duration-200"
                :class="[
                  mode === 'card'
                    ? 'bg-white text-primary shadow-sm dark:bg-[#1f1f1f]'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                ]"
                @click="setMode('card')"
              />
            </Tooltip>
          </div>
        </template>
        <template v-else #toolbar-tools>
          <slot name="toolbar-tools"></slot>
        </template>
      </component>
    </div>

    <!-- 2. 卡片层 (Consumer) -->
    <div
      v-if="mode === 'card'"
      :style="{ top: `${topOffset}px`, bottom: `${bottomOffset}px` }"
      class="card-layer absolute inset-x-0 z-10 flex flex-col bg-white dark:bg-[#030712]"
    >
      <!-- Loading -->
      <div v-if="loading" class="flex flex-1 items-center justify-center">
        <Spin size="large" />
      </div>

      <!-- Empty -->
      <div
        v-else-if="cardData.length === 0"
        class="flex flex-1 items-center justify-center"
      >
        <Empty :description="$t('common.noData')" />
      </div>

      <!-- Content (Virtual Scroll) -->
      <div
        v-else
        v-bind="containerProps"
        class="flex-1 overflow-y-auto overflow-x-hidden p-4"
      >
        <div v-bind="wrapperProps">
          <div
            v-for="item in list"
            :key="item.index"
            class="mb-4 grid gap-4"
            :style="{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }"
          >
            <div
              v-for="(row, colIndex) in item.data"
              :key="row.id || row._id || colIndex"
              class="w-full"
            >
              <!-- 根据 chunkedData 的结构，item.data 是一个数组（一行的数据） -->
              <!-- 我们需要计算原始索引以便传递给 slot -->
              <!-- item.index 是行的索引，cols 是列数 -->
              <slot
                :index="item.index * cols + colIndex"
                :row="row"
                name="card"
              >
                {{ row }}
              </slot>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hide-table-body :deep(.vxe-table--body-wrapper),
.hide-table-body :deep(.vxe-table--header-wrapper) {
  display: none !important;
}

/* 解决切换bug导致底部多一个线条 */
.hide-table-body :deep(.vxe-table--scroll-x-virtual) {
  visibility: hidden !important;
}

.hide-table-body :deep(.vxe-grid--layout-body-content-wrapper) {
  background: #fff !important;
}

.hide-table-body :deep(.vxe-pager),
.hide-table-body :deep(.vxe-table--footer-wrapper) {
  z-index: 14 !important;
}
</style>
