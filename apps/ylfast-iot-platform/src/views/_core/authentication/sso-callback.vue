<script setup lang="ts">
import type { SsoApi } from '#/api/system/sso';

import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { useUserStore } from '@vben/stores';

import { Avatar, Button, message, Result, Spin } from 'ant-design-vue';

import { getAppBindCode } from '#/api/system/sso';

import SsoBindDialog from './components/SsoBindDialog.vue';
import { useSsoLogin } from './hooks/useSsoLogin';

const route = useRoute();
const userStore = useUserStore();

const appId =
  (route.params.appId as string) ||
  (localStorage.getItem('sso_login_app_id') as string);

const [BindModal, bindModalApi] = useVbenModal({
  connectedComponent: SsoBindDialog,
});

const isLoginMode = ref(false);
const bindInfo = ref<null | SsoApi.BindCode>(null);
const isLoadingBindInfo = ref(false);

const {
  status,
  errorMessage,
  bindCode,
  handleCallback,
  confirmBind,
  confirmRegister,
  resetError,
} = useSsoLogin();

const ArrowRightLeftIcon = createIconifyIcon('lucide:arrow-right-left');
const UserIcon = createIconifyIcon('lucide:user');

onMounted(async () => {
  // 检查是否在已登录页面的新标签页打开回调（通过检测 token 然后加载用户）
  try {
    const { useAccessStore } = await import('@vben/stores');
    const accessStore = useAccessStore();
    if (accessStore.accessToken) {
      if (!userStore.userInfo?.id) {
        const { useAuthStore } = await import('#/store');
        const authStore = useAuthStore();
        await authStore.fetchUserInfo();
      }
      isLoginMode.value = !!userStore.userInfo?.id;
    }
  } catch (error) {
    console.warn('Failed to recover user state', error);
  }

  if (!appId) {
    status.value = 'error';
    errorMessage.value = $t('sso.missingAppId', '缺少应用标识AppId');
    return;
  }

  const rawQuery = route.query;
  const query: Record<string, string> = {};
  for (const key in rawQuery) {
    const val = rawQuery[key];
    query[key] = Array.isArray(val)
      ? (val[0] as string) || ''
      : (val as string) || '';
  }

  if (!query.state) {
    status.value = 'error';
    errorMessage.value = $t('sso.missingState');
    return;
  }

  await handleCallback(appId, query);
  if (status.value === 'needBind') {
    if (isLoginMode.value && bindCode.value) {
      // 当前属于已登录状态的绑定，展示对比页面
      await loadBindInfo();
      // 这里不要去调用 bindModalApi.open()
    } else {
      // 未登录状态，正常打开弹窗进行建号和绑定
      bindModalApi.open();
    }
  }
});

async function loadBindInfo() {
  if (!bindCode.value) return;
  isLoadingBindInfo.value = true;
  try {
    const res = await getAppBindCode(bindCode.value);
    bindInfo.value = res;
  } catch (error: any) {
    message.error(
      error.message || $t('sso.loadBindInfoFailed', '获取绑定信息失败'),
    );
    status.value = 'error';
    errorMessage.value = $t(
      'sso.loadBindInfoFailedDesc',
      '获取绑定信息失败，无法进行对比确认',
    );
  } finally {
    isLoadingBindInfo.value = false;
  }
}

async function handleLoggedBind() {
  const success = await confirmBind();
  if (success) {
    // 因为这里是在个人设置页发起绑定的新标签页中，完成绑定后关闭本页面
    message.success($t('sso.bindSuccessContinuing', '账号绑定成功！'));
    setTimeout(() => {
      window.close();
    }, 1500); // 稍微延迟以让用户看到 Toast 提示
  }
}

function handleBindConfirm(form?: SsoApi.ApplicationSsoRegisterRequest) {
  if (form) {
    confirmRegister(form);
  } else {
    confirmBind();
  }
}

function handleBindCancel() {
  resetError();
}

function handleCancelLoggedBind() {
  window.close();
}
</script>

