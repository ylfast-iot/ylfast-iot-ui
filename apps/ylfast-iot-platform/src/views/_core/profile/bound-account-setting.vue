<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

import { Avatar, Button, message, Popconfirm, Spin } from 'ant-design-vue';

import { queryAppBindingsMe, SsoApi, unbindAppMe } from '#/api/system/sso';
import { useSsoLogin } from '#/views/_core/authentication/hooks/useSsoLogin';

const loading = ref(false);
const bindings = ref<SsoApi.BoundApplicationInfo[]>([]);
const { loginWithApp } = useSsoLogin();

async function loadData() {
  loading.value = true;
  try {
    const res = await queryAppBindingsMe();
    bindings.value = res || [];
  } catch (error: any) {
    message.error(error.message || '获取绑定信息失败');
  } finally {
    loading.value = false;
  }
}

async function handleBind(app: SsoApi.BoundApplicationInfo) {
  loading.value = true;
  await loginWithApp(app as any, 'bind');
  loading.value = false;
}

async function handleUnbind(app: SsoApi.BoundApplicationInfo) {
  try {
    loading.value = true;
    await unbindAppMe(app.id);
    message.success('已解除绑定');
    await loadData();
  } catch (error: any) {
    message.error(error.message || '解绑失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    loadData();
  }
}
</script>

<template>
  <Spin :spinning="loading" wrapper-class-name="h-full">
    <div class="flex h-full flex-col gap-4">
      <div
        v-for="app in bindings"
        :key="app.id"
        class="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4 transition-all hover:shadow-sm dark:border-gray-800 dark:bg-gray-800/50"
      >
        <div class="flex items-center gap-4">
          <Avatar
            :src="app.logoUrl"
            :size="48"
            class="border bg-white font-bold text-primary shadow-sm"
          >
            <!-- 默认展示名称第一个字 -->
            {{ app.name?.charAt(0) }}
          </Avatar>

          <div class="flex flex-col justify-center">
            <span
              class="text-base font-medium text-gray-800 dark:text-gray-200"
            >
              {{ app.name }}
            </span>
            <div class="mt-0.5 flex items-center gap-2">
              <span
                class="text-sm"
                :class="app.bound ? 'text-green-500' : 'text-gray-400'"
              >
                {{ app.bound ? '已绑定' : '未绑定' }}
              </span>
              <template v-if="app.bound && app.applicationUserId">
                <span class="text-gray-300 dark:text-gray-600">|</span>
                <span class="text-gray-500 dark:text-gray-400">
                  {{
                    app.others?.name ||
                    app.others?.nickname ||
                    app.others?.username ||
                    app.applicationUserId ||
                    '未知账号'
                  }}（已绑定的用户名）
                </span>
              </template>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            v-if="!app.bound"
            type="primary"
            ghost
            class="!rounded-md"
            @click="handleBind(app)"
          >
            立即绑定
          </Button>

          <Popconfirm
            v-else
            title="确定要解除与该平台账号的绑定吗？"
            @confirm="handleUnbind(app)"
          >
            <Button danger ghost class="!rounded-md"> 解除绑定 </Button>
          </Popconfirm>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="bindings.length === 0 && !loading"
        class="flex flex-col items-center justify-center py-20"
      >
        <span class="text-gray-400">暂无可绑定的第三方应用</span>
      </div>
    </div>
  </Spin>
</template>

<style scoped></style>
