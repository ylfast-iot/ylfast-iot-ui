<script setup lang="ts">
import type { FileEntity } from '#/api/system/file';

import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { useClipboard } from '@vueuse/core';
import { message, Space, Tooltip } from 'ant-design-vue';

import { getFileTypeInfo } from '#/enums/file';

import { formatFileSize } from '../data';

interface Props {
  item: FileEntity;
  isSelected?: boolean;
  bucketLabel?: string;
  nodeLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  bucketLabel: '-',
  nodeLabel: '-',
});

const emit = defineEmits<{
  click: [];
  delete: [];
  download: [];
  edit: [];
  preview: [];
}>();

// 获取文件类型信息
const typeInfo = computed(() => getFileTypeInfo(props.item.extension));

// 创建图标组件
const EyeIcon = createIconifyIcon('lucide:eye');
const DownloadIcon = createIconifyIcon('lucide:download');
const EditIcon = createIconifyIcon('lucide:edit-3');
const ClockIcon = createIconifyIcon('lucide:clock');
const DatabaseIcon = createIconifyIcon('lucide:database');
const BoxIcon = createIconifyIcon('lucide:box');
const LinkIcon = createIconifyIcon('lucide:link-2');
const ShieldIcon = createIconifyIcon('lucide:shield-check');
const CalendarIcon = createIconifyIcon('lucide:calendar-clock');
const CheckIcon = createIconifyIcon('lucide:check');
const CopyIcon = createIconifyIcon('lucide:copy');
const TrashIcon = createIconifyIcon('lucide:trash-2');

const { copy } = useClipboard();

const handleCopy = (text: string, label: string) => {
  copy(text);
  message.success($t('file.card.copySuccess', { label }));
};

// 格式化创建时间
const formattedTime = computed(() => {
  if (!props.item.createTime) return '-';
  const date = new Date(props.item.createTime);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
});

// 过期时间验证
const expirationTime = computed(() => {
  const expire = props.item.expires;
  if (!expire) return null;
  const date = new Date(expire);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
});

// 是否已过期
const isExpired = computed(() => {
  const expire = props.item.expires;
  return expire ? Date.now() > expire : false;
});

// 缩写存储路径
const displayPath = computed(() => {
  const path = props.item.storagePath || (props.item as any).path || '';
  if (path.length <= 35) return path;
  return `...${path.slice(Math.max(0, path.length - 32))}`;
});
</script>

