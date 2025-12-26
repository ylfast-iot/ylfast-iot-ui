<script setup lang="ts">
import type { UserDetail } from '#/adapter/hsweb/user';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import {
  Avatar,
  Button,
  Card,
  Divider,
  message,
  Tag,
  Upload,
} from 'ant-design-vue';

import { getUserInfoApi } from '#/api';
import { uploadApi } from '#/api/system/file';
import { saveUserDetails } from '#/api/system/user';
import { $t } from '#/locales';

import ProfileBase from './base-setting.vue';
import ProfileNotificationSetting from './notification-setting.vue';
import ProfilePasswordSetting from './password-setting.vue';
import ProfileSecuritySetting from './security-setting.vue';

const UploadIcon = createIconifyIcon('lucide:upload');
const UserIcon = createIconifyIcon('lucide:user');
const RoleIcon = createIconifyIcon('lucide:shield-check');
const OrgIcon = createIconifyIcon('lucide:building-2');
const SettingsIcon = createIconifyIcon('lucide:settings');
const LockIcon = createIconifyIcon('lucide:lock');

const activeTab = ref<string>('basic');
const userInfo = ref<Partial<UserDetail>>({});
const avatarUrl = ref<string>('');

const profileBaseRef = ref();

const menuItems = computed(() => [
  { key: 'basic', label: $t('profile.basic'), icon: SettingsIcon },
  { key: 'password', label: $t('profile.password'), icon: LockIcon },
  // { key: 'security', label: $t('profile.security'), icon: ShieldIcon }, // Hidden
  // { key: 'notice', label: $t('profile.notice'), icon: BellIcon }, // Hidden
]);

const currentComponent = computed(() => {
  switch (activeTab.value) {
    case 'basic': {
      return ProfileBase;
    }
    case 'notice': {
      return ProfileNotificationSetting;
    }
    case 'password': {
      return ProfilePasswordSetting;
    }
    case 'security': {
      return ProfileSecuritySetting;
    }
    default: {
      return ProfileBase;
    }
  }
});

onMounted(async () => {
  await fetchUserData();
});

async function fetchUserData() {
  const data = await getUserInfoApi();
  userInfo.value = data;
  avatarUrl.value = data.avatar || '';
}

/**
 * 封装上传头像接口
 */
async function uploadAvatarApi(file: File) {
  return uploadApi({
    bucketName: 'static',
    dir: 'avatar',
    file,
    filename: file.name,
  });
}

/**
 * 自定义上传请求
 */
async function handleCustomRequest(options: any) {
  const { file, onSuccess, onError } = options;
  try {
    const res = await uploadAvatarApi(file);
    const newAvatarUrl = res.url;

    // 更新本地显示
    avatarUrl.value = newAvatarUrl;

    // 立即保存到用户信息
    await saveUserDetails({
      ...userInfo.value,
      avatar: newAvatarUrl,
    });

    message.success($t('profile.info.updateSuccess'));
    onSuccess(res);

    // 刷新用户信息以确保同步
    await fetchUserData();
  } catch (error) {
    console.error(error);
    message.error($t('common.action.uploadFail'));
    onError(error);
  }
}

// 监听子组件更新成功，刷新左侧信息
async function handleUpdateSuccess() {
  await fetchUserData();
}
</script>

