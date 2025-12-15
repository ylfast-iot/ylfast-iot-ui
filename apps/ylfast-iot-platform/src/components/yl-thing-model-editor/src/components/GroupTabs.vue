<script setup lang="ts">
import { computed, ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Dropdown,
  Input,
  Menu,
  MenuItem,
  message,
  Modal,
} from 'ant-design-vue';

interface Group {
  id: string;
  name: string;
}

const props = defineProps<{
  activeGroup?: string;
  disabled?: boolean;
  groups: Group[];
}>();

const emit = defineEmits<{
  (e: 'update:activeGroup', val: string): void;
  (e: 'change', val: string): void;
  (e: 'update:groups', val: Group[]): void;
  (
    e: 'groupIdChange',
    val: { newGroups: Group[]; newId: string; oldId: string },
  ): void;
}>();

const PlusOutlined = createIconifyIcon('ant-design:plus-outlined');
const EditOutlined = createIconifyIcon('ant-design:edit-outlined');
const DeleteOutlined = createIconifyIcon('ant-design:delete-outlined');
const MoreOutlined = createIconifyIcon('ant-design:more-outlined');

const activeKey = computed({
  get: () => props.activeGroup || 'all',
  set: (val) => {
    emit('update:activeGroup', val);
    emit('change', val);
  },
});

const groupList = computed(() => props.groups || []);

// Modal for Add/Edit Group
const groupModalVisible = ref(false);
const groupForm = ref<Group>({ id: '', name: '' });
const isEdit = ref(false);
const editingGroupId = ref<null | string>(null);

function openAddGroup() {
  let newId = `group_${Date.now()}`;
  while (groupList.value.some((g) => g.id === newId)) {
    newId = `group_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
  const newName = `${$t('thingModel.property.newGroup')}${groupList.value.length + 1}`;

  const newGroup = { id: newId, name: newName };
  const updatedGroups = [...groupList.value, newGroup];

  emit('update:groups', updatedGroups); // 更新分组列表
  activeKey.value = newId; // 选中新分组
  message.success($t('thingModel.property.addGroupSuccess'));
}

function openEditGroup(group: Group) {
  isEdit.value = true;
  groupForm.value = { ...group };
  editingGroupId.value = group.id;
  groupModalVisible.value = true;
}

function handleGroupSubmit() {
  if (!groupForm.value.name) {
    message.error($t('thingModel.property.groupName') + $t('common.required'));
    return;
  }

  if (!groupForm.value.id) {
    message.error($t('thingModel.property.groupId') + $t('common.required'));
    return;
  }

  // The modal is now only for editing, so isEdit will always be true here.
  const oldId = editingGroupId.value;
  const newId = groupForm.value.id;

  const newGroups = [...groupList.value];

  // Check if new ID already exists (and it's not the same group)
  if (oldId !== newId && newGroups.some((g) => g.id === newId)) {
    message.error($t('thingModel.common.uniqueIdError'));
    return;
  }

  const index = newGroups.findIndex((g) => g.id === oldId);
  if (index !== -1) {
    newGroups[index] = { ...groupForm.value };
  }

  let idChanged = false;
  if (oldId && oldId !== newId) {
    idChanged = true;
    emit('groupIdChange', { newGroups, newId, oldId });
    if (activeKey.value === oldId) {
      activeKey.value = newId;
    }
  }

  if (!idChanged) {
    emit('update:groups', newGroups);
  }
  groupModalVisible.value = false;
}

function handleDeleteGroup(id: string) {
  Modal.confirm({
    title: $t('common.delete'),
    content: `${$t('thingModel.property.deleteGroup')}?`,
    onOk: () => {
      const newGroups = groupList.value.filter((g) => g.id !== id);
      emit('update:groups', newGroups);
      if (activeKey.value === id) {
        activeKey.value = 'all';
      }
    },
  });
}
</script>

<template>
  <div
    class="group-tabs-container flex items-center gap-1 overflow-x-auto rounded-md bg-gray-100/80 p-1 dark:bg-gray-800/80"
  >
    <!-- All Group -->
    <div
      class="tab-item"
      :class="{
        active: activeKey === 'all',
        disabled,
      }"
      @click="!disabled && (activeKey = 'all')"
    >
      {{ $t('thingModel.property.allGroups') }}
    </div>

    <!-- Custom Groups -->
    <div
      v-for="group in groupList"
      :key="group.id"
      class="tab-item group relative flex items-center justify-between gap-1"
      :class="{
        active: activeKey === group.id,
        disabled,
      }"
      @click="!disabled && (activeKey = group.id)"
      @dblclick="!disabled && openEditGroup(group)"
    >
      <span class="min-w-0 flex-1 truncate">{{ group.name }}</span>
      <div class="shrink-0" @click.stop>
        <Dropdown
          v-if="!disabled"
          :trigger="['click']"
          overlay-class-name="group-tab-dropdown-overlay"
        >
          <div
            class="flex size-5 cursor-pointer items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
            :class="{
              'text-primary hover:bg-primary/10 hover:text-primary':
                activeKey === group.id,
            }"
          >
            <MoreOutlined />
          </div>
          <template #overlay>
            <Menu>
              <MenuItem @click="openEditGroup(group)">
                <span class="flex items-center gap-2">
                  <EditOutlined /> {{ $t('common.edit') }}
                </span>
              </MenuItem>
              <MenuItem danger @click="handleDeleteGroup(group.id)">
                <span class="flex items-center gap-2">
                  <DeleteOutlined /> {{ $t('common.delete') }}
                </span>
              </MenuItem>
            </Menu>
          </template>
        </Dropdown>
      </div>
    </div>

    <!-- Add Button -->
    <div
      class="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded text-gray-400 transition-all hover:bg-white hover:text-primary hover:shadow-sm dark:hover:bg-gray-700"
      :class="{ 'pointer-events-none opacity-50': disabled }"
      @click="openAddGroup"
    >
      <PlusOutlined />
    </div>

    <!-- Modals -->
    <Modal
      v-model:open="groupModalVisible"
      :title="$t('thingModel.property.editGroup')"
      @ok="handleGroupSubmit"
    >
      <div class="pt-4">
        <div class="mb-2">
          {{ $t('thingModel.property.groupName') }}
          <span class="text-red-500">*</span>
        </div>
        <Input
          v-model:value="groupForm.name"
          :placeholder="
            $t('thingModel.common.pleaseEnter') +
            $t('thingModel.property.groupName')
          "
        />
        <div class="mt-4">
          <div class="mb-2">
            {{ $t('thingModel.property.groupId') }}
            <span class="text-red-500">*</span>
          </div>
          <Input
            v-model:value="groupForm.id"
            :placeholder="$t('thingModel.common.autoGenerated')"
          />
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.tab-item {
  @apply relative flex h-7 cursor-pointer select-none items-center rounded border border-transparent px-3 text-sm text-gray-500 transition-all dark:text-gray-400;
}

.tab-item:hover {
  @apply text-gray-700 dark:text-gray-200;
}

.tab-item.active {
  @apply border-gray-200 bg-white text-primary shadow-sm dark:border-gray-700 dark:bg-gray-900;
}

.tab-item.disabled {
  @apply pointer-events-none opacity-50;
}

/* Hide scrollbar */
.group-tabs-container::-webkit-scrollbar {
  height: 0;
  background: transparent;
}
</style>

<style>
.group-tab-dropdown-overlay .ant-dropdown-menu {
  /* min-width: 160px; */
}
</style>
