import type { ApplicationApi } from '#/api/system/application';
import type { SsoApi } from '#/api/system/sso';

import { onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { message, notification } from 'ant-design-vue';

import { getAccessCodesApi } from '#/api';
import {
  appSsoNotifyGet,
  appSsoNotifyResultGet,
  appSsoRegister,
  bindAppMe,
  getAppSsoLoginUrl,
  queryAppSsoAll,
} from '#/api/system/sso';
import { useAuthStore } from '#/store';

// SSO 的所有可能内部状态
export type SsoStatus =
  | 'binding'
  | 'error'
  | 'idle'
  | 'loadingApps'
  | 'loginSuccess'
  | 'needBind'
  | 'notifying'
  | 'redirecting'
  | 'registering'
  | 'waitingResult';

export function useSsoLogin() {
  const router = useRouter();
  const authStore = useAuthStore();
  const userStore = useUserStore();

  // 核心状态机
  const status = ref<SsoStatus>('idle');
  // 可用的 SSO 应用程序列表
  const availableApps = ref<ApplicationApi.ApplicationInfo[]>([]);
  // 绑定时需要的 Code
  const bindCode = ref<string>('');
  // 异常或错误情况下的提示信息
  const errorMessage = ref<string>('');
  // 第三方平台信息缓存 (用于弹窗展示)
  const currentProviderName = ref<string>('');

  // 用于清理短轮询定时器
  let pollingTimer: null | number = null;
  const POLLING_MAX_TRIES = 30;
  const POLLING_INTERVAL_MS = 1000;

  onUnmounted(() => {
    if (pollingTimer) {
      clearTimeout(pollingTimer);
    }
  });

  /**
   * 1. 查询可用的 SSO 应用列表
   */
  async function loadApps() {
    try {
      status.value = 'loadingApps';
      const apps = await queryAppSsoAll();
      availableApps.value = apps || [];
      status.value = 'idle';
    } catch (error: any) {
      status.value = 'error';
      errorMessage.value = error?.message || $t('sso.loadAppsFailed');
    }
  }

  /**
   * 2. 用户点击某个三方应用，获取跳转链接并进行重定向
   */
  async function loginWithApp(
    app: ApplicationApi.ApplicationInfo,
    scene: 'bind' | 'login' = 'login',
  ) {
    if (status.value === 'redirecting') return;
    try {
      status.value = 'redirecting';
      // Store into localStorage to survive cross window/cross tab redirects
      localStorage.setItem('sso_login_app_id', app.id);

      const url = await getAppSsoLoginUrl(app.id, scene);
      if (url) {
        window.open(url, '_blank');
        // Because of window.open, let's restore idle immediately so the UI doesn't spin forever
        status.value = 'idle';
      } else {
        throw new Error('SSO Login URL is empty');
      }
    } catch (error: any) {
      status.value = 'error';
      errorMessage.value = error?.message || $t('sso.redirectFailed');
    }
  }

  /**
   * 3. 授权回调着陆页处理 (先 Notify，然后轮询 Result)
   */
  async function handleCallback(appId: string, query: Record<string, string>) {
    try {
      status.value = 'notifying';
      // 3.1 提交 state 和 code 给后端进行回调通知
      await appSsoNotifyGet(appId, query);

      // 3.2 开始短轮询结果
      status.value = 'waitingResult';
      await startPollingResult(appId, query.state || '');
    } catch (error: any) {
      status.value = 'error';
      errorMessage.value =
        error?.message ||
        $t('authentication.sso.notifyFailed', '处理第三方授权回调失败');
    }
  }

  /**
   * 短轮询查询最终处理结果
   */
  async function startPollingResult(appId: string, state: string, tries = 0) {
    if (tries >= POLLING_MAX_TRIES) {
      status.value = 'error';
      errorMessage.value = $t('sso.timeout');
      return;
    }

    try {
      const result = await appSsoNotifyResultGet(appId, { state });

      // 分支 A: 已经绑定平台账号，直接完成登录
      if (result.bound && result.token) {
        const accessStore = useAccessStore();
        accessStore.setAccessToken(result.token);

        // Fetch User Info & Access Codes in parallel like standard login
        const [userInfo, accessCodes] = await Promise.all([
          authStore.fetchUserInfo(),
          getAccessCodesApi(),
        ]);

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(accessCodes);

        status.value = 'loginSuccess';

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          router.push(userInfo.homePath || preferences.app.defaultHomePath);
        }

        if (userInfo?.realName) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }

        // Clean up
        localStorage.removeItem('sso_login_app_id');

        return;
      }

      // 分支 B: 未绑定账号，且后端抛出了由下一步去进行绑定的 bindCode
      if (result.bound === false && result.bindCode) {
        bindCode.value = result.bindCode || '';
        status.value = 'needBind';
        return;
      }

      // 未命中确定态，说明后端还在处理中，继续轮询
      pollingTimer = window.setTimeout(() => {
        startPollingResult(appId, state, tries + 1);
      }, POLLING_INTERVAL_MS);
    } catch (error: any) {
      // 查询报错也算作最终异常
      status.value = 'error';
      errorMessage.value = error?.message || $t('sso.queryResultFailed');
    }
  }

  /**
   * 4. 确认绑定当前账号
   */
  async function confirmBind() {
    if (!bindCode.value) return false;

    try {
      status.value = 'binding';
      await bindAppMe(bindCode.value);
      status.value = 'loginSuccess';
      return true;
    } catch (error: any) {
      status.value = 'needBind'; // 回退状态
      message.error(error?.message || $t('sso.bindFailed'));
      return false;
    }
  }

  /**
   * 5. 未开启自动建号: 填写完备信息后注册并绑定
   */
  async function confirmRegister(form: SsoApi.ApplicationSsoRegisterRequest) {
    if (!bindCode.value) return false;

    try {
      status.value = 'registering';
      const result = await appSsoRegister(bindCode.value, form);

      // Auto login after register success
      if (result.token) {
        const accessStore = useAccessStore();
        accessStore.setAccessToken(result.token);

        const [userInfo, accessCodes] = await Promise.all([
          authStore.fetchUserInfo(),
          getAccessCodesApi(),
        ]);

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(accessCodes);

        status.value = 'loginSuccess';

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          router.push(userInfo.homePath || preferences.app.defaultHomePath);
        }

        if (userInfo?.realName) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }

        localStorage.removeItem('sso_login_app_id');
        return true;
      }

      status.value = 'idle';
      message.success($t('sso.registerSuccess', '注册成功，请重新登录'));
      resetError();
      return true;
    } catch (error: any) {
      status.value = 'needBind'; // 回退状态
      message.error(error?.message || $t('sso.registerFailed', '注册失败'));
      return false;
    }
  }

  /**
   * 重置错误状态
   */
  function resetError() {
    status.value = 'idle';
    errorMessage.value = '';
    router.push('/auth/login');
  }

  return {
    status,
    availableApps,
    bindCode,
    errorMessage,
    currentProviderName,
    loadApps,
    loginWithApp,
    handleCallback,
    confirmBind,
    confirmRegister,
    resetError,
  };
}
