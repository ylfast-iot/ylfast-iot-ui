import type { UserInfo } from '@vben/types';

/**
 * 枚举字典接口
 */
interface EnumDict<T = any> {
  value: T;
  text: string;
}

/**
 * 用户实体类型接口
 */
export class UserEntityType implements EnumDict<string> {
  /**
   *  ADMIN("admin", "超级管理员"),
   *     USER("user", "普通用户"),
   *     APPLICATION("application", "第三方用户"),
   *     OTHER("other", "其他");
   */
  static readonly ADMIN = new UserEntityType('admin', '超级管理员', 'blue');
  static readonly APPLICATION = new UserEntityType(
    'application',
    '第三方用户',
    'red',
  );
  static readonly OTHER = new UserEntityType('other', '其他', '');
  static readonly USER = new UserEntityType('user', '普通用户', 'info');

  color?: string;
  text: string;
  value: string;

  constructor(value: string, text: string, color?: string) {
    this.value = value;
    this.text = text;
    this.color = color;
  }
  static of(value: string): UserEntityType {
    switch (value) {
      case 'admin': {
        return UserEntityType.ADMIN;
      }
      case 'application': {
        return UserEntityType.APPLICATION;
      }
      case 'other': {
        return UserEntityType.OTHER;
      }
      case 'user': {
        return UserEntityType.USER;
      }
      default: {
        return UserEntityType.OTHER;
      }
    }
  }

  static values(): UserEntityType[] {
    return [
      UserEntityType.ADMIN,
      UserEntityType.APPLICATION,
      UserEntityType.OTHER,
      UserEntityType.USER,
    ];
  }
}

/**
 * 角色信息
 */
export interface RoleInfo {
  id: string;
  name: string;
}

/**
 * 机构(部门)信息
 */
export interface OrganizationInfo {
  /**
   * 机构(部门ID)
   */
  id?: string;

  /**
   * 名称
   */
  name?: string;

  /**
   * 编码
   */
  code?: string;

  /**
   * 上级ID
   */
  parentId?: string;

  /**
   * 序号
   */
  sortIndex?: number;

  /**
   * 组织机构完整名称
   */
  fullName?: string;
}

/**
 * 用户登录信息
 */
export interface UserLoginInfo {
  loginTime?: number;
  loginIp?: string;
}

/**
 * 用户详情
 */
export interface UserDetail extends UserInfo {
  /**
   * 用户ID
   */
  id: string;

  /**
   * 用户名
   */
  username: string;

  /**
   * 密码（隐藏）
   */
  password: string;

  /**
   * 类型ID（隐藏）
   */
  typeId?: string;

  /**
   * 用户类型（隐藏）
   */
  type?: UserEntityType;

  /**
   * 用户状态。1启用，0禁用
   */
  status: number;

  /**
   * 是否授权
   */
  loggedIn: boolean;

  /**
   * 最后一次请求时间
   */
  lastRequestTime?: number;

  /**
   * 姓名
   */
  name: string;

  /**
   * email
   */
  email: string;

  /**
   * 联系电话
   */
  telephone?: string;

  /**
   * 头像图片地址
   */
  avatar: string;

  /**
   * 说明
   */
  description?: string;

  /**
   * 创建时间
   */
  createTime?: number;

  /**
   * 角色信息
   */
  roleList: RoleInfo[];

  /**
   * 所在机构(部门)信息
   */
  orgList?: OrganizationInfo[];

  /**
   * 创建者ID
   */
  creatorId?: string;

  /**
   * 创建人名称
   */
  creatorName?: string;

  /**
   * 修改人ID
   */
  modifierId?: string;

  /**
   * 修改人名称
   */
  modifierName?: string;

  /**
   * 修改时间
   */
  modifyTime?: number;

  /**
   * 性别
   */
  gender?: EnumDict<string>;

  /**
   * 生日（时间戳）
   */
  birthday?: number;

  /**
   * 真实姓名
   */
  realName: string;

  /**
   * 居民身份证号
   */
  idNumber?: string;

  /**
   * 公司
   */
  company?: string;

  /**
   * 注册方式
   */
  register?: EnumDict<string>;

  /**
   * 登录信息
   */
  loginInfo?: UserLoginInfo;

  /**
   * 关联时间
   */
  relationTime?: number;
}

// 适配用户信息
export function adaptUserInfo(user: UserDetail) {
  user.userId = user.id;
  user.realName = user.realName || user.name || user.type?.text || '未知姓名';
  user.roles = user.roleList?.map((role) => role.id);
  return user;
}
