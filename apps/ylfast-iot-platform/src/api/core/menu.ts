import type { HswebMenu, QueryParamEntity } from '#/adapter/hsweb';

import { adaptHswebMenu } from '#/adapter/hsweb';
import { requestClient } from '#/api/request';

/**
 * 获取用户所有菜单
 */
export async function getAllMenusApi(params?: QueryParamEntity) {
  // hsweb 获取用户菜单树的接口通常是 /menu/user-own/tree
  // 如果您的接口不同，请修改此处
  const menus = await requestClient.post<HswebMenu[]>(
    '/menu/user-own/tree',
    params,
  );
  return adaptHswebMenu(menus);
}
