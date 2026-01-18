<script setup lang="ts">
import type { UserDetail } from '#/adapter/hsweb/user';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Avatar, Tag } from 'ant-design-vue';

import { getUserStateInfo } from '../config';

defineProps<{
  isSelected?: boolean;
  item: UserDetail;
}>();

const CheckIcon = createIconifyIcon('lucide:check-circle-2');
const UserIcon = createIconifyIcon('lucide:user');
const MailIcon = createIconifyIcon('lucide:mail');
const PhoneIcon = createIconifyIcon('lucide:phone');
const OrgIcon = createIconifyIcon('lucide:building-2');
</script>

<template>
  <div
    class="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 p-4 transition-all duration-300 ease-in-out"
    :class="[
      isSelected
        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/20'
        : 'border-border bg-card hover:border-primary/50 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none',
    ]"
  >
    <!-- Selection Checkmark -->
    <transition name="scale">
      <div
        v-if="isSelected"
        class="absolute right-2 top-2 z-20 flex size-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/20 dark:bg-[#1c1e23]"
      >
        <CheckIcon class="size-full text-primary" />
      </div>
    </transition>

    <!-- Header: Avatar + Info -->
    <div class="flex items-center gap-4">
      <div class="shrink-0">
        <Avatar
          :size="48"
          :src="item.avatar"
          class="flex items-center justify-center rounded-xl border border-border bg-primary/10 shadow-sm transition-colors duration-300 group-hover:bg-primary/20"
        >
          <template #icon><UserIcon class="size-6 text-primary" /></template>
        </Avatar>
      </div>

      <div class="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <div class="flex items-center justify-between gap-2">
          <span
            class="truncate text-base font-bold tracking-tight text-foreground"
            :title="item.name"
          >
            {{ item.name || item.username }}
          </span>
        </div>
        <div class="flex items-center gap-1.5 overflow-hidden">
          <span
            class="text-[10px] font-medium uppercase text-muted-foreground opacity-70"
          >
            {{ item.username }}
          </span>
          <span
            v-if="item.orgList?.[0]"
            class="flex items-center gap-1 truncate text-[10px] text-muted-foreground"
          >
            <span class="size-0.5 rounded-full bg-muted-foreground/30"></span>
            <OrgIcon class="size-3 shrink-0" />
            {{ item.orgList[0].name }}
          </span>
        </div>
      </div>
    </div>

    <!-- Body: Details -->
    <div class="mt-4 flex flex-col gap-2.5">
      <!-- Contact Info -->
      <div class="flex flex-col gap-1 text-[11px] text-muted-foreground">
        <div v-if="item.email" class="flex items-center gap-2 truncate">
          <MailIcon class="size-3 shrink-0 opacity-60" />
          <span class="truncate">{{ item.email }}</span>
        </div>
        <div v-if="item.telephone" class="flex items-center gap-2 truncate">
          <PhoneIcon class="size-3 shrink-0 opacity-60" />
          <span class="truncate">{{ item.telephone }}</span>
        </div>
      </div>

      <!-- State Tag -->
      <div
        class="flex items-center justify-between border-t border-border pt-2.5"
      >
        <span
          class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground opacity-60"
        >
          {{ $t('common.status') }}
        </span>
        <div
          class="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset"
          :class="[
            getUserStateInfo(item.status).statusColor === 'success'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-700/10 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-700 ring-rose-700/10 dark:bg-rose-500/10 dark:text-rose-400',
          ]"
        >
          <div
            class="size-1.5 rounded-full"
            :class="[
              getUserStateInfo(item.status).statusColor === 'success'
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                : 'bg-rose-500',
            ]"
          ></div>
          {{ getUserStateInfo(item.status).label }}
        </div>
      </div>

      <!-- Info Grid -->
      <div class="flex flex-col gap-2 pt-1">
        <div class="flex flex-wrap gap-1">
          <Tag
            v-for="role in item.roleList"
            :key="role.id"
            color="blue"
            class="m-0 border-none bg-blue-500/10 text-[10px] text-blue-600 dark:text-blue-400"
          >
            {{ role.name }}
          </Tag>
          <span
            v-if="!item.roleList?.length"
            class="text-[10px] italic text-muted-foreground opacity-50"
          >
            暂无角色
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

.border-primary {
  box-shadow: 0 0 15px -3px hsl(var(--primary), 0.2);
}
</style>
