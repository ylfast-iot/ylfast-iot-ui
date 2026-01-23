<script setup lang="ts">
import type { FileBucketEntity } from '#/api/system/file';
import type { SystemClusterMonitorApi } from '#/api/system/monitor/cluster';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Card, Dropdown, Menu, Spin } from 'ant-design-vue';

defineProps<{
  bucketList: FileBucketEntity[];
  clusterNodes: SystemClusterMonitorApi.ClusterNodeInfo[];
  loadingBuckets: boolean;
  loadingNodes: boolean;
  selectedBucket: 'all' | 'default' | string;
  selectedNodeId: string | undefined;
}>();
const emit = defineEmits([
  'selectNode',
  'selectBucket',
  'openUpload',
  'openBucketModal',
  'editBucket',
  'deleteBucket',
]);
const LayersIcon = createIconifyIcon('lucide:layers');
const PlusIcon = createIconifyIcon('lucide:plus');
const FolderIcon = createIconifyIcon('lucide:folder');
const DatabaseIcon = createIconifyIcon('lucide:database');
const MonitorIcon = createIconifyIcon('lucide:monitor');
const BoxIcon = createIconifyIcon('lucide:box');
const MoreVerticalIcon = createIconifyIcon('lucide:more-horizontal');
const EditIcon = createIconifyIcon('lucide:edit-3');
const Trash2Icon = createIconifyIcon('lucide:trash-2');
const UploadIcon = createIconifyIcon('lucide:upload');
const LockIcon = createIconifyIcon('lucide:lock');
</script>

