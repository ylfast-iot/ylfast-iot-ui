import type { UserDetail } from '#/adapter';

import { adaptUserInfo } from '#/adapter';
import { requestClient } from '#/api/request';

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return requestClient.get<UserDetail>('/user/detail').then(adaptUserInfo);
}
