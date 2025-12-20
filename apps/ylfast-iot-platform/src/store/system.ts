import type { SystemConfigApi } from '#/api/system/config';

import { updatePreferences } from '@vben/preferences';

import { defineStore } from 'pinia';

import { getConfigs, getScopeConfigDetail } from '#/api/system/config';

interface FrontConfig {
  title?: string;
  logo?: string;
  ico?: string;
  background?: string;
  showRecordNumber?: boolean;
  [key: string]: any;
}

interface AmapConfig {
  apiKey?: string;
  secretKey?: string;
  webKey?: string;
  [key: string]: any;
}

interface PathsConfig {
  'base-path'?: string;
  [key: string]: any;
}

interface SystemState {
  front: FrontConfig;
  amap: AmapConfig;
  paths: PathsConfig;
}

const SYSTEM_CONFIG_KEY = 'SYSTEM_CONFIG_CACHE';

export const useSystemStore = defineStore('system', {
  state: (): SystemState => ({
    front: {},
    amap: {},
    paths: {},
  }),
  actions: {
    /**
     * 初始化公开配置 (无需 Token)
     * 用于 App 启动时 (登录页)
     */
    async initPublicConfig() {
      // 1. Try to load from cache first for instant update
      this.loadFromCache();

      try {
        // 使用无需 Token 的 getConfigs 接口获取前端配置
        const frontConfig = await getConfigs('front');

        if (frontConfig) {
          this.applyConfig(frontConfig);
          // Cache the latest front config
          localStorage.setItem(SYSTEM_CONFIG_KEY, JSON.stringify(frontConfig));
        }
      } catch (error) {
        console.error('Failed to init public config:', error);
      }
    },

    /**
     * 初始化完整配置 (需要 Token)
     * 用于登录成功后
     */
    async initPrivateConfig() {
      try {
        const scopes = ['front', 'amap', 'paths'];
        const res = (await getScopeConfigDetail(
          scopes,
        )) as any as SystemConfigApi.ScopeConfig[];

        res.forEach((item) => {
          switch (item.scope) {
            case 'amap': {
              this.amap = item.properties;

              break;
            }
            case 'front': {
              this.applyConfig(item.properties);
              // Update cache with authenticated config if needed
              localStorage.setItem(
                SYSTEM_CONFIG_KEY,
                JSON.stringify(item.properties),
              );

              break;
            }
            case 'paths': {
              this.paths = item.properties;

              break;
            }
            // No default
          }
        });
      } catch (error) {
        console.error('Failed to init private config:', error);
      }
    },

    loadFromCache() {
      try {
        const cached = localStorage.getItem(SYSTEM_CONFIG_KEY);
        if (cached) {
          const config = JSON.parse(cached);
          this.applyConfig(config);
        }
      } catch {
        // ignore cache error
      }
    },

    applyConfig(config: FrontConfig) {
      // Update store state
      this.front = { ...this.front, ...config };

      // 1. Update System Title
      if (config.title) {
        updatePreferences({
          app: {
            name: config.title,
          },
        });
        if (document.title !== config.title) {
          document.title = config.title;
        }
      }

      // 2. Update Logo
      if (config.logo) {
        updatePreferences({
          logo: {
            source: config.logo,
          },
        });
      }

      // 3. Update ICO
      if (config.ico) {
        this.updateFavicon(config.ico);
      }
    },
    updateFavicon(url: string) {
      let link: HTMLLinkElement | null =
        document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        document.querySelectorAll('head')[0].append(link);
      }
      if (link.href !== url) {
        link.href = url;
      }
    },
  },
});
