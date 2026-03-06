import type { Router } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { startProgress, stopProgress } from '@vben/utils';

import { tokenIsValid } from '#/api';
import { accessRoutes, coreRouteNames } from '#/router/routes';
import { useAuthStore } from '#/store';

import { generateAccess } from './access';

/**
 * 通用守卫配置
 * @param router
 */
function setupCommonGuard(router: Router) {
  // 记录已经加载的页面
  const loadedPaths = new Set<string>();

  router.beforeEach((to) => {
    to.meta.loaded = loadedPaths.has(to.path);

    // 页面加载进度条
    if (!to.meta.loaded && preferences.transition.progress) {
      startProgress();
    }
    return true;
  });

  router.afterEach((to) => {
    // 记录页面是否加载,如果已经加载，后续的页面切换动画等效果不在重复执行

    loadedPaths.add(to.path);

    // 关闭页面加载进度条
    if (preferences.transition.progress) {
      stopProgress();
    }
  });
}

/**
 * 权限访问守卫配置
 * @param router
 */
function setupAccessGuard(router: Router) {
  /**
   * 当重定向目标为后端 OAuth2 授权地址时，附带当前登录 token。
   * 目的：前后端分离场景下，避免后端无法识别前端本地 token 导致重复跳转登录页。
   */
  function appendTokenForOAuth2Authorize(
    redirectPath: string,
    accessToken?: string,
  ) {
    if (!/^https?:\/\//i.test(redirectPath) || !accessToken) {
      return redirectPath;
    }
    try {
      const url = new URL(redirectPath, window.location.origin);
      // 仅对 OAuth2 授权入口添加 token，避免污染其他外部跳转。
      if (!url.pathname.endsWith('/oauth2/authorize')) {
        return redirectPath;
      }
      const normalizedToken = accessToken.replace(/^Bearer\s+/i, '');
      if (!normalizedToken) {
        return redirectPath;
      }
      // 始终覆盖 URL 中可能残留的旧 token，避免后端使用过期 token 反复鉴权失败。
      url.searchParams.set('access_token', normalizedToken);
      return url.toString();
    } catch {
      return redirectPath;
    }
  }

  router.beforeEach(async (to, from) => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();
    const authStore = useAuthStore();

    // 基本路由，这些路由不需要进入权限拦截
    if (coreRouteNames.includes(to.name as string)) {
      // 如果token过期了，清空token
      const tokenExist = await tokenIsValid();
      if (to.path === LOGIN_PATH && !tokenExist) {
        accessStore.setAccessToken(null);
        accessStore.setRefreshToken(null);
        accessStore.setIsAccessChecked(false);
      }

      if (to.path === LOGIN_PATH && accessStore.accessToken) {
        const redirectPath = decodeURIComponent(
          (to.query?.redirect as string) ||
            userStore.userInfo?.homePath ||
            preferences.app.defaultHomePath,
        );
        if (/^https?:\/\//i.test(redirectPath)) {
          window.location.href = appendTokenForOAuth2Authorize(
            redirectPath,
            accessStore.accessToken,
          );
          return false;
        }
        return redirectPath;
      }
      return true;
    }

    // accessToken 检查
    if (!accessStore.accessToken) {
      // 明确声明忽略权限访问权限，则可以访问
      if (to.meta.ignoreAccess) {
        return true;
      }

      // 没有访问权限，跳转登录页面
      if (to.fullPath !== LOGIN_PATH) {
        return {
          path: LOGIN_PATH,
          // 如不需要，直接删除 query
          query:
            to.fullPath === preferences.app.defaultHomePath
              ? {}
              : { redirect: encodeURIComponent(to.fullPath) },
          // 携带当前跳转的页面，登录后重新跳转该页面
          replace: true,
        };
      }
      return to;
    }

    // 是否已经生成过动态路由
    if (accessStore.isAccessChecked) {
      return true;
    }

    // 生成路由表
    // 当前登录用户拥有的角色标识列表
    const userInfo = userStore.userInfo || (await authStore.fetchUserInfo());
    const userRoles = userInfo.roles ?? [];

    // 生成菜单和路由
    const { accessibleMenus, accessibleRoutes } = await generateAccess({
      roles: userRoles,
      router,
      // 则会在菜单中显示，但是访问会被重定向到403
      routes: accessRoutes,
    });

    // 保存菜单信息和路由信息
    accessStore.setAccessMenus(accessibleMenus);
    accessStore.setAccessRoutes(accessibleRoutes);
    accessStore.setIsAccessChecked(true);
    const redirectPath = decodeURIComponent(
      (from.query.redirect ??
        (to.path === preferences.app.defaultHomePath
          ? userInfo.homePath || preferences.app.defaultHomePath
          : to.fullPath)) as string,
    );

    if (/^https?:\/\//i.test(redirectPath)) {
      window.location.href = appendTokenForOAuth2Authorize(
        redirectPath,
        accessStore.accessToken,
      );
      return false;
    }

    return {
      ...router.resolve(redirectPath),
      replace: true,
    };
  });
}

/**
 * 项目守卫配置
 * @param router
 */
function createRouterGuard(router: Router) {
  /** 通用 */
  setupCommonGuard(router);
  /** 权限访问 */
  setupAccessGuard(router);
}

export { createRouterGuard };