<template>
  <Card
    class="flex h-full flex-col"
    :body-style="{ padding: '10px', flex: 1, overflow: 'auto' }"
  >
    <template #title>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
          >
            <LayersIcon class="block size-5" />
          </div>
          <span class="text-[14px] font-bold">{{
            $t('file.sidebar.resourceBrowser')
          }}</span>
        </div>
        <Dropdown :trigger="['click']">
          <Button
            type="primary"
            size="small"
            class="flex items-center justify-center"
          >
            <template #icon><PlusIcon /></template>
          </Button>
          <template #overlay>
            <Menu
              @click="
                (e) =>
                  e.key === 'upload'
                    ? emit('openUpload')
                    : emit('openBucketModal')
              "
            >
              <Menu.Item key="bucket">
                <template #icon><FolderIcon class="size-4" /></template>
                {{ $t('file.sidebar.addBucket') }}
              </Menu.Item>
              <Menu.Item key="upload">
                <template #icon><UploadIcon class="size-4" /></template>
                {{ $t('file.action.upload') }}
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </div>
    </template>

    <nav class="flex flex-col gap-1">
      <div class="nav-group-title">{{ $t('file.sidebar.clusterNodes') }}</div>
      <div
        class="nav-item-role transition-all"
        :class="selectedNodeId === undefined ? 'bg-primary/20 font-bold' : ''"
        @click="emit('selectNode', undefined)"
      >
        <DatabaseIcon
          class="size-4.5 transition-all"
          :class="[
            selectedNodeId === undefined
              ? 'text-primary opacity-100'
              : 'text-foreground/70 opacity-70',
          ]"
        />
        <span
          class="text-[14px]"
          :class="
            selectedNodeId === undefined ? 'text-primary' : 'text-foreground/70'
          "
        >
          {{ $t('file.sidebar.allNodes') }}
        </span>
      </div>

      <Spin :spinning="loadingNodes" size="small">
        <div
          v-for="node in clusterNodes"
          :key="node.serverId"
          class="nav-item-role transition-all"
          :class="
            selectedNodeId === node.serverId ? 'bg-primary/20 font-bold' : ''
          "
          @click="emit('selectNode', node.serverId)"
        >
          <div class="relative flex items-center justify-center">
            <MonitorIcon
              class="size-4 transition-all"
              :class="[
                selectedNodeId === node.serverId
                  ? 'text-primary opacity-100'
                  : 'text-foreground/70 opacity-50',
              ]"
            />
          </div>
          <div class="ml-2 flex flex-1 flex-col truncate">
            <div class="flex items-center gap-1.5 truncate">
              <span
                class="truncate text-[14px] transition-all"
                :class="
                  selectedNodeId === node.serverId
                    ? 'text-primary'
                    : 'text-foreground/70'
                "
              >
                {{ node.alias || node.host }}
              </span>
            </div>
            <span
              class="text-[11px] opacity-50 transition-all"
              :class="selectedNodeId === node.serverId ? 'text-primary' : ''"
            >
              {{ node.host }}
            </span>
          </div>
        </div>
      </Spin>

      <div class="my-2 h-px bg-border/40"></div>

      <div class="nav-group-title">{{ $t('file.sidebar.buckets') }}</div>
      <div
        class="nav-item-role transition-all"
        :class="selectedBucket === 'all' ? 'bg-primary/20 font-bold' : ''"
        @click="emit('selectBucket', 'all')"
      >
        <BoxIcon
          class="size-4.5 transition-all"
          :class="[
            selectedBucket === 'all'
              ? 'text-primary opacity-100'
              : 'text-foreground/70 opacity-70',
          ]"
        />
        <span
          class="text-[14px]"
          :class="
            selectedBucket === 'all' ? 'text-primary' : 'text-foreground/70'
          "
        >
          {{ $t('file.sidebar.root') }}
        </span>
      </div>

      <div
        class="nav-item-role transition-all"
        :class="selectedBucket === 'default' ? 'bg-primary/20 font-bold' : ''"
        @click="emit('selectBucket', 'default')"
      >
        <FolderIcon
          class="size-4.5 transition-all"
          :class="[
            selectedBucket === 'default'
              ? 'text-primary opacity-100'
              : 'text-foreground/70 opacity-30',
          ]"
        />
        <div class="ml-2 flex flex-1 flex-col truncate">
          <span
            class="text-[14px]"
            :class="
              selectedBucket === 'default'
                ? 'text-primary'
                : 'text-foreground/70'
            "
          >
            {{ $t('file.sidebar.defaultStorage') }}
          </span>
          <span
            class="text-[11px] font-normal opacity-50 transition-all"
            :class="selectedBucket === 'default' ? 'text-primary' : ''"
          >
            {{ $t('file.sidebar.defaultStorageDesc') }}
          </span>
        </div>
      </div>

      <Spin :spinning="loadingBuckets" size="small">
        <div
          v-for="bucket in bucketList"
          :key="bucket.id"
          class="nav-item-role group/item transition-all"
          :class="selectedBucket === bucket.id ? 'bg-primary/20 font-bold' : ''"
          @click="emit('selectBucket', bucket.id)"
        >
          <FolderIcon
            class="size-4.5 outline-none transition-all"
            :class="[
              selectedBucket === bucket.id
                ? 'text-primary opacity-100'
                : 'text-foreground/70 opacity-30 group-hover/item:opacity-70',
            ]"
          />
          <div class="ml-2 flex flex-1 flex-col truncate">
            <div class="flex items-center gap-1.5 truncate">
              <span
                class="text-[14px]"
                :class="
                  selectedBucket === bucket.id
                    ? 'text-primary'
                    : 'text-foreground/70'
                "
              >
                {{ bucket.name }}
              </span>
              <LockIcon
                v-if="bucket.system"
                class="size-3 text-foreground/30"
              />
            </div>
            <span
              v-if="bucket.description"
              class="truncate text-[11px] opacity-50"
              :class="selectedBucket === bucket.id ? 'text-primary' : ''"
            >
              {{ bucket.description }}
            </span>
          </div>
          <Dropdown
            v-if="!bucket.system"
            :trigger="['click']"
            class="opacity-0 transition-opacity group-hover/item:opacity-100"
          >
            <MoreVerticalIcon
              class="size-4 cursor-pointer hover:text-primary"
              @click.stop
            />
            <template #overlay>
              <Menu>
                <Menu.Item @click="emit('editBucket', bucket)">
                  <template #icon><EditIcon class="size-4" /></template>
                  {{ $t('file.action.edit') }}
                </Menu.Item>
                <Menu.Item danger @click="emit('deleteBucket', bucket)">
                  <template #icon><Trash2Icon class="size-4" /></template>
                  {{ $t('file.action.delete') }}
                </Menu.Item>
              </Menu>
            </template>
          </Dropdown>
        </div>
      </Spin>
    </nav>
  </Card>
</template>

<style scoped>
.nav-group-title {
  @apply px-3 py-2 text-[12px] font-bold uppercase tracking-wider text-foreground/40;
}

.nav-item-role {
  @apply flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-primary/10;
}
</style>
