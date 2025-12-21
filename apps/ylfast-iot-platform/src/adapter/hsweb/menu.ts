/**
 * Hsweb 菜单适配器
 */

import type { RouteRecordStringComponent } from '@vben/types';

export type ButtonView = {
  /**
   * 说明
   */
  description?: string;

  /**
   * 是否启用（已废弃）
   */
  enabled: boolean;

  /**
   * 是否已授权
   */
  granted: boolean;

  /**
   * 国际化信息定义
   */
  i18nMessages?: Record<string, string>;

  /**
   * 按钮ID
   */
  id: string;

  /**
   * 按钮名称
   */
  name?: string;

  /**
   * 其他配置
   */
  options?: Record<string, any>;
};

/**
 * Hsweb 菜单项接口
 */
export interface HswebMenu {
  /**
   * 在多应用集成运行时使用此字段来区分菜单属于哪个系统
   * 具体标识由各应用前端进行定义
   */
  owner?: string;

  /**
   * 菜单名称
   */
  name: string;

  /**
   * 编码
   */
  code?: string;

  /**
   * 图标
   */
  icon?: string;

  /**
   * URL
   */
  url: string;

  /**
   * 父节点
   */
  parentId?: string;

  /**
   * 描述
   */
  describe?: string; // 保留原字段名（如需规避关键字可改为 description）

  /**
   * 按钮
   */
  buttons?: ButtonView[];

  /**
   * 其他配置
   */
  options?: {
    [key: string]: any;

    // 应用名称
    appName?: string;

    // 外部链接
    linkPath?: string;

    // 链接类型
    linkType?: 'external' | 'inner';

    // 是否显示
    show: boolean;
  };

  /**
   * 子节点
   */
  children?: HswebMenu[];

  /**
   * 创建时间
   */
  createTime?: number;

  /**
   * 数据权限说明
   */
  accessDescription?: string;

  /**
   * 是否已授权
   */
  granted: boolean;

  /**
   * 国际化信息定义
   */
  i18nMessages?: Record<string, Record<string, string>>;

  i18nName?: string;
  /**
   * 树形排序字段
   */
  sortIndex?: number;

  /**
   * 主键 ID
   */
  id?: string;

  [key: string]: any;
}

/**
 * 将 Hsweb 菜单转换为 Vben 菜单
 */
export function adaptHswebMenu(
  menus: HswebMenu[],
): RouteRecordStringComponent[] {
  return menus.map((menu) => {
    let component = menu.component ? `${menu.component}` : 'BasicLayout';
    if (menu.children && menu.children.length > 0) {
      component = '';
    }

    const meta = menu.options || {};

    const vbenMenu: RouteRecordStringComponent = {
      path: menu.url,
      name: menu.path, // 使用 ID 作为路由名称，确保唯一
      component, // 默认为 Layout，具体根据层级调整
      meta: {
        title: menu.i18nName || menu.name,
        icon: menu.icon,
        order: menu.sortIndex,
        ...meta,
      },
    };

    if (menu.children && menu.children.length > 0) {
      vbenMenu.children = adaptHswebMenu(menu.children);
    }

    return vbenMenu;
  });
}
