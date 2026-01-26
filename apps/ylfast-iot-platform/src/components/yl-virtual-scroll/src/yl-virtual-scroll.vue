<script setup lang="ts">
import type { YlVirtualScrollActionType, YlVirtualScrollProps } from './types';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

const props = withDefaults(defineProps<YlVirtualScrollProps>(), {
  itemHeight: 24,
  containerHeight: '100%',
  buffer: 5,
  autoScrollToBottom: true,
});

const scrollContainerRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);

// 计算总高度
const totalHeight = computed(() => props.items.length * props.itemHeight);

// 计算可见范围
const visibleRange = computed(() => {
  if (!scrollContainerRef.value) {
    return { start: 0, end: 20 };
  }

  const containerHeight = scrollContainerRef.value.clientHeight;
  const start = Math.floor(scrollTop.value / props.itemHeight);
  const visibleCount = Math.ceil(containerHeight / props.itemHeight);

  // 添加缓冲区
  const bufferedStart = Math.max(0, start - props.buffer);
  const bufferedEnd = Math.min(
    props.items.length,
    start + visibleCount + props.buffer,
  );

  return { start: bufferedStart, end: bufferedEnd };
});

const startIndex = computed(() => visibleRange.value.start);
const endIndex = computed(() => visibleRange.value.end);

// 可见项
const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value);
});

// 偏移量
const offsetY = computed(() => startIndex.value * props.itemHeight);

// 滚动处理
function handleScroll(event: Event) {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
}

// 滚动到底部
function scrollToBottom() {
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = scrollContainerRef.value.scrollHeight;
  }
}

// 监听items变化，自动滚动到底部
watch(
  () => props.items.length,
  () => {
    if (props.autoScrollToBottom) {
      nextTick(() => {
        scrollToBottom();
      });
    }
  },
);

onMounted(() => {
  if (props.autoScrollToBottom) {
    nextTick(() => {
      scrollToBottom();
    });
  }
});

// 暴露方法
const action: YlVirtualScrollActionType = {
  scrollToBottom,
};

defineExpose(action);
</script>

<template>
  <div
    ref="scrollContainerRef"
    class="yl-virtual-scroll-container"
    :style="{ height: containerHeight }"
    @scroll="handleScroll"
  >
    <div
      class="yl-virtual-scroll-spacer"
      :style="{ height: `${totalHeight}px`, paddingTop: `${offsetY}px` }"
    >
      <div
        v-for="(item, index) in visibleItems"
        :key="startIndex + index"
        class="yl-virtual-scroll-item"
        :style="{ height: `${itemHeight}px` }"
      >
        <slot :item="item" :index="startIndex + index"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yl-virtual-scroll-container {
  position: relative;
  overflow: hidden auto;
}

.yl-virtual-scroll-spacer {
  position: relative;
}

.yl-virtual-scroll-item {
  overflow: hidden;
}
</style>
