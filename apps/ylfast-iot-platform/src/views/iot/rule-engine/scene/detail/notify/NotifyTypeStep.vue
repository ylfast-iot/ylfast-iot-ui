<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Empty, Spin } from 'ant-design-vue';

import { getNotifyTypes } from '#/api/iot/notify/config';
import { NOTIFY_TYPE_ENUMS } from '#/enums/notify';

defineProps<{
  value?: string;
}>();

const emit = defineEmits<{
  select: [value: string];
  'update:value': [value: string];
}>();

const loading = ref(false);
const types = ref<any[]>([]);

const colorMap: Record<string, { background: string; color: string }> = {
  blue: { background: '#eef4ff', color: '#1677ff' },
  green: { background: '#edf9ee', color: '#2f9b45' },
  orange: { background: '#fff6eb', color: '#fa8c16' },
  purple: { background: '#f6f0ff', color: '#722ed1' },
  gray: { background: '#f5f5f5', color: '#595959' },
};

const options = computed(() =>
  types.value.map((item) => {
    const normalizedId = item.id === 'weixin' ? 'wechat' : item.id;
    const typeConfig = (NOTIFY_TYPE_ENUMS as any)[normalizedId] || {
      color: 'blue',
      icon: 'lucide:bell',
      text: item.name || normalizedId,
    };
    return {
      ...item,
      icon: typeConfig.icon,
      iconStyle: colorMap[typeConfig.color] || colorMap.blue,
      label: item.name || typeConfig.text || normalizedId,
      normalizedId,
    };
  }),
);

async function loadTypes() {
  loading.value = true;
  try {
    const result = await getNotifyTypes();
    types.value = Array.isArray(result) ? result : [];
  } finally {
    loading.value = false;
  }
}

function selectType(value: string) {
  emit('update:value', value);
  emit('select', value);
}

onMounted(loadTypes);
</script>

<template>
  <Spin :spinning="loading">
    <div class="notify-type-grid">
      <button
        v-for="item in options"
        :key="item.id"
        type="button"
        class="notify-type-card"
        :class="{ active: value === item.normalizedId }"
        @click="selectType(item.normalizedId)"
      >
        <div class="notify-type-icon" :style="item.iconStyle">
          <IconifyIcon :icon="item.icon" class="size-8" />
        </div>
        <div class="notify-type-title">{{ item.label }}</div>
      </button>
    </div>
    <Empty v-if="!loading && options.length === 0" class="py-10" />
  </Spin>
</template>

<style scoped>
.notify-type-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px 20px;
}

.notify-type-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  justify-content: center;
  min-height: 152px;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 16px;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.notify-type-card:hover {
  border-color: #d0dbe8;
  transform: translateY(-1px);
}

.notify-type-card.active {
  background: #f7fbff;
  border-color: #1677ff;
}

.notify-type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68px;
  height: 68px;
  border-radius: 18px;
}

.notify-type-title {
  font-size: 15px;
  font-weight: 500;
  color: #1f1f1f;
}
</style>
