export type DimensionType = {
  id: string;
  name: string;
};

/**
 * 维度信息
 */

export interface Dimension {
  id: string;
  name: string;
  type: DimensionType;
  options: Record<string, any>;
}

/**
 * 用户信息
 */
export interface User extends Dimension {
  /**
   * 用户id
   */
  id: string;
  /**
   * 用户名
   */
  username: string;

  /**
   * 维度类型
   */
  type: DimensionType;

  /**
   * 用户类型
   */
  userType: string;

  /**
   * 姓名
   */
  name: string;
}

export interface Permission {
  id: string;
  name: string;
  options?: Record<string, any>;
  actions: string[];
}

export interface Authentication {
  // 用户
  user: User;
  // 用户所有维度
  dimensions: Dimension[];
  // 用户持有的权限集合
  permissions: Permission[];
}

/**
 * 适配权限码
 * @param authentication
 */
export function adaptToPermissionCode(
  authentication: Authentication,
): string[] {
  return authentication.permissions.flatMap((p) =>
    p.actions.map((action) => [p.id, action].join(':')),
  );
}