<template>
  <div
    class="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-black"
  >
    <!-- Processing States -->
    <div
      v-if="
        ['notifying', 'waitingResult'].includes(status) || isLoadingBindInfo
      "
      class="flex min-w-80 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <Spin size="large" />
      <h2 class="mt-6 text-xl font-medium text-gray-800 dark:text-gray-100">
        {{ $t('sso.processing') }}
      </h2>
      <p class="mt-2 text-sm text-gray-500">
        {{ $t('sso.waitMessage') }}
      </p>
    </div>

    <!-- Success State -->
    <div
      v-else-if="status === 'loginSuccess'"
      class="flex min-w-80 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <Result
        status="success"
        :title="$t('authentication.loginSuccess')"
        :sub-title="$t('sso.redirectMessage')"
      >
        <template #extra>
          <Spin />
        </template>
      </Result>
    </div>

    <!-- Logged In Binding required state (对比卡片) -->
    <div
      v-else-if="
        (status === 'needBind' || status === 'binding') &&
        isLoginMode &&
        bindInfo
      "
      class="flex min-h-[420px] w-[780px] max-w-full flex-col rounded-xl border border-gray-100 bg-white p-10 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div class="mb-14 mt-4 text-center">
        <h2
          class="text-[17px] font-normal tracking-widest text-gray-700 dark:text-gray-300"
        >
          {{ $t('sso.thirdPartyBindTitle', '第三方账户绑定') }}
        </h2>
      </div>

      <div class="mb-10 flex w-full items-end justify-center gap-4 px-10">
        <!-- 待绑定第三方账号 -->
        <div class="flex flex-1 flex-col items-center">
          <div class="mb-5 flex h-16 items-center justify-center">
            <!-- 没有头像则占位保持高度一致 -->
            <Avatar
              v-if="
                bindInfo.result?.others?.avatar ||
                bindInfo.result?.others?.avatarUrl
              "
              :size="64"
              :src="
                bindInfo.result?.others?.avatar ||
                bindInfo.result?.others?.avatarUrl
              "
              class="border bg-white font-bold text-primary shadow-sm"
            >
              {{
                bindInfo.providerName?.charAt(0) ||
                $t('sso.thirdParty', '第三方')
              }}
            </Avatar>
          </div>
          <div
            class="mt-2 space-y-2 text-center text-[13px] leading-relaxed text-gray-500"
          >
            <div>
              {{ $t('sso.accountText', '账号') }}：{{
                bindInfo.result?.thirdPartyUserId ||
                bindInfo.result?.description ||
                $t('sso.unknown', '未知')
              }}
            </div>
            <div>
              {{ $t('sso.usernameText', '用户名') }}：{{
                bindInfo.result?.others?.username ||
                bindInfo.result?.others?.nickname ||
                bindInfo.providerName ||
                $t('sso.unknown', '未知')
              }}
            </div>
          </div>
        </div>

        <!-- 连接图标 -->
        <div
          class="flex flex-col items-center justify-center px-2 pb-12 text-gray-400"
        >
          <ArrowRightLeftIcon
            class="text-6xl text-[#94a3b8] opacity-70"
            stroke-width="1.5"
          />
        </div>

        <!-- 当前账号 -->
        <div class="flex flex-1 flex-col items-center">
          <Avatar
            :size="64"
            :src="userStore.userInfo?.avatar"
            class="mb-5 border-none bg-[#d1d5db]"
            shape="square"
          >
            <template #icon>
              <UserIcon class="mt-2.5 text-4xl text-white" />
            </template>
          </Avatar>
          <div
            class="mt-2 space-y-2 text-center text-[13px] leading-relaxed text-gray-500"
          >
            <div>
              {{ $t('sso.accountText', '账号') }}：{{
                userStore.userInfo?.username || '-'
              }}
            </div>
            <div>
              {{ $t('sso.usernameText', '用户名') }}：{{
                userStore.userInfo?.realName || userStore.userInfo?.name || '-'
              }}
            </div>
          </div>
        </div>
      </div>

      <div class="mb-4 mt-8 flex w-full justify-center gap-4">
        <Button
          class="h-9 w-32 !rounded border-none shadow-sm"
          @click="handleCancelLoggedBind"
        >
          {{ $t('common.cancelText', '取消') }}
        </Button>
        <Button
          type="primary"
          class="h-9 w-32 !rounded border-none !bg-[#2563eb] shadow-sm hover:!bg-[#1d4ed8]"
          :loading="status === 'binding'"
          @click="handleLoggedBind"
        >
          {{ $t('sso.bindNow', '立即绑定') }}
        </Button>
      </div>
    </div>

    <!-- Not Logged In Binding required state -->
    <div
      v-else-if="status === 'needBind' || status === 'binding'"
      class="flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <Result
        status="info"
        :title="$t('sso.bindRequired', '需要绑定账号')"
        :sub-title="
          $t(
            'sso.bindRequiredDesc',
            '请在弹出的窗口中确认绑定信息，完成账号关联',
          )
        "
      >
        <template #extra>
          <Spin v-if="status === 'binding'" />
          <Button v-else type="primary" @click="bindModalApi.open()">
            继续绑定
          </Button>
        </template>
      </Result>
    </div>

    <!-- Error State -->
    <div
      v-else-if="status === 'error'"
      class="flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <Result
        status="error"
        :title="$t('sso.authFailed')"
        :sub-title="errorMessage || $t('sso.authFailedDesc')"
      >
        <template #extra>
          <Button type="primary" size="large" @click="resetError">
            {{ $t('sso.backToLogin') }}
          </Button>
        </template>
      </Result>
    </div>

    <!-- Bind Dialog component for Guest Binding -->
    <BindModal
      @confirm="handleBindConfirm"
      @cancel="handleBindCancel"
      :is-register-mode="true"
    />
  </div>
</template>