<template>
  <Page auto-content-height>
    <div class="h-full p-4">
      <Card
        :body-style="{ height: '100%', padding: '0' }"
        class="h-full overflow-hidden border-none shadow-sm"
      >
        <div class="flex h-full flex-col md:flex-row">
          <!-- Left Sidebar -->
          <div
            class="h-full w-full shrink-0 overflow-y-auto border-r border-gray-100 bg-gray-50/50 p-6 md:w-80 dark:border-gray-800 dark:bg-gray-900/50"
          >
            <!-- User Info -->
            <div class="flex flex-col items-center">
              <div class="group relative mb-4">
                <Avatar
                  :size="100"
                  :src="avatarUrl"
                  class="flex items-center justify-center border-4 border-white shadow-sm dark:border-gray-700"
                >
                  <template #icon><UserIcon class="size-12" /></template>
                </Avatar>
                <div class="absolute bottom-0 right-0">
                  <Upload
                    name="avatar"
                    :show-upload-list="false"
                    :custom-request="handleCustomRequest"
                  >
                    <Button
                      type="primary"
                      shape="circle"
                      size="small"
                      class="shadow-sm"
                    >
                      <template #icon><UploadIcon class="size-3.5" /></template>
                    </Button>
                  </Upload>
                </div>
              </div>
              <h2 class="text-lg font-bold text-gray-800 dark:text-white">
                {{ userInfo.realName }}
              </h2>
              <p class="text-sm text-gray-500">@{{ userInfo.username }}</p>
            </div>

            <Divider class="my-6" />

            <!-- Roles & Orgs -->
            <div class="space-y-5">
              <!-- 角色 -->
              <div class="flex gap-3">
                <div class="mt-0.5 text-gray-400">
                  <RoleIcon class="size-4.5" />
                </div>
                <div class="flex-1">
                  <div class="mb-2 text-xs font-medium uppercase text-gray-500">
                    {{ $t('profile.info.role') }}
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <template
                      v-if="
                        userInfo.username === 'admin' ||
                        userInfo.type?.value === 'admin'
                      "
                    >
                      <Tag class="mr-0 border-red-200 bg-red-50 text-red-600">
                        {{ $t('profile.info.allRoles') }}
                      </Tag>
                    </template>
                    <template v-else-if="userInfo.roleList?.length">
                      <Tag
                        v-for="role in userInfo.roleList"
                        :key="role.id"
                        class="mr-0 border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {{ role.name }}
                      </Tag>
                    </template>
                    <span v-else class="text-xs text-gray-400">{{
                      $t('profile.info.noRole')
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- 组织 -->
              <div class="flex gap-3">
                <div class="mt-0.5 text-gray-400">
                  <OrgIcon class="size-4.5" />
                </div>
                <div class="flex-1">
                  <div class="mb-2 text-xs font-medium uppercase text-gray-500">
                    {{ $t('profile.info.org') }}
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <template v-if="userInfo.orgList?.length">
                      <Tag
                        v-for="org in userInfo.orgList"
                        :key="org.id"
                        class="mr-0 border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {{ org.name }}
                      </Tag>
                    </template>
                    <span v-else class="text-xs text-gray-400">{{
                      $t('profile.info.noOrg')
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <Divider class="my-6" />

            <!-- Navigation Menu -->
            <div class="space-y-1">
              <div
                v-for="item in menuItems"
                :key="item.key"
                class="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-white hover:shadow-sm dark:hover:bg-gray-800"
                :class="{
                  'bg-white text-primary shadow-sm dark:bg-gray-800':
                    activeTab === item.key,
                  'text-gray-600 dark:text-gray-400': activeTab !== item.key,
                }"
                @click="activeTab = item.key"
              >
                <component
                  :is="item.icon"
                  class="size-5 transition-colors"
                  :class="{
                    'text-primary': activeTab === item.key,
                    'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300':
                      activeTab !== item.key,
                  }"
                />
                <span class="font-medium">{{ item.label }}</span>
              </div>
            </div>
          </div>

          <!-- Right Content -->
          <div class="h-full flex-1 overflow-y-auto p-6 md:p-10">
            <h2 class="mb-6 text-xl font-bold text-gray-800 dark:text-white">
              {{ menuItems.find((i) => i.key === activeTab)?.label }}
            </h2>
            <component
              :is="currentComponent"
              ref="profileBaseRef"
              @success="handleUpdateSuccess"
            />
          </div>
        </div>
      </Card>
    </div>
  </Page>
</template>
