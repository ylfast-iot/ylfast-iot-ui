/**
 * 通用组件共同的使用的基础组件，原先放在 adapter/form 内部，限制了使用范围，这里提取出来，方便其他地方使用
 * 可用于 vben-form、vben-modal、vben-drawer 等组件使用,
 */

import { globalShareState } from '@vben/common-ui';

import { notification } from 'ant-design-vue';

import { getGlobalComponents } from './components';

// New import
async function initComponentAdapter() {
  // 将组件注册到全局共享状态中
  globalShareState.setComponents(getGlobalComponents());

  // 定义全局共享状态中的消息提示
  globalShareState.defineMessage({
    // 复制成功消息提示
    copyPreferencesSuccess: (title, content) => {
      notification.success({
        description: content,
        message: title,
        placement: 'bottomRight',
      });
    },
  });
}

export { initComponentAdapter };