<template>
  <div
    class="file-card-final group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    :class="{
      'border-primary bg-primary/5 ring-1 ring-primary/10': isSelected,
    }"
    @click="emit('click')"
  >
    <!-- Header: Icon, Name, Size, Type -->
    <div class="flex items-center gap-3">
      <!-- Icon Avatar with Theme Background -->
      <div
        class="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-primary/10 text-primary transition-transform group-hover:scale-105"
      >
        <component :is="createIconifyIcon(typeInfo.icon)" class="text-2xl" />
      </div>

      <div class="min-w-0 flex-1">
        <Tooltip :title="item.name">
          <h4
            class="truncate text-[14px] font-bold leading-tight text-foreground"
          >
            {{ item.name }}
          </h4>
        </Tooltip>
        <div class="mt-1 flex items-center gap-1.5 text-[11px]">
          <span class="font-bold text-primary">
            {{ formatFileSize(item.length) }}
          </span>
          <span class="text-foreground/30">•</span>
          <span class="font-medium text-muted-foreground">
            {{ typeInfo.label }} ({{ item.extension.toUpperCase() }})
          </span>
        </div>
      </div>

      <!-- Selected Indicator -->
      <div
        v-if="isSelected"
        class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm"
      >
        <CheckIcon class="size-3" />
      </div>
    </div>

    <!-- Metadata Section (Dense Panel) -->
    <div class="flex flex-col gap-2 rounded-lg bg-muted/30 p-3">
      <!-- Node Row (Highlight) -->
      <div
        class="flex w-full items-center gap-2 rounded-md border-l-2 border-primary/50 bg-primary/5 px-2 py-1"
      >
        <BoxIcon class="size-3.5 text-primary/70" />
        <span
          class="w-11 shrink-0 text-right text-[11px] text-muted-foreground"
        >
          {{ $t('file.card.node') }}：
        </span>
        <span class="truncate text-[11px] font-semibold text-foreground/90">{{
          nodeLabel
        }}</span>
      </div>

      <!-- Second Row: Bucket & Expiration -->
      <div class="flex items-center gap-2 px-2">
        <DatabaseIcon class="size-3.5 shrink-0 text-primary/70" />
        <span
          class="w-11 shrink-0 text-right text-[11px] text-muted-foreground"
        >
          {{ $t('file.card.bucket') }}：
        </span>
        <span class="flex-1 truncate text-[11px] font-bold text-primary">{{
          bucketLabel
        }}</span>

        <Tooltip
          v-if="expirationTime"
          :title="`${$t('file.card.expires')}：${expirationTime}`"
        >
          <div
            v-if="isExpired"
            class="flex items-center gap-1.5 rounded bg-red-500/10 px-1.5 py-0.5"
          >
            <CalendarIcon class="size-3 text-red-500" />
            <span class="text-[10px] font-bold uppercase text-red-500">{{
              $t('file.card.expired')
            }}</span>
          </div>
          <div
            v-else
            class="flex items-center gap-1.5 rounded bg-orange-500/10 px-1.5 py-0.5"
          >
            <CalendarIcon class="size-3 text-orange-500" />
            <span class="text-[10px] font-bold uppercase text-orange-500">{{
              $t('file.card.validity')
            }}</span>
          </div>
        </Tooltip>
      </div>

      <!-- Hash Panel -->
      <div
        class="flex flex-col gap-1 rounded border border-border/40 bg-card/50 p-2"
      >
        <div class="group/hash flex items-center gap-1.5">
          <ShieldIcon class="size-3 shrink-0 opacity-40" />
          <span
            class="w-11 shrink-0 text-right text-[10px] text-muted-foreground"
          >
            MD5:
          </span>
          <Tooltip :title="item.md5">
            <span
              class="flex-1 truncate font-mono text-[9px] text-muted-foreground/80"
            >
              {{ item.md5 }}
            </span>
          </Tooltip>
          <Tooltip :title="$t('file.action.copyMd5')">
            <CopyIcon
              class="size-3 cursor-pointer text-primary opacity-0 transition-opacity hover:scale-110 group-hover/hash:opacity-100"
              @click.stop="handleCopy(item.md5, 'MD5')"
            />
          </Tooltip>
        </div>
        <div class="group/hash flex items-center gap-1.5">
          <ShieldIcon class="size-3 shrink-0 opacity-40" />
          <span
            class="w-11 shrink-0 text-right text-[10px] text-muted-foreground"
          >
            SHA256:
          </span>
          <Tooltip :title="item.sha256">
            <span
              class="flex-1 truncate font-mono text-[9px] text-muted-foreground/80"
            >
              {{ item.sha256 }}
            </span>
          </Tooltip>
          <Tooltip :title="$t('file.action.copySha256')">
            <CopyIcon
              class="size-3 cursor-pointer text-primary opacity-0 transition-opacity hover:scale-110 group-hover/hash:opacity-100"
              @click.stop="handleCopy(item.sha256, 'SHA256')"
            />
          </Tooltip>
        </div>
      </div>

      <!-- Path -->
      <div class="flex items-center gap-1.5 px-2">
        <LinkIcon class="size-3.5 shrink-0 text-primary/70" />
        <span
          class="w-11 shrink-0 text-right text-[11px] text-muted-foreground"
        >
          {{ $t('file.path') }}：
        </span>
        <Tooltip :title="item.storagePath || (item as any).path">
          <span class="truncate font-mono text-[10px] text-muted-foreground/70">
            {{ displayPath }}
          </span>
        </Tooltip>
      </div>
    </div>

    <!-- Footer: Time & Actions -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ClockIcon class="size-3.5 opacity-60" />
        <span>{{ formattedTime }}</span>
      </div>

      <div class="flex items-center">
        <Space size="small">
          <Tooltip :title="$t('file.action.preview')">
            <button class="action-btn-final" @click.stop="emit('preview')">
              <EyeIcon class="size-3.5" />
            </button>
          </Tooltip>
          <Tooltip :title="$t('file.action.download')">
            <button class="action-btn-final" @click.stop="emit('download')">
              <DownloadIcon class="size-3.5" />
            </button>
          </Tooltip>
          <Tooltip :title="$t('file.action.edit')">
            <button
              class="action-btn-final hover:bg-orange-500! hover:text-white!"
              @click.stop="emit('edit')"
            >
              <EditIcon class="size-3.5" />
            </button>
          </Tooltip>
          <Tooltip :title="$t('file.action.delete')">
            <button
              class="action-btn-final hover:bg-red-500! hover:text-white!"
              @click.stop="emit('delete')"
            >
              <TrashIcon class="size-3.5" />
            </button>
          </Tooltip>
        </Space>
      </div>
    </div>
  </div>
</template>

<style scoped>
.action-btn-final {
  @apply flex size-7 cursor-pointer items-center justify-center rounded-lg border border-border/40 bg-muted/60 text-foreground/70 transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-white hover:shadow-md hover:shadow-primary/20 active:scale-95;
}
</style>
